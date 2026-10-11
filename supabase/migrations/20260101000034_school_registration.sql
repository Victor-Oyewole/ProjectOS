-- Doc 12 Step 1 / Doc 24 Section 2: School self-registration. Milestone 1
-- (Doc 16): "A school admin can fully onboard a school ... end to end
-- without engineering intervention" -- this is the first step of that flow.
--
-- 010_school_and_platform.sql already commits to no client-facing INSERT
-- policy on "School" ("brand-new school owner has no school_id/admin_id
-- claims yet... that flow is deliberately NOT given a client-facing INSERT
-- policy here"). This is also why it CAN'T simply be gated by
-- auth_app_role() = 'admin' the way resolve_or_create_platform_student is --
-- a brand-new signup has no app_role claim at all yet, since the JWT hook
-- only assigns one once a SchoolAdmin/Teacher/Person row exists for that
-- auth_user_id. The only precondition this function can check is that the
-- calling user is authenticated and doesn't already have a SchoolAdmin row.
--
-- Flow: client calls supabase.auth.signUp() first (ordinary Supabase Auth,
-- no activation code -- that's for people the admin invites, not the admin
-- registering themselves), then calls this function with that fresh
-- session. A session refresh/re-sign-in after this returns picks up the
-- admin/school_id claims via the existing custom_access_token_hook.
--
-- Payment gateway integration is explicitly deferred (Doc 17, reaffirmed
-- non-blocking in Doc 23 Section 8) -- registration starts a Trialing
-- subscription per Doc 24 Section 2 step 6 ("31-day free trial begins...
-- no charge yet"), with no gateway call here.
create or replace function register_school(
  p_school_name text,
  p_country text,
  p_admin_name text,
  p_admin_contact text default null,
  p_timezone text default 'Africa/Lagos',
  p_currency text default 'NGN'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_school_id uuid;
  v_admin_id uuid;
begin
  if v_user_id is null then
    raise exception 'register_school requires an authenticated session';
  end if;

  if exists (select 1 from "SchoolAdmin" where auth_user_id = v_user_id) then
    raise exception 'this account is already registered as a school admin';
  end if;

  insert into "School" (name, country, timezone, currency)
  values (p_school_name, p_country, p_timezone, p_currency)
  returning school_id into v_school_id;

  insert into "Subscription" (school_id, tier, status, trial_started_at, trial_ends_at)
  values (v_school_id, 'tier_1', 'Trialing', now(), now() + interval '31 days');

  insert into "SchoolAdmin" (school_id, name, contact_info, auth_user_id, activation_status)
  values (v_school_id, p_admin_name, p_admin_contact, v_user_id, 'Active')
  returning admin_id into v_admin_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id,
    v_admin_id,
    'admin',
    'school_registered',
    'School',
    v_school_id::text,
    jsonb_build_object('school_name', p_school_name, 'admin_name', p_admin_name)
  );

  return v_school_id;
end;
$$;

revoke all on function register_school(text, text, text, text, text, text) from public;
grant execute on function register_school(text, text, text, text, text, text) to authenticated;
