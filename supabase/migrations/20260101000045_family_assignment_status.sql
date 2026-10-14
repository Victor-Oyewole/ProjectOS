-- Doc 16 Milestone 3, Doc 13 #4 Screen 5: "Tap -> full instructions,
-- [Acknowledge] action." StudentAssignmentStatus only has an UPDATE policy
-- for family (studentassignmentstatus_update_own_children,
-- 060_academic_activity.sql) -- no INSERT policy exists for anyone, so
-- there's no way for a client to create the initial row a family member's
-- first view of an assignment needs. Goes through a SECURITY DEFINER
-- function for the same reason PlatformStudent/Person/etc. do: the write
-- RLS intentionally doesn't cover, replicated inside the function instead.
--
-- Status only ever moves forward (Viewed -> Acknowledged), never backward --
-- re-opening an already-acknowledged assignment shouldn't revert it.
-- 'Completed'/'Checked' are deliberately not reachable here: Doc 23's
-- consolidated review already noted no doc specifies who sets those, so
-- this function doesn't invent that behavior.
create or replace function family_mark_assignment_status(
  p_assignment_id uuid,
  p_enrollment_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_current_status text;
begin
  if auth_app_role() <> 'family' then
    raise exception 'only a family member can update assignment status';
  end if;
  if p_status not in ('Viewed', 'Acknowledged') then
    raise exception 'invalid status';
  end if;

  if not exists (
    select 1 from "SchoolEnrollment" se
    join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
    where se.enrollment_id = p_enrollment_id and fsr.membership_id = auth_membership_id()
  ) then
    raise exception 'not your child';
  end if;

  select class_id into v_class_id from "Assignment" where assignment_id = p_assignment_id;
  if v_class_id is null then
    raise exception 'assignment not found';
  end if;

  if not exists (
    select 1 from "ClassMembership" where enrollment_id = p_enrollment_id and class_id = v_class_id
  ) then
    raise exception 'assignment is not for this child''s class';
  end if;

  select status into v_current_status
  from "StudentAssignmentStatus"
  where assignment_id = p_assignment_id and enrollment_id = p_enrollment_id;

  if v_current_status is null then
    insert into "StudentAssignmentStatus" (assignment_id, enrollment_id, status)
    values (p_assignment_id, p_enrollment_id, p_status);
  elsif v_current_status = 'Viewed' and p_status = 'Acknowledged' then
    update "StudentAssignmentStatus"
    set status = 'Acknowledged'
    where assignment_id = p_assignment_id and enrollment_id = p_enrollment_id;
  end if;
end;
$$;

revoke all on function family_mark_assignment_status(uuid, uuid, text) from public;
grant execute on function family_mark_assignment_status(uuid, uuid, text) to authenticated;
