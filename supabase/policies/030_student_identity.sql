-- PlatformStudent, SchoolEnrollment, ClassMembership.
--
-- PlatformStudent is deliberately NOT school-scoped (Doc 11) -- a row is
-- visible only to a school with an actual SchoolEnrollment for that student,
-- or a family with a FamilyStudentRelationship to that student. There is no
-- INSERT/UPDATE/DELETE policy on PlatformStudent for any client role: all
-- writes happen through resolve_or_create_platform_student() (Doc 23
-- Section 2), a SECURITY DEFINER function that runs the identity-matching
-- workflow instead of a silent raw insert.

alter table "PlatformStudent" enable row level security;

-- Third OR clause (TransferRequest) added by migration 050: an outgoing
-- transfer request's PlatformStudent isn't reachable via enrollment or
-- family relationship yet, since the whole point of the request is that
-- the student isn't enrolled at the requesting school. Not scoped to
-- Pending only -- an admin still needs to see who a resolved request was
-- about.
create policy "platformstudent_select_via_enrollment" on "PlatformStudent"
  as permissive for select to authenticated
  using (
    is_platform_admin()
    or exists (
      select 1 from "SchoolEnrollment" se
      where se.platform_student_id = "PlatformStudent".platform_student_id
        and se.school_id = auth_school_id()
    )
    or exists (
      select 1 from "FamilyStudentRelationship" fsr
      where fsr.platform_student_id = "PlatformStudent".platform_student_id
        and fsr.membership_id = auth_membership_id()
    )
    or exists (
      select 1 from "TransferRequest" tr
      where tr.platform_student_id = "PlatformStudent".platform_student_id
        and (tr.from_school_id = auth_school_id() or tr.to_school_id = auth_school_id())
    )
  );

alter table "SchoolEnrollment" enable row level security;

create policy "schoolenrollment_all_admin" on "SchoolEnrollment"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

-- Doc 6: teacher sees students only within classes they're assigned to, not
-- the whole school.
--
-- Uses teacher_assigned_to_enrollment_class() (migration 030) rather than a
-- raw subquery on ClassMembership -- ClassMembership's own policies
-- subquery SchoolEnrollment right back, and Postgres detects that as
-- infinite recursion (42P17) regardless of role/data. The SECURITY DEFINER
-- function breaks the cycle by not re-triggering ClassMembership's RLS.
create policy "schoolenrollment_select_teacher_assigned_classes" on "SchoolEnrollment"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'teacher'
    and school_id = auth_school_id()
    and teacher_assigned_to_enrollment_class("SchoolEnrollment".enrollment_id)
  );

create policy "schoolenrollment_select_own_children" on "SchoolEnrollment"
  as permissive for select to authenticated
  using (
    exists (
      select 1 from "FamilyStudentRelationship" fsr
      where fsr.platform_student_id = "SchoolEnrollment".platform_student_id
        and fsr.membership_id = auth_membership_id()
    )
  );

create policy "schoolenrollment_all_platform_admin" on "SchoolEnrollment"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "ClassMembership" enable row level security;

create policy "classmembership_all_admin" on "ClassMembership"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (
      select 1 from "SchoolEnrollment" se
      where se.enrollment_id = "ClassMembership".enrollment_id and se.school_id = auth_school_id()
    )
  )
  with check (
    exists (
      select 1 from "SchoolEnrollment" se
      where se.enrollment_id = "ClassMembership".enrollment_id and se.school_id = auth_school_id()
    )
  );

create policy "classmembership_select_teacher_assigned_classes" on "ClassMembership"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'teacher'
    and exists (
      select 1 from "TeacherClassAssignment" tca
      where tca.class_id = "ClassMembership".class_id and tca.teacher_id = auth_teacher_id()
    )
  );

create policy "classmembership_select_own_children" on "ClassMembership"
  as permissive for select to authenticated
  using (
    exists (
      select 1
      from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "ClassMembership".enrollment_id
        and fsr.membership_id = auth_membership_id()
    )
  );

create policy "classmembership_all_platform_admin" on "ClassMembership"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
