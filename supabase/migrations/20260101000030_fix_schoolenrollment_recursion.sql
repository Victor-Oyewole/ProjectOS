-- Fixes a real bug surfaced by the tenant-isolation test suite
-- (tests/tenant-isolation.test.ts): "infinite recursion detected in policy
-- for relation SchoolEnrollment" (Postgres 42P17) on every query that reads
-- through SchoolEnrollment at all -- Attendance, Assessment, Score,
-- FeeRecord, PlatformStudent, DailyNote, and SchoolEnrollment/ClassMembership
-- themselves.
--
-- Root cause: "schoolenrollment_select_teacher_assigned_classes" subqueries
-- ClassMembership, whose own RLS policies (e.g. "classmembership_all_admin")
-- subquery SchoolEnrollment right back -- a structural cycle Postgres
-- detects and refuses to evaluate, independent of which role is asking or
-- what the data actually is.
--
-- Fix: the SchoolEnrollment side of the cycle looks up ClassMembership
-- through a SECURITY DEFINER function instead of a raw subquery. A
-- SECURITY DEFINER function runs as its owner (postgres, which owns these
-- tables and isn't subject to RLS by default), so the lookup no longer
-- re-triggers ClassMembership's own policies -- breaking the cycle. This is
-- the standard pattern for breaking circular RLS references between two
-- tables that each need to check the other.
create or replace function teacher_assigned_to_enrollment_class(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from "ClassMembership" cm
    join "TeacherClassAssignment" tca on tca.class_id = cm.class_id
    where cm.enrollment_id = p_enrollment_id
      and tca.teacher_id = auth_teacher_id()
  );
$$;

revoke all on function teacher_assigned_to_enrollment_class(uuid) from public;
grant execute on function teacher_assigned_to_enrollment_class(uuid) to authenticated;

drop policy if exists "schoolenrollment_select_teacher_assigned_classes" on "SchoolEnrollment";

create policy "schoolenrollment_select_teacher_assigned_classes" on "SchoolEnrollment"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'teacher'
    and school_id = auth_school_id()
    and teacher_assigned_to_enrollment_class("SchoolEnrollment".enrollment_id)
  );
