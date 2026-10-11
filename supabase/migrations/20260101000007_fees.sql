-- Doc 10 Section 6 (Fees). Doc 9: status is a stored column, recomputed on
-- every write to amount_paid/amount_expected -- implemented here as a
-- trigger so every write path (manual admin entry now, gateway webhook in
-- V2 per Doc 9) gets the same recompute logic for free, matching Doc 9's
-- "only the write source changes" intent.

create table "FeeRecord" (
  fee_record_id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  term_id uuid not null references "Term" (term_id) on delete cascade,
  amount_expected numeric not null default 0,
  amount_paid numeric not null default 0,
  status text not null default 'Owing' check (status in ('Paid', 'Partial', 'Owing')),
  last_updated_by uuid references "SchoolAdmin" (admin_id) on delete set null,
  last_updated_at timestamptz not null default now(),
  payment_method text,
  version integer not null default 1,
  unique (enrollment_id, term_id)
);

create index idx_feerecord_enrollment_id on "FeeRecord" (enrollment_id);

create or replace function recompute_fee_status()
returns trigger
language plpgsql
as $$
begin
  if new.amount_paid <= 0 then
    new.status := 'Owing';
  elsif new.amount_paid >= new.amount_expected then
    new.status := 'Paid';
  else
    new.status := 'Partial';
  end if;
  new.last_updated_at := now();
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

create trigger recompute_feerecord_status
  before insert or update of amount_paid, amount_expected on "FeeRecord"
  for each row
  execute function recompute_fee_status();
