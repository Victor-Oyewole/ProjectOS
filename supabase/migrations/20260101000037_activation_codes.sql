-- Doc 12 Step 4/5 + "Teacher Activation"/"Family Activation" sub-flows, and
-- the "Activation Code Lifecycle" section (single-use, 7-day expiry,
-- admin-revocable/regenerable). Doc 10 (Database Schema) never actually
-- specified a table for this -- the behavior is spelled out in detail but
-- the data model was never laid out, so this is a from-scratch design
-- matching that behavioral spec, not a translation of an existing table.
--
-- target_entity/target_id is the same polymorphic-reference pattern
-- AuditLog already uses, since a code can be issued for a SchoolAdmin,
-- Teacher, or Person (family) row.
create table "ActivationCode" (
  activation_code_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  target_entity text not null check (target_entity in ('SchoolAdmin', 'Teacher', 'Person')),
  target_id uuid not null,
  code text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz
);

create index idx_activationcode_school_id on "ActivationCode" (school_id);
create index idx_activationcode_target on "ActivationCode" (target_entity, target_id);

alter table "ActivationCode" enable row level security;

-- Doc 23 Section 6: admin views "pending activations" for their own school.
-- No insert/update policy for anyone -- all mutations go through the
-- SECURITY DEFINER functions below, same reasoning as PlatformStudent/Person
-- (030_student_identity.sql / 040_people.sql's notes).
create policy "activationcode_select_admin" on "ActivationCode"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "activationcode_all_platform_admin" on "ActivationCode"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- Generates a code for a Teacher/Person/SchoolAdmin row at the calling
-- admin's own school. Revokes any still-usable existing code for that
-- target first -- Doc 12's "revocable/regenerable" implies one live code
-- per person at a time, not several accumulating.
create or replace function admin_generate_activation_code(
  p_target_entity text,
  p_target_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_target_school_id uuid;
  v_code text;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can generate an activation code';
  end if;

  if p_target_entity = 'SchoolAdmin' then
    select school_id into v_target_school_id from "SchoolAdmin" where admin_id = p_target_id;
  elsif p_target_entity = 'Teacher' then
    select school_id into v_target_school_id from "Teacher" where teacher_id = p_target_id;
  elsif p_target_entity = 'Person' then
    select fm.school_id into v_target_school_id
    from "FamilyMembership" fm
    where fm.person_id = p_target_id
    order by fm.created_at desc
    limit 1;
  else
    raise exception 'invalid target entity %', p_target_entity;
  end if;

  if v_target_school_id is null or v_target_school_id <> v_school_id then
    raise exception 'target does not belong to your school';
  end if;

  update "ActivationCode"
  set revoked_at = now()
  where target_entity = p_target_entity
    and target_id = p_target_id
    and used_at is null
    and revoked_at is null;

  v_code := encode(gen_random_bytes(16), 'hex');

  insert into "ActivationCode" (school_id, target_entity, target_id, code, expires_at)
  values (v_school_id, p_target_entity, p_target_id, v_code, now() + interval '7 days');

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (v_school_id, auth_admin_id(), 'admin', 'activation_code_generated', p_target_entity, p_target_id::text, '{}'::jsonb);

  return v_code;
end;
$$;

revoke all on function admin_generate_activation_code(text, uuid) from public;
grant execute on function admin_generate_activation_code(text, uuid) to authenticated;

-- Read-only lookup for the public /activate/[code] page, before the person
-- has any account at all -- callable by anon. Doc 12 Teacher/Family
-- Activation step 2, "confirms identity": returns just enough (name,
-- school name) for the person to recognize themselves, nothing sensitive.
create or replace function validate_activation_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row "ActivationCode"%rowtype;
  v_name text;
  v_school_name text;
begin
  select * into v_row from "ActivationCode" where code = p_code;

  if v_row.activation_code_id is null then
    raise exception 'invalid activation code';
  end if;
  if v_row.used_at is not null then
    raise exception 'this activation code has already been used';
  end if;
  if v_row.revoked_at is not null then
    raise exception 'this activation code has been revoked';
  end if;
  if v_row.expires_at < now() then
    raise exception 'this activation code has expired';
  end if;

  if v_row.target_entity = 'SchoolAdmin' then
    select name into v_name from "SchoolAdmin" where admin_id = v_row.target_id;
  elsif v_row.target_entity = 'Teacher' then
    select name into v_name from "Teacher" where teacher_id = v_row.target_id;
  else
    select name into v_name from "Person" where person_id = v_row.target_id;
  end if;

  select name into v_school_name from "School" where school_id = v_row.school_id;

  return jsonb_build_object(
    'target_entity', v_row.target_entity,
    'target_id', v_row.target_id,
    'name', v_name,
    'school_name', v_school_name
  );
end;
$$;

revoke all on function validate_activation_code(text) from public;
grant execute on function validate_activation_code(text) to anon, authenticated;

-- Links a just-created auth user to the pending row the code was issued
-- for, flips activation_status to 'Active', marks the code used. Called by
-- the activation Server Action right after it creates the auth user via
-- the service-role client and signs them in -- p_auth_user_id must be the
-- CALLER's own id (checked against auth.uid()), not an arbitrary one, so
-- possessing a valid code only ever activates the session making the call,
-- never lets one authenticated user activate a role on another's behalf.
create or replace function consume_activation_code(p_code text, p_auth_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row "ActivationCode"%rowtype;
  v_actor_role text;
begin
  if p_auth_user_id <> auth.uid() then
    raise exception 'cannot activate on behalf of another user';
  end if;

  select * into v_row from "ActivationCode" where code = p_code for update;

  if v_row.activation_code_id is null then
    raise exception 'invalid activation code';
  end if;
  if v_row.used_at is not null then
    raise exception 'this activation code has already been used';
  end if;
  if v_row.revoked_at is not null then
    raise exception 'this activation code has been revoked';
  end if;
  if v_row.expires_at < now() then
    raise exception 'this activation code has expired';
  end if;

  if v_row.target_entity = 'SchoolAdmin' then
    update "SchoolAdmin" set auth_user_id = p_auth_user_id, activation_status = 'Active' where admin_id = v_row.target_id;
    v_actor_role := 'admin';
  elsif v_row.target_entity = 'Teacher' then
    update "Teacher" set auth_user_id = p_auth_user_id, activation_status = 'Active' where teacher_id = v_row.target_id;
    v_actor_role := 'teacher';
  else
    update "Person" set auth_user_id = p_auth_user_id, activation_status = 'Active' where person_id = v_row.target_id;
    v_actor_role := 'family';
  end if;

  update "ActivationCode" set used_at = now() where activation_code_id = v_row.activation_code_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (v_row.school_id, p_auth_user_id, v_actor_role, 'activated', v_row.target_entity, v_row.target_id::text, '{}'::jsonb);

  return jsonb_build_object('target_entity', v_row.target_entity, 'school_id', v_row.school_id);
end;
$$;

revoke all on function consume_activation_code(text, uuid) from public;
grant execute on function consume_activation_code(text, uuid) to authenticated;
