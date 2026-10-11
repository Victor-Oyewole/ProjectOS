-- Mirrors supabase/policies/030_student_identity.sql, the reviewed source of truth for this
-- policy set (see Doc 3 Sec 1 / Sec 5). Kept in sync manually: edit the
-- policies file first, then copy the change into a new migration here --
-- supabase db push only runs files in supabase/migrations/, never
-- supabase/policies/ directly.

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
  );

alter table "SchoolEnrollment" enable row level security;

create policy "schoolenrollment_all_admin" on "SchoolEnrollment"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

-- Doc 6: teacher sees students only within classes they're assigned to, not
-- the whole school.
create policy "schoolenrollment_select_teacher_assigned_classes" on "SchoolEnrollment"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'teacher'
    and school_id = auth_school_id()
    and exists (
      select 1 from "ClassMembership" cm
      join "TeacherClassAssignment" tca on tca.class_id = cm.class_id
      where cm.enrollment_id = "SchoolEnrollment".enrollment_id
        and tca.teacher_id = auth_teacher_id()
    )
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
