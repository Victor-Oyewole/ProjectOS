-- Fixes a real bug found via manual browser testing of Doc 12 Step 4:
-- generating an activation code failed with "function gen_random_bytes
-- (integer) does not exist". pgcrypto lives in the "extensions" schema on
-- this hosted project (confirmed by direct introspection), not "public" --
-- admin_generate_activation_code's `set search_path = public` (migration
-- 037) excluded it, same class of bug as migration 029's
-- custom_access_token_hook fix, just the opposite direction (that one was
-- missing "public"; this one is missing "extensions").
create or replace function admin_generate_activation_code(
  p_target_entity text,
  p_target_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, extensions
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

drop function if exists qa_debug_pgcrypto_schema();
