-- Doc 10 Section 8 (Transfers).

create table "TransferRequest" (
  request_id uuid primary key default gen_random_uuid(),
  platform_student_id text not null references "PlatformStudent" (platform_student_id) on delete restrict,
  from_school_id uuid not null references "School" (school_id) on delete restrict,
  to_school_id uuid not null references "School" (school_id) on delete restrict,
  requested_by uuid not null references "SchoolAdmin" (admin_id) on delete restrict,
  approved_by uuid references "SchoolAdmin" (admin_id) on delete set null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Denied')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (from_school_id <> to_school_id)
);

create index idx_transferrequest_platform_student_id on "TransferRequest" (platform_student_id);
create index idx_transferrequest_from_school_id on "TransferRequest" (from_school_id);
create index idx_transferrequest_to_school_id on "TransferRequest" (to_school_id);

create table "TransferPackage" (
  package_id uuid primary key default gen_random_uuid(),
  request_id uuid not null references "TransferRequest" (request_id) on delete cascade,
  included_records jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_transferpackage_request_id on "TransferPackage" (request_id);
