-- Doc 12 Step 3 ("Add Second Admin (optional, can be done later) -- Name,
-- contact info -> generates activation code") and Doc 3's Admin permissions
-- table ("Add/remove second admin -- Max 2 per school (V1)"). SchoolAdmin
-- has no admin-insert/delete RLS policy (same reasoning as Teacher/Person --
-- see 040_people.sql's note), so both mutations go through SECURITY DEFINER
-- functions, following the same atomic row-insert + activation-code pattern
-- as admin_add_teacher (migration 040): a SchoolAdmin row with no code would
-- be an unreachable admin, the exact bug class migration 040 was written to
-- prevent.
create or replace function admin_add_second_admin(
  p_name text,
  p_contact_info text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_school_id uuid := auth_school_id();
  v_admin_count int;
  v_admin_id uuid;
  v_code text;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can add a second admin';
  end if;

  select count(*) into v_admin_count from "SchoolAdmin" where school_id = v_school_id;
  if v_admin_count >= 2 then
    raise exception 'a school can have at most 2 admins';
  end if;

  insert into "SchoolAdmin" (school_id, name, contact_info)
  values (v_school_id, p_name, p_contact_info)
  returning admin_id into v_admin_id;

  v_code := encode(gen_random_bytes(16), 'hex');
  insert into "ActivationCode" (school_id, target_entity, target_id, code, expires_at)
  values (v_school_id, 'SchoolAdmin', v_admin_id, v_code, now() + interval '7 days');

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id,
    auth_admin_id(),
    'admin',
    'second_admin_added',
    'SchoolAdmin',
    v_admin_id::text,
    jsonb_build_object('name', p_name)
  );

  return jsonb_build_object('admin_id', v_admin_id, 'code', v_code);
end;
$$;

revoke all on function admin_add_second_admin(text, text) from public;
grant execute on function admin_add_second_admin(text, text) to authenticated;

-- An admin can remove the OTHER admin at their school, never themselves --
-- Doc 3's table doesn't spell this guard out, but omitting it would let an
-- admin delete their own row and lock themselves (and possibly the whole
-- school, if it only has the one admin) out entirely.
--
-- Note: this deletes the SchoolAdmin row but can't revoke an
-- already-issued JWT -- a removed admin's existing access token (default
-- Supabase expiry) stays valid for RLS purposes until it naturally expires
-- or is refreshed, at which point custom_access_token_hook finds no
-- SchoolAdmin row and mints a claim-less token. Session revocation is a
-- separate, not-yet-built concern, same limitation Doc 20 Section 5's
-- JWT-claims design has everywhere else in this codebase.
create or replace function admin_remove_second_admin(p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_target_school_id uuid;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can remove another admin';
  end if;

  if p_admin_id = auth_admin_id() then
    raise exception 'cannot remove your own admin account';
  end if;

  select school_id into v_target_school_id from "SchoolAdmin" where admin_id = p_admin_id;
  if v_target_school_id is null or v_target_school_id <> v_school_id then
    raise exception 'target does not belong to your school';
  end if;

  update "ActivationCode"
  set revoked_at = now()
  where target_entity = 'SchoolAdmin'
    and target_id = p_admin_id
    and used_at is null
    and revoked_at is null;

  delete from "SchoolAdmin" where admin_id = p_admin_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (v_school_id, auth_admin_id(), 'admin', 'second_admin_removed', 'SchoolAdmin', p_admin_id::text, '{}'::jsonb);
end;
$$;

revoke all on function admin_remove_second_admin(uuid) from public;
grant execute on function admin_remove_second_admin(uuid) to authenticated;
