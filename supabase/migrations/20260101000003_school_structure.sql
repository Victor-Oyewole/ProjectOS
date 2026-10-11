-- Doc 10 Section 3 (School Structure).

create table "AcademicSession" (
  session_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null
);

create index idx_academicsession_school_id on "AcademicSession" (school_id);

create table "Term" (
  term_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references "AcademicSession" (session_id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null
);

create index idx_term_session_id on "Term" (session_id);

create table "Class" (
  class_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  name text not null
);

create index idx_class_school_id on "Class" (school_id);

create table "Subject" (
  subject_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  name text not null
);

create index idx_subject_school_id on "Subject" (school_id);
