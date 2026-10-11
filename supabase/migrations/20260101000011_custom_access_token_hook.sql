-- Doc 20 Section 4: Supabase Auth custom JWT claims, implemented as a
-- Postgres function registered with Supabase's "Customize Access Token (JWT)
-- Claims" auth hook. Precedence when a user somehow matches more than one
-- role table: PlatformAdmin > SchoolAdmin > Teacher > Person/FamilyMembership
-- (platform operators and school admins take priority; in practice a given
-- auth user should only ever match exactly one).
--
-- The app-level role is stored under the claim key "app_role", NOT "role".
-- Supabase's JWT already has a top-level "role" claim (always "authenticated"
-- for logged-in users) that PostgREST uses to SET ROLE in Postgres --
-- overwriting it with "admin"/"teacher"/etc. would break that mechanism
-- entirely, since Postgres has no such roles to switch to.
--
-- NOTE: creating this function does not activate it. After this migration is
-- applied, enable it once in the Supabase dashboard: Authentication -> Hooks
-- -> "Customize Access Token (JWT) Claims hook" -> select
-- public.custom_access_token_hook. This is a project-level auth config
-- setting, not something plain SQL can turn on for a hosted project.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
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

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

alter table "PlatformAdmin" enable row level security;
alter table "SchoolAdmin" enable row level security;
alter table "Teacher" enable row level security;
alter table "Person" enable row level security;
alter table "FamilyMembership" enable row level security;

grant select on "PlatformAdmin" to supabase_auth_admin;
grant select on "SchoolAdmin" to supabase_auth_admin;
grant select on "Teacher" to supabase_auth_admin;
grant select on "Person" to supabase_auth_admin;
grant select on "FamilyMembership" to supabase_auth_admin;

create policy "auth_admin_reads_platformadmin" on "PlatformAdmin"
  as permissive for select to supabase_auth_admin using (true);

create policy "auth_admin_reads_schooladmin" on "SchoolAdmin"
  as permissive for select to supabase_auth_admin using (true);

create policy "auth_admin_reads_teacher" on "Teacher"
  as permissive for select to supabase_auth_admin using (true);

create policy "auth_admin_reads_person" on "Person"
  as permissive for select to supabase_auth_admin using (true);

create policy "auth_admin_reads_familymembership" on "FamilyMembership"
  as permissive for select to supabase_auth_admin using (true);
