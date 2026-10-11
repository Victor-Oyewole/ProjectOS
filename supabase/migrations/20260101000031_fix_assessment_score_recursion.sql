-- Fixes a second recursion bug of the same class as migration 030, found by
-- re-running the tenant-isolation suite after that fix: "infinite recursion
-- detected in policy for relation Assessment"/"Score" (42P17).
--
-- Root cause: "assessment_select_own_children" subqueries Score, whose own
-- policy "score_all_teacher_assigned" subqueries Assessment right back.
-- Same fix pattern as migration 030 -- a SECURITY DEFINER function breaks
-- the cycle by not re-triggering Score's RLS when Assessment's policy needs
-- to check it.
create or replace function family_has_score_for_assessment(p_assessment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from "Score" sc
    join "SchoolEnrollment" se on se.enrollment_id = sc.enrollment_id
    join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
    where sc.assessment_id = p_assessment_id
      and fsr.membership_id = auth_membership_id()
  );
$$;

revoke all on function family_has_score_for_assessment(uuid) from public;
grant execute on function family_has_score_for_assessment(uuid) to authenticated;

drop policy if exists "assessment_select_own_children" on "Assessment";

create policy "assessment_select_own_children" on "Assessment"
  as permissive for select to authenticated
  using (family_has_score_for_assessment("Assessment".assessment_id));
