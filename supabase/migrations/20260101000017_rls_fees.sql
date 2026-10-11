-- Mirrors supabase/policies/050_fees.sql, the reviewed source of truth for this
-- policy set (see Doc 3 Sec 1 / Sec 5). Kept in sync manually: edit the
-- policies file first, then copy the change into a new migration here --
-- supabase db push only runs files in supabase/migrations/, never
-- supabase/policies/ directly.

-- FeeRecord.
--
-- Doc 6 permission matrix: admin enters/updates/views fee status for their
-- own school; family views (read-only) fee status for their own children;
-- teacher has no fee visibility at all ("View fee status: Teacher [x]").
-- FeeRecord has no school_id column of its own -- tenancy is derived via
-- SchoolEnrollment, same join pattern as ClassMembership in
-- 030_student_identity.sql.

alter table "FeeRecord" enable row level security;

create policy "feerecord_all_admin" on "FeeRecord"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (
      select 1 from "SchoolEnrollment" se
      where se.enrollment_id = "FeeRecord".enrollment_id and se.school_id = auth_school_id()
    )
  )
  with check (
    exists (
      select 1 from "SchoolEnrollment" se
      where se.enrollment_id = "FeeRecord".enrollment_id and se.school_id = auth_school_id()
    )
  );

create policy "feerecord_select_own_children" on "FeeRecord"
  as permissive for select to authenticated
  using (
    exists (
      select 1
      from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "FeeRecord".enrollment_id
        and fsr.membership_id = auth_membership_id()
    )
  );

create policy "feerecord_all_platform_admin" on "FeeRecord"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
