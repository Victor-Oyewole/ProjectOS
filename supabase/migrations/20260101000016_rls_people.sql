-- Mirrors supabase/policies/040_people.sql, the reviewed source of truth for this
-- policy set (see Doc 3 Sec 1 / Sec 5). Kept in sync manually: edit the
-- policies file first, then copy the change into a new migration here --
-- supabase db push only runs files in supabase/migrations/, never
-- supabase/policies/ directly.

-- SchoolAdmin, Teacher, TeacherClassAssignment, Person, FamilyMembership,
-- Guardian, FamilyStudentRelationship.
--
-- RLS is already enabled on SchoolAdmin/Teacher/Person/FamilyMembership by
-- the custom_access_token_hook migration (needed so supabase_auth_admin can
-- read them); the policies below are additive, for the ordinary
-- authenticated roles.

create policy "schooladmin_select_own_school" on "SchoolAdmin"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "schooladmin_update_self" on "SchoolAdmin"
  as permissive for update to authenticated
  using (auth_app_role() = 'admin' and admin_id = auth_admin_id())
  with check (auth_app_role() = 'admin' and admin_id = auth_admin_id());

create policy "schooladmin_all_platform_admin" on "SchoolAdmin"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

create policy "teacher_all_admin" on "Teacher"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "teacher_select_self" on "Teacher"
  as permissive for select to authenticated
  using (auth_app_role() = 'teacher' and teacher_id = auth_teacher_id());

create policy "teacher_select_own_school_family" on "Teacher"
  as permissive for select to authenticated
  using (auth_app_role() = 'family' and school_id = auth_school_id());

create policy "teacher_all_platform_admin" on "Teacher"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "TeacherClassAssignment" enable row level security;

create policy "teacherclassassignment_all_admin" on "TeacherClassAssignment"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (select 1 from "Teacher" t where t.teacher_id = "TeacherClassAssignment".teacher_id and t.school_id = auth_school_id())
  )
  with check (
    exists (select 1 from "Teacher" t where t.teacher_id = "TeacherClassAssignment".teacher_id and t.school_id = auth_school_id())
  );

create policy "teacherclassassignment_select_self" on "TeacherClassAssignment"
  as permissive for select to authenticated
  using (auth_app_role() = 'teacher' and teacher_id = auth_teacher_id());

create policy "teacherclassassignment_all_platform_admin" on "TeacherClassAssignment"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- Person is platform-level like PlatformStudent -- visibility mediated
-- through FamilyMembership, not a bare school_id column on Person itself.
create policy "person_select_self" on "Person"
  as permissive for select to authenticated
  using (person_id = auth_person_id());

create policy "person_update_self" on "Person"
  as permissive for update to authenticated
  using (person_id = auth_person_id())
  with check (person_id = auth_person_id());

create policy "person_select_admin_own_school" on "Person"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (
      select 1 from "FamilyMembership" fm
      where fm.person_id = "Person".person_id and fm.school_id = auth_school_id()
    )
  );

create policy "person_all_platform_admin" on "Person"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

create policy "familymembership_all_admin" on "FamilyMembership"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "familymembership_select_self" on "FamilyMembership"
  as permissive for select to authenticated
  using (membership_id = auth_membership_id());

create policy "familymembership_all_platform_admin" on "FamilyMembership"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "Guardian" enable row level security;

create policy "guardian_all_admin" on "Guardian"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (select 1 from "FamilyMembership" fm where fm.membership_id = "Guardian".membership_id and fm.school_id = auth_school_id())
  )
  with check (
    exists (select 1 from "FamilyMembership" fm where fm.membership_id = "Guardian".membership_id and fm.school_id = auth_school_id())
  );

create policy "guardian_select_self" on "Guardian"
  as permissive for select to authenticated
  using (membership_id = auth_membership_id());

create policy "guardian_all_platform_admin" on "Guardian"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "FamilyStudentRelationship" enable row level security;

create policy "familystudentrelationship_all_admin" on "FamilyStudentRelationship"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (
      select 1 from "FamilyMembership" fm
      where fm.membership_id = "FamilyStudentRelationship".membership_id and fm.school_id = auth_school_id()
    )
  )
  with check (
    exists (
      select 1 from "FamilyMembership" fm
      where fm.membership_id = "FamilyStudentRelationship".membership_id and fm.school_id = auth_school_id()
    )
  );

create policy "familystudentrelationship_select_self" on "FamilyStudentRelationship"
  as permissive for select to authenticated
  using (membership_id = auth_membership_id());

create policy "familystudentrelationship_all_platform_admin" on "FamilyStudentRelationship"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
