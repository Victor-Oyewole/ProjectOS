-- Doc 16 Milestone 4 / Doc 9 / Doc 13 #5. FeeRecord already exists in full
-- (migration 007, Milestone 0) with its recompute trigger and RLS --
-- Milestone 4 is an application-layer build on top of it, same situation
-- as every other "the schema already existed" milestone this session.
--
-- Two small gaps between the existing schema and Doc 9/13's "Record
-- Payment" form field list ("Term, amount received, method, date,
-- notes"): Doc 10's own FeeRecord schema snippet doesn't list `notes` or
-- a payment date distinct from `last_updated_at` either, so this is a
-- doc-to-doc inconsistency, same class as Doc 27/28's gaps -- resolved by
-- adding the two fields, since both carry real information a "Record
-- Payment" action would otherwise silently drop.
alter table "FeeRecord" add column notes text;
-- Nullable, no default -- a FeeRecord can exist with amount_expected set
-- and no payment received yet (status defaults to 'Owing'), so defaulting
-- this to today would misleadingly claim a payment happened. Only set
-- when a real payment is recorded.
alter table "FeeRecord" add column payment_date date;
