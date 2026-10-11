-- Assignment, AssignmentAttachment, StudentAssignmentStatus, Attendance,
-- Assessment, Score.
--
-- Doc 23 Section 6 (consolidated authorization matrix) overrides Doc 6 on
-- two points that matter here:
--   - "Create/retract assignments": Admin is explicitly [x], Teacher only
--     (own class/subject). Admin keeps school-wide SELECT for oversight
--     (Doc 6 "Visibility != Ownership"; the Admin Dashboard "Recent
--     Activity" feed shows other staff's assignment/fee actions) but gets
--     no write policy on Assignment or AssignmentAttachment.
--   - "Enter scores": Admin is explicitly [x], Teacher only (own
--     subject/class). Admin keeps school-wide SELECT ("View all
--     scores/results", Doc 6) but no write policy on Score. Assessment
--     definitions (test/exam names, weighting) are admin-configured
--     ("Configure grading rules", Doc 6; "grading rules/weighting
--     controlled by admin, not teacher", Doc 13 #3) -- so unlike Score,
--     Assessment *is* admin-writable, teacher-read-only.
--
-- Attendance uses the generated `editable_until` column (set in the
-- academic_activity migration specifically to give the same-day edit
-- window, Doc 6, a DB-level fact) to enforce the teacher lock at the RLS
-- layer rather than leaving it to application code.
--
-- StudentAssignmentStatus: Doc 6 only explicitly grants family the
-- "Acknowledge assignment" action and explicitly denies editing assignment
-- content. Teacher's "Tap to view per-student status" (Doc 13 #1 Screen 4)
-- is read-only language. Who/how 'Completed'/'Checked' get set is not
-- specified in the docs, so only family-side UPDATE is granted here;
-- teacher gets SELECT only. Revisit if a future doc assigns that write.

alter table "Assignment" enable row level security;

create policy "assignment_select_admin" on "Assignment"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "assignment_all_teacher_assigned" on "Assignment"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'teacher'
    and teacher_id = auth_teacher_id()
  )
  with check (
    auth_app_role() = 'teacher'
    and teacher_id = auth_teacher_id()
    and school_id = auth_school_id()
    and exists (
      select 1 from "TeacherClassAssignment" tca
      where tca.teacher_id = auth_teacher_id()
        and tca.class_id = "Assignment".class_id
        and tca.subject_id = "Assignment".subject_id
    )
  );

create policy "assignment_select_family_own_children" on "Assignment"
  as permissive for select to authenticated
  using (
    available_at <= now()
    and exists (
      select 1
      from "ClassMembership" cm
      join "SchoolEnrollment" se on se.enrollment_id = cm.enrollment_id
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where cm.class_id = "Assignment".class_id
        and fsr.membership_id = auth_membership_id()
    )
  );

create policy "assignment_all_platform_admin" on "Assignment"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "AssignmentAttachment" enable row level security;

create policy "assignmentattachment_select_admin" on "AssignmentAttachment"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "assignmentattachment_all_teacher_own_assignment" on "AssignmentAttachment"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'teacher'
    and exists (
      select 1 from "Assignment" a
      where a.assignment_id = "AssignmentAttachment".assignment_id and a.teacher_id = auth_teacher_id()
    )
  )
  with check (
    exists (
      select 1 from "Assignment" a
      where a.assignment_id = "AssignmentAttachment".assignment_id and a.teacher_id = auth_teacher_id()
    )
  );

create policy "assignmentattachment_select_family_own_children" on "AssignmentAttachment"
  as permissive for select to authenticated
  using (
    exists (
      select 1
      from "Assignment" a
      join "ClassMembership" cm on cm.class_id = a.class_id
      join "SchoolEnrollment" se on se.enrollment_id = cm.enrollment_id
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where a.assignment_id = "AssignmentAttachment".assignment_id
        and a.available_at <= now()
        and fsr.membership_id = auth_membership_id()
    )
  );

create policy "assignmentattachment_all_platform_admin" on "AssignmentAttachment"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "StudentAssignmentStatus" enable row level security;

create policy "studentassignmentstatus_select_admin" on "StudentAssignmentStatus"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (
      select 1 from "Assignment" a
      where a.assignment_id = "StudentAssignmentStatus".assignment_id and a.school_id = auth_school_id()
    )
  );

create policy "studentassignmentstatus_select_teacher_assigned" on "StudentAssignmentStatus"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'teacher'
    and exists (
      select 1 from "Assignment" a
      where a.assignment_id = "StudentAssignmentStatus".assignment_id and a.teacher_id = auth_teacher_id()
    )
  );

