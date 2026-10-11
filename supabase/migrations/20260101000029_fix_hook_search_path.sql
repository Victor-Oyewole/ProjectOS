-- Fixes a real bug in migration 011's custom_access_token_hook: every sign-in
-- was returning HTTP 500 ("Error running hook URI") because the function's
-- unqualified table references ("PlatformAdmin", "SchoolAdmin", etc.) relied
-- on search_path to resolve to public.* -- but supabase_auth_admin (the role
-- GoTrue actually invokes Postgres hooks as) has its default search_path set
-- to just "auth", not "public". The fully-qualified function call itself
-- succeeded; every unqualified table lookup inside it failed. `set
-- search_path = public` pins resolution for this function regardless of the
-- calling role's own search_path -- the standard fix for this class of bug
-- in Supabase Postgres-hook functions.
--
-- Also drops the qa_debug_* diagnostic functions/table created on the live
-- project while root-causing this, which have no further purpose.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  claims jsonb;
  v_user_id uuid := (event ->> 'user_id')::uuid;
  v_platform_admin_id uuid;
  v_admin_id uuid;
  v_admin_school_id uuid;
  v_teacher_id uuid;
  v_teacher_school_id uuid;
  v_person_id uuid;
  v_membership_id uuid;
  v_family_school_id uuid;
begin
  claims := event -> 'claims';

  select platform_admin_id into v_platform_admin_id
  from "PlatformAdmin"
  where auth_user_id = v_user_id;

  if v_platform_admin_id is not null then
    claims := jsonb_set(claims, '{app_role}', '"platform_admin"');
    claims := jsonb_set(claims, '{platform_admin_id}', to_jsonb(v_platform_admin_id::text));
    event := jsonb_set(event, '{claims}', claims);
    return event;
  end if;

  select admin_id, school_id into v_admin_id, v_admin_school_id
  from "SchoolAdmin"
  where auth_user_id = v_user_id;

  if v_admin_id is not null then
    claims := jsonb_set(claims, '{app_role}', '"admin"');
    claims := jsonb_set(claims, '{school_id}', to_jsonb(v_admin_school_id::text));
    claims := jsonb_set(claims, '{admin_id}', to_jsonb(v_admin_id::text));
    event := jsonb_set(event, '{claims}', claims);
    return event;
  end if;

  select teacher_id, school_id into v_teacher_id, v_teacher_school_id
  from "Teacher"
  where auth_user_id = v_user_id;

  if v_teacher_id is not null then
    claims := jsonb_set(claims, '{app_role}', '"teacher"');
    claims := jsonb_set(claims, '{school_id}', to_jsonb(v_teacher_school_id::text));
    claims := jsonb_set(claims, '{teacher_id}', to_jsonb(v_teacher_id::text));
    event := jsonb_set(event, '{claims}', claims);
    return event;
  end if;

  select p.person_id, fm.membership_id, fm.school_id
  into v_person_id, v_membership_id, v_family_school_id
  from "Person" p
  join "FamilyMembership" fm on fm.person_id = p.person_id and fm.status = 'Active'
  where p.auth_user_id = v_user_id
  order by fm.created_at
  limit 1;

  if v_person_id is not null then
    claims := jsonb_set(claims, '{app_role}', '"family"');
    claims := jsonb_set(claims, '{school_id}', to_jsonb(v_family_school_id::text));
    claims := jsonb_set(claims, '{person_id}', to_jsonb(v_person_id::text));
    claims := jsonb_set(claims, '{membership_id}', to_jsonb(v_membership_id::text));
    event := jsonb_set(event, '{claims}', claims);
    return event;
  end if;

  -- No matching role: leave claims unmodified. RLS policies keyed on a role
  -- claim then simply match nothing -- fail closed, not open.
  return event;
end;
$$;

drop function if exists public.qa_debug_hook_sim(uuid);
drop function if exists public.qa_debug_grants();
drop function if exists public.qa_debug_schema_usage();
drop function if exists public.qa_debug_func_check();
drop function if exists public.qa_debug_role_config();
drop table if exists public.qa_debug_hook_log;
