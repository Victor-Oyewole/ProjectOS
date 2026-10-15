-- MilestoneScale, MilestoneAssessment, GradeScale, TermResult,
-- TermReportCard (Doc 27). Mirrors 20260101000046_results_computation.sql
-- -- see that migration for the full reasoning; this file is the
-- human-reviewed source of truth per this project's convention
-- (supabase_policies_not_auto_applied), kept in sync manually.

alter table "MilestoneScale" enable row level security;

create policy "milestonescale_all_admin" on "MilestoneScale"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "milestonescale_all_platform_admin" on "MilestoneScale"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- Added by migration 052: teacher had no select policy at all, so the
-- score-entry screen couldn't read a narrative_milestone school's level
-- labels to populate the picker (same class of gap as the Milestone 5
-- cross-tenant visibility fixes, just same-tenant this time).
create policy "milestonescale_select_teacher" on "MilestoneScale"
  as permissive for select to authenticated
  using (auth_app_role() = 'teacher' and school_id = auth_school_id());

alter table "MilestoneAssessment" enable row level security;

create policy "milestoneassessment_all_teacher_assigned" on "MilestoneAssessment"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'teacher'
    and exists (
      select 1 from "ClassMembership" cm
      join "TeacherClassAssignment" tca on tca.class_id = cm.class_id and tca.subject_id = "MilestoneAssessment".subject_id
      where cm.enrollment_id = "MilestoneAssessment".enrollment_id and tca.teacher_id = auth_teacher_id()
    )
  )
  with check (
    entered_by = auth_teacher_id()
    and exists (
      select 1 from "ClassMembership" cm
      join "TeacherClassAssignment" tca on tca.class_id = cm.class_id and tca.subject_id = "MilestoneAssessment".subject_id
      where cm.enrollment_id = "MilestoneAssessment".enrollment_id and tca.teacher_id = auth_teacher_id()
    )
  );

create policy "milestoneassessment_select_admin" on "MilestoneAssessment"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "milestoneassessment_all_platform_admin" on "MilestoneAssessment"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "GradeScale" enable row level security;

create policy "gradescale_all_admin" on "GradeScale"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "gradescale_all_platform_admin" on "GradeScale"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- No insert/update policy for admin on TermResult or TermReportCard, by
-- design -- Doc 27 Section 6: admin can never hand-edit a computed grade,
-- score, or class position, only reopen the underlying input via the
-- SECURITY DEFINER functions. Admin gets SELECT only here.
alter table "TermResult" enable row level security;

create policy "termresult_select_admin" on "TermResult"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "termresult_all_platform_admin" on "TermResult"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- Added by migration 053: Doc 27 Section 7's report card screen shows a
-- full subject/score/credit/grade table for Option 1/2, which is
-- TermResult's shape -- without this, family could see the published
-- aggregate TermReportCard but nothing behind it. Gated on the sibling
-- TermReportCard being published (TermResult's own status never reaches
-- 'published' -- only 'draft'/'finalized').
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

alter table "TermReportCard" enable row level security;

create policy "termreportcard_select_admin" on "TermReportCard"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "termreportcard_select_family_published" on "TermReportCard"
  as permissive for select to authenticated
  using (
    status = 'published'
    and exists (
      select 1 from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "TermReportCard".enrollment_id and fsr.membership_id = auth_membership_id()
    )
  );

create policy "termreportcard_all_platform_admin" on "TermReportCard"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