create policy "studentassignmentstatus_select_own_children" on "StudentAssignmentStatus"
  as permissive for select to authenticated
  using (
    exists (
      select 1 from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "StudentAssignmentStatus".enrollment_id and fsr.membership_id = auth_membership_id()
    )
  );

create policy "studentassignmentstatus_update_own_children" on "StudentAssignmentStatus"
  as permissive for update to authenticated
  using (
    exists (
      select 1 from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "StudentAssignmentStatus".enrollment_id and fsr.membership_id = auth_membership_id()
    )
  )
  with check (
    exists (
      select 1 from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "StudentAssignmentStatus".enrollment_id and fsr.membership_id = auth_membership_id()
    )
  );

create policy "studentassignmentstatus_all_platform_admin" on "StudentAssignmentStatus"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "Attendance" enable row level security;

create policy "attendance_all_admin" on "Attendance"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "attendance_insert_teacher_assigned" on "Attendance"
  as permissive for insert to authenticated
  with check (
    auth_app_role() = 'teacher'
    and teacher_id = auth_teacher_id()
    and school_id = auth_school_id()
    and exists (
      select 1 from "TeacherClassAssignment" tca
      where tca.teacher_id = auth_teacher_id()
        and tca.class_id = "Attendance".class_id
        and ("Attendance".subject_id is null or tca.subject_id = "Attendance".subject_id)
    )
  );

create policy "attendance_select_teacher_assigned" on "Attendance"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'teacher'
    and exists (
      select 1 from "TeacherClassAssignment" tca
      where tca.teacher_id = auth_teacher_id() and tca.class_id = "Attendance".class_id
    )
  );

-- Doc 6: "Editable same-day only; locked after midnight" -- editable_until
-- is the generated column carrying that cutoff.
create policy "attendance_update_teacher_same_day" on "Attendance"
  as permissive for update to authenticated
  using (auth_app_role() = 'teacher' and teacher_id = auth_teacher_id() and now() < editable_until)
  with check (auth_app_role() = 'teacher' and teacher_id = auth_teacher_id() and now() < editable_until);

create policy "attendance_select_own_children" on "Attendance"
  as permissive for select to authenticated
  using (
    exists (
      select 1 from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "Attendance".enrollment_id and fsr.membership_id = auth_membership_id()
    )
  );

create policy "attendance_all_platform_admin" on "Attendance"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "Assessment" enable row level security;

create policy "assessment_all_admin" on "Assessment"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "assessment_select_teacher_assigned" on "Assessment"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'teacher'
    and exists (
      select 1 from "TeacherClassAssignment" tca
      where tca.teacher_id = auth_teacher_id()
        and tca.class_id = "Assessment".class_id
        and tca.subject_id = "Assessment".subject_id
    )
  );

-- Not a named Doc 6 permission on its own -- needed so a family's "View
-- scores/results" can also resolve the assessment name/term a score belongs
-- to, scoped to assessments their own children actually have a Score for.
create policy "assessment_select_own_children" on "Assessment"
  as permissive for select to authenticated
  using (
    exists (
      select 1
      from "Score" sc
      join "SchoolEnrollment" se on se.enrollment_id = sc.enrollment_id
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where sc.assessment_id = "Assessment".assessment_id and fsr.membership_id = auth_membership_id()
    )
  );

create policy "assessment_all_platform_admin" on "Assessment"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "Score" enable row level security;

create policy "score_select_admin" on "Score"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (
      select 1 from "SchoolEnrollment" se
      where se.enrollment_id = "Score".enrollment_id and se.school_id = auth_school_id()
    )
  );

create policy "score_all_teacher_assigned" on "Score"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'teacher'
    and exists (
      select 1 from "Assessment" a
      join "TeacherClassAssignment" tca on tca.class_id = a.class_id and tca.subject_id = a.subject_id
      where a.assessment_id = "Score".assessment_id and tca.teacher_id = auth_teacher_id()
    )
  )
  with check (
    entered_by = auth_teacher_id()
    and exists (
      select 1 from "Assessment" a
      join "TeacherClassAssignment" tca on tca.class_id = a.class_id and tca.subject_id = a.subject_id
      where a.assessment_id = "Score".assessment_id and tca.teacher_id = auth_teacher_id()
    )
  );

create policy "score_select_own_children" on "Score"
  as permissive for select to authenticated
  using (
    exists (
      select 1 from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "Score".enrollment_id and fsr.membership_id = auth_membership_id()
    )
  );

create policy "score_all_platform_admin" on "Score"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
