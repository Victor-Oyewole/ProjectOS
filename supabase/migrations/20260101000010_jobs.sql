-- Doc 23 Section 4: background job tracking table, decoupled from the
-- execution mechanism (Supabase Edge Functions + pg_cron/Database Webhooks,
-- built in Milestone 2) -- only the tracking schema is Milestone 0 scope.
-- JobRecipientStatus gives per-recipient fan-out tracking so a retried job
-- only processes remaining recipients, and its unique constraint is the
-- idempotency key Doc 23 Section 4 calls for on the (job, recipient) pair.

create table "Job" (
  job_id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in (
    'notify_assignment_published',
    'process_csv_import',
    'dispatch_whatsapp_activation',
    'recompute_fee_status'
  )),
  school_id uuid not null references "School" (school_id) on delete cascade,
  related_entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'complete', 'failed')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_job_status on "Job" (status, job_type);
create index idx_job_school_id on "Job" (school_id);

create trigger set_job_updated_at
  before update on "Job"
  for each row
  execute function set_updated_at();

create table "JobRecipientStatus" (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references "Job" (job_id) on delete cascade,
  recipient_membership_id uuid not null references "FamilyMembership" (membership_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  unique (job_id, recipient_membership_id)
);

create index idx_jobrecipientstatus_job_id on "JobRecipientStatus" (job_id);
