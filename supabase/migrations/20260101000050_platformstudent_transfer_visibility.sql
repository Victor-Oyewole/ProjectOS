-- Doc 16 Milestone 5 (Transfers), follow-up to migration 049.
--
-- platformstudent_select_via_enrollment (030_student_identity.sql) only
-- grants a school visibility into a PlatformStudent via its own
-- SchoolEnrollment or a family's FamilyStudentRelationship. For an
-- OUTGOING transfer request (to_school_id = mine), neither is true yet --
-- the whole point of the request is that this student isn't enrolled
-- here. Without this, an admin who just submitted a transfer request
-- can't see the name of the student they requested when looking at their
-- own /transfers list (the row is visible, the PlatformStudent join
-- behind it is not).
--
-- Adding a third OR clause, same shape as the existing two: a school can
-- see a PlatformStudent's platform-identity row (name, dob -- nothing
-- else; this table has no other columns) if a TransferRequest links that
-- student to this school on either side. This is deliberately not scoped
-- to Pending only -- an admin still needs to see who a resolved request
-- was about.
alter policy "platformstudent_select_via_enrollment" on "PlatformStudent"
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
