-- Doc 10 Section 1 (Platform-Level), amended by Doc 24 Section 1 (multi-
-- currency/timezone columns on School) and Doc 24 Section 4 (Subscription
-- table replaces the flat subscription_status/tier columns Doc 10 originally
-- sketched on School -- Doc 24 is authoritative and specifies a richer model
-- with trial/grace/gateway tracking that the flat columns can't represent).
--
-- PlatformAdmin is not detailed in any single doc (flagged as an open item in
-- Doc 17 #1 / Doc 23 Section 6), but Doc 24 Sections 6 and 8 confirm the role
-- exists pre-launch with full override authority, and Milestone 0 explicitly
-- requires "Supabase Auth with role-based JWT claims" -- platform_admin is one
-- of those roles, so a minimal identity table is required now. Billing/
-- override *tooling* (the actual dashboard) remains out of scope for
-- Milestone 0.

create table "School" (
  school_id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  address text,
  contact_info text,
  country text not null,
  timezone text not null default 'Africa/Lagos',
  currency text not null default 'NGN',
  created_at timestamptz not null default now()
);

create table "PlatformAdmin" (
  platform_admin_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete restrict,
  name text not null,
  contact_info text,
  created_at timestamptz not null default now()
);

-- Doc 24 Section 4.
create table "Subscription" (
  subscription_id uuid primary key default gen_random_uuid(),
  school_id uuid not null unique references "School" (school_id) on delete cascade,
  tier text not null check (tier in ('tier_1', 'tier_2', 'tier_3')),
  status text not null check (status in ('Trialing', 'Active', 'PastDue', 'Restricted', 'Cancelled')),
  trial_started_at timestamptz not null,
  trial_ends_at timestamptz not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_charge_at timestamptz,
  gateway_provider text check (gateway_provider in ('stripe', 'paystack', 'flutterwave')),
  gateway_customer_ref text,
  grace_period_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_subscription_updated_at
  before update on "Subscription"
  for each row
  execute function set_updated_at();

create index idx_subscription_school_id on "Subscription" (school_id);

-- Doc 10 Section 1. target_id is text (not uuid) because audited targets
-- include both uuid-keyed rows and the human-readable platform_student_id.
create table "AuditLog" (
  log_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  actor_id uuid,
  actor_role text not null check (actor_role in ('admin', 'teacher', 'family', 'platform_admin', 'system')),
  action_type text not null,
  target_entity text not null,
  target_id text,
  "timestamp" timestamptz not null default now(),
  details jsonb
);

create index idx_auditlog_school_id on "AuditLog" (school_id, "timestamp" desc);
