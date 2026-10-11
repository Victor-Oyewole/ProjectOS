-- Doc 10 Section 4 (People), with Family replaced by Person + FamilyMembership
-- per Doc 23 Section 1 / Section 7. auth_user_id columns are the concrete
-- link Doc 20 Section 4's JWT-claims design needs ("auth via Supabase Auth")
-- but which Doc 10 left implicit.
--
-- activation_status is added to SchoolAdmin (Doc 12 Step 3 implies a second
-- admin goes through the same activation-code flow as teachers/families, but
-- Doc 10's SchoolAdmin struct omitted the column) and to Person (relocated
-- from Doc 10's original Family.activation_status, since Person is now the
-- entity that actually goes through activation).

create table "SchoolAdmin" (
  admin_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  name text not null,
  contact_info text,
  auth_user_id uuid unique references auth.users (id) on delete restrict,
  activation_status text not null default 'Pending' check (activation_status in ('Pending', 'Active')),
  created_at timestamptz not null default now(),
  last_active timestamptz
);

create index idx_schooladmin_school_id on "SchoolAdmin" (school_id);

create table "Teacher" (
  teacher_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  name text not null,
  staff_id text,
  profile_photo text,
  contact_info text,
  employment_status text,
  date_joined date,
  activation_status text not null default 'Pending' check (activation_status in ('Pending', 'Active')),
  auth_user_id uuid unique references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index idx_teacher_school_id on "Teacher" (school_id);

create table "TeacherClassAssignment" (
  assignment_id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references "Teacher" (teacher_id) on delete cascade,
  class_id uuid not null references "Class" (class_id) on delete cascade,
  subject_id uuid not null references "Subject" (subject_id) on delete cascade,
  session_id uuid not null references "AcademicSession" (session_id) on delete cascade
);

create index idx_teacherclassassignment_teacher_id on "TeacherClassAssignment" (teacher_id);
create index idx_teacherclassassignment_class_id on "TeacherClassAssignment" (class_id);

-- Doc 23 Section 1: the authenticated person, decoupled from any one
-- school's membership.
create table "Person" (
  person_id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_info text,
  auth_user_id uuid unique references auth.users (id) on delete restrict,
  activation_status text not null default 'Pending' check (activation_status in ('Pending', 'Active')),
  created_at timestamptz not null default now()
);

-- Doc 23 Section 1: replaces the bare Family.school_id FK pattern.
create table "FamilyMembership" (
  membership_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references "Person" (person_id) on delete cascade,
  school_id uuid not null references "School" (school_id) on delete cascade,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now()
);

create index idx_familymembership_person_id on "FamilyMembership" (person_id);
create index idx_familymembership_school_id on "FamilyMembership" (school_id);

create table "Guardian" (
  guardian_id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references "FamilyMembership" (membership_id) on delete cascade,
  name text not null,
  relationship text,
  contact_info text
);

create index idx_guardian_membership_id on "Guardian" (membership_id);

-- Doc 23 Section 1: now references membership_id instead of family_id.
create table "FamilyStudentRelationship" (
  relationship_id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references "FamilyMembership" (membership_id) on delete cascade,
  platform_student_id text not null references "PlatformStudent" (platform_student_id) on delete restrict,
  relationship_type text not null check (relationship_type in ('parent', 'guardian'))
);

create index idx_familystudentrelationship_membership_id on "FamilyStudentRelationship" (membership_id);
create index idx_familystudentrelationship_platform_student_id on "FamilyStudentRelationship" (platform_student_id);
