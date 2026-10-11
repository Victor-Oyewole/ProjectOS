-- Doc 10 Section 5 (Academic Activity), with AssignmentAttachment added per
-- Doc 26 Section 3 (schema addition, even though the upload feature itself
-- ships in Milestone 2).
--
-- Attendance.editable_until is stored as a generated column rather than a
-- purely application-computed value, giving the same-day edit window (Doc 6)
-- a DB-level fact to check against. It's computed in UTC for now; per-school
-- timezone precision (School.timezone, Doc 24 Section 1) is an application-
-- layer refinement left to Milestone 2 when attendance entry is actually
-- built, not a Milestone 0 schema concern.

create table "Assignment" (
  assignment_id uuid primary key default gen_random_uuid(),
  class_id uuid not null references "Class" (class_id) on delete restrict,
  subject_id uuid not null references "Subject" (subject_id) on delete restrict,
  teacher_id uuid not null references "Teacher" (teacher_id) on delete restrict,
  school_id uuid not null references "School" (school_id) on delete cascade,
  title text not null,
  instructions text,
  available_at timestamptz not null,
  due_at timestamptz,
  status text not null default 'Published' check (status in ('Published', 'Retracted')),
  created_at timestamptz not null default now()
);

create index idx_assignment_school_id on "Assignment" (school_id);
create index idx_assignment_class_id on "Assignment" (class_id);
create index idx_assignment_teacher_id on "Assignment" (teacher_id);

create table "AssignmentAttachment" (
  attachment_id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references "Assignment" (assignment_id) on delete cascade,
  school_id uuid not null references "School" (school_id) on delete cascade,
  file_type text not null check (file_type in ('image', 'pdf')),
  storage_path text not null,
  file_size_bytes integer not null,
  original_filename text not null,
  uploaded_at timestamptz not null default now()
);

create index idx_assignmentattachment_assignment_id on "AssignmentAttachment" (assignment_id);

create table "StudentAssignmentStatus" (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references "Assignment" (assignment_id) on delete cascade,
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  status text not null default 'Viewed' check (status in ('Viewed', 'Acknowledged', 'Completed', 'Checked')),
  updated_at timestamptz not null default now(),
  unique (assignment_id, enrollment_id)
);

create index idx_studentassignmentstatus_enrollment_id on "StudentAssignmentStatus" (enrollment_id);

create trigger set_studentassignmentstatus_updated_at
  before update on "StudentAssignmentStatus"
  for each row
  execute function set_updated_at();

create table "Attendance" (
  attendance_id uuid primary key default gen_random_uuid(),
  class_id uuid not null references "Class" (class_id) on delete restrict,
  subject_id uuid references "Subject" (subject_id) on delete restrict,
  teacher_id uuid not null references "Teacher" (teacher_id) on delete restrict,
  school_id uuid not null references "School" (school_id) on delete cascade,
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  date date not null,
  status text not null check (status in ('Present', 'Absent', 'Late')),
  editable_until timestamptz,
  unique (enrollment_id, class_id, date)
);

create index idx_attendance_school_id on "Attendance" (school_id);
create index idx_attendance_enrollment_id on "Attendance" (enrollment_id);
create index idx_attendance_class_id_date on "Attendance" (class_id, date);

-- editable_until can't be a generated column: casting date -> timestamptz is
-- STABLE (timezone-dependent), not IMMUTABLE, which generated columns
-- require. A trigger gives the same DB-level stored fact instead.
create or replace function set_attendance_editable_until()
returns trigger
language plpgsql
as $$
begin
  new.editable_until := (new.date + 1)::timestamptz;
  return new;
end;
$$;

create trigger set_attendance_editable_until_trigger
  before insert or update of date on "Attendance"
  for each row
  execute function set_attendance_editable_until();

create table "Assessment" (
  assessment_id uuid primary key default gen_random_uuid(),
  class_id uuid not null references "Class" (class_id) on delete cascade,
  subject_id uuid not null references "Subject" (subject_id) on delete cascade,
  term_id uuid not null references "Term" (term_id) on delete cascade,
  school_id uuid not null references "School" (school_id) on delete cascade,
  name text not null
);

create index idx_assessment_school_id on "Assessment" (school_id);
create index idx_assessment_class_id on "Assessment" (class_id);

create table "Score" (
  score_id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references "Assessment" (assessment_id) on delete cascade,
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  value numeric not null,
  entered_by uuid not null references "Teacher" (teacher_id) on delete restrict,
  entered_at timestamptz not null default now(),
  unique (assessment_id, enrollment_id)
);

create index idx_score_enrollment_id on "Score" (enrollment_id);
