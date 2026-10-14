-- Fixes a real bug caught by next build's type-check: migration 043 gave
-- p_due_at a default but not p_instructions, even though both are meant to
-- be optional (Doc 13 #1's "Instructions" field isn't marked required, and
-- Assignment.instructions is a nullable column) -- the generated TypeScript
-- type came out requiring p_instructions, which the Zod-optional field it
-- was called with can't satisfy. Postgres requires parameters with defaults
-- to come after ones without, so this also reorders p_instructions to the
-- end rather than just adding "default null" in place.
--
-- Changing parameter order changes the function's identity (name + ordered
-- parameter types), so CREATE OR REPLACE would add an overload rather than
-- fix the original -- drop it first, same approach migration 040 used when
-- admin_create_family_person's signature needed to change.
drop function if exists teacher_create_assignment(uuid, uuid, text, text, timestamptz, timestamptz);

create or replace function teacher_create_assignment(
  p_class_id uuid,
  p_subject_id uuid,
  p_title text,
  p_available_at timestamptz,
  p_instructions text default null,
  p_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth_teacher_id();
  v_school_id uuid := auth_school_id();
  v_assignment_id uuid;
  v_class_name text;
  v_subject_name text;
begin
  if auth_app_role() <> 'teacher' then
    raise exception 'only a teacher can create an assignment';
  end if;

  if not exists (
    select 1 from "TeacherClassAssignment"
    where teacher_id = v_teacher_id and class_id = p_class_id and subject_id = p_subject_id
  ) then
    raise exception 'you are not assigned to this class/subject';
  end if;

  insert into "Assignment" (
    class_id, subject_id, teacher_id, school_id, title, instructions, available_at, due_at, status
  )
  values (p_class_id, p_subject_id, v_teacher_id, v_school_id, p_title, p_instructions, p_available_at, p_due_at, 'Published')
  returning assignment_id into v_assignment_id;

  select name into v_class_name from "Class" where class_id = p_class_id;
  select name into v_subject_name from "Subject" where subject_id = p_subject_id;

  insert into "Notification" (membership_id, source_type, category, related_entity_id, message_text)
  select distinct fsr.membership_id, 'system', 'assignment', v_assignment_id,
    format('New assignment: %s (%s - %s)', p_title, v_class_name, v_subject_name)
  from "ClassMembership" cm
  join "SchoolEnrollment" se on se.enrollment_id = cm.enrollment_id and se.status = 'Active'
  join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
  join "FamilyMembership" fm on fm.membership_id = fsr.membership_id and fm.status = 'Active'
  where cm.class_id = p_class_id and cm.end_date is null;

  return v_assignment_id;
end;
$$;

revoke all on function teacher_create_assignment(uuid, uuid, text, timestamptz, text, timestamptz) from public;
grant execute on function teacher_create_assignment(uuid, uuid, text, timestamptz, text, timestamptz) to authenticated;
