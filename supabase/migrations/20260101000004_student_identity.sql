-- Doc 10 Section 2 (Student Identity, Platform-Level, Persists Across
-- Schools). PlatformStudent is deliberately NOT school-scoped (Doc 11) --
-- access is mediated through SchoolEnrollment/FamilyStudentRelationship, see
-- the RLS policies.

create table "PlatformStudent" (
  platform_student_id text primary key default generate_platform_student_id(),
  name text not null,
  dob date not null,
  profile_photo text,
  created_at timestamptz not null default now()
);

create table "SchoolEnrollment" (
  enrollment_id uuid primary key default gen_random_uuid(),
  platform_student_id text not null references "PlatformStudent" (platform_student_id) on delete restrict,
  school_id uuid not null references "School" (school_id) on delete cascade,
  school_student_id text,
  start_date date not null,
  end_date date,
  status text not null check (status in ('Active', 'Transferred', 'Completed'))
);

create index idx_schoolenrollment_school_id on "SchoolEnrollment" (school_id);
create index idx_schoolenrollment_platform_student_id on "SchoolEnrollment" (platform_student_id);

create table "ClassMembership" (
  membership_id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  class_id uuid not null references "Class" (class_id) on delete restrict,
  academic_session_id uuid not null references "AcademicSession" (session_id) on delete restrict,
  start_date date not null,
  end_date date
);

create index idx_classmembership_enrollment_id on "ClassMembership" (enrollment_id);
create index idx_classmembership_class_id on "ClassMembership" (class_id);
