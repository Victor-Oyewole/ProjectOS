-- Small helper functions wrapping auth.jwt() claim lookups, so every RLS
-- policy reads the same way instead of repeating ->> '...' casts (Doc 20
-- Section 5's pattern, generalized). STABLE so the planner can cache them
-- within a single statement.

create or replace function auth_app_role()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'app_role';
$$;

create or replace function auth_school_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'school_id')::uuid;
$$;

create or replace function auth_admin_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'admin_id')::uuid;
$$;

create or replace function auth_teacher_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'teacher_id')::uuid;
$$;

create or replace function auth_person_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'person_id')::uuid;
$$;

create or replace function auth_membership_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'membership_id')::uuid;
$$;

create or replace function auth_platform_admin_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() ->> 'platform_admin_id')::uuid;
$$;

create or replace function is_platform_admin()
returns boolean
language sql
stable
as $$
  select auth_app_role() = 'platform_admin';
$$;
