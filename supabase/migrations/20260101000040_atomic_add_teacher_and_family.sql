-- Fixes a real atomicity bug found via manual browser testing: adding a
-- teacher/family did the row INSERT and the activation-code generation as
-- two separate client-side calls (two separate transactions). When the
-- second one failed (the pgcrypto search_path bug fixed in migration 039),
-- the first had already committed -- retrying created ANOTHER orphaned
-- Teacher/Person row with no code, since nothing rolled back the first
-- insert. Same class of problem Doc 23 Section 4's outbox pattern exists to
-- prevent for Assignment+Job (migration 033); the fix here is the same
-- idea: fold the row-creation and the code-generation into one SECURITY
-- DEFINER function, so they're one Postgres transaction and either both
-- happen or neither does.
--
-- admin_add_teacher replaces the two-call sequence
-- (Teacher insert + admin_generate_activation_code RPC) entirely.
create or replace function admin_add_teacher(
  p_name text,
  p_staff_id text default null,
  p_contact_info text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_school_id uuid := auth_school_id();
  v_teacher_id uuid;
  v_code text;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can add a teacher';
  end if;

  insert into "Teacher" (school_id, name, staff_id, contact_info)
  values (v_school_id, p_name, p_staff_id, p_contact_info)
  returning teacher_id into v_teacher_id;

  v_code := encode(gen_random_bytes(16), 'hex');
  insert into "ActivationCode" (school_id, target_entity, target_id, code, expires_at)
  values (v_school_id, 'Teacher', v_teacher_id, v_code, now() + interval '7 days');

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (v_school_id, auth_admin_id(), 'admin', 'teacher_added', 'Teacher', v_teacher_id::text, jsonb_build_object('name', p_name));

  return jsonb_build_object('teacher_id', v_teacher_id, 'code', v_code);
end;
$$;

revoke all on function admin_add_teacher(text, text, text) from public;
grant execute on function admin_add_teacher(text, text, text) to authenticated;

-- admin_create_family_person's return type changes (uuid -> jsonb), which
-- CREATE OR REPLACE can't do -- drop and recreate. Same bootstrap logic as
-- migration 035, now also generating the activation code in the same
-- transaction as the Person + FamilyMembership it was already creating
-- atomically.
drop function if exists admin_create_family_person(text, text);

create or replace function admin_create_family_person(
  p_name text,
  p_contact_info text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_person_id uuid;
  v_membership_id uuid;
  v_school_id uuid := auth_school_id();
  v_code text;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can add a family';
  end if;

  insert into "Person" (name, contact_info, activation_status)
  values (p_name, p_contact_info, 'Pending')
  returning person_id into v_person_id;

  insert into "FamilyMembership" (person_id, school_id, status)
  values (v_person_id, v_school_id, 'Active')
  returning membership_id into v_membership_id;

  v_code := encode(gen_random_bytes(16), 'hex');
  insert into "ActivationCode" (school_id, target_entity, target_id, code, expires_at)
  values (v_school_id, 'Person', v_person_id, v_code, now() + interval '7 days');

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id,
    auth_admin_id(),
    'admin',
    'family_added',
    'Person',
    v_person_id::text,
    jsonb_build_object('name', p_name)
  );

  return jsonb_build_object('membership_id', v_membership_id, 'code', v_code);
end;
$$;

revoke all on function admin_create_family_person(text, text) from public;
grant execute on function admin_create_family_person(text, text) to authenticated;
