-- Doc 27 UI pass, real gap found building the family report card view:
-- Section 7 says the report card screen shows "a full subject/score/
-- credit/grade table for Option 1/2," which is exactly TermResult's shape
-- -- but Section 6 only ever grants family access to TermReportCard
-- (the aggregate), and TermResult (migration 046) has no family select
-- policy at all. Without this, family would see an overall score/grade
-- with no subject breakdown behind it once published.
--
-- TermResult itself never reaches status='published' (admin_finalize_class_term
-- only takes it to 'finalized'; admin_publish_class_term only flips
-- TermReportCard) -- so gating on TermResult.status would show nothing,
-- ever. Gate instead on the sibling TermReportCard for the same
-- (enrollment, term) being published, which is the actual signal Doc 27's
-- lifecycle uses to mean "visible to family."

create policy "termresult_select_family_published" on "TermResult"
  as permissive for select to authenticated
  using (
    exists (
      select 1 from "TermReportCard" trc
      where trc.enrollment_id = "TermResult".enrollment_id
        and trc.term_id = "TermResult".term_id
        and trc.status = 'published'
    )
    and exists (
      select 1 from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "TermResult".enrollment_id and fsr.membership_id = auth_membership_id()
    )
  );
