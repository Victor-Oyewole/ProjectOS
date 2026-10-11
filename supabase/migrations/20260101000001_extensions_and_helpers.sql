-- Extensions & shared helper functions.
-- gen_random_uuid() is built into Postgres 13+ core, no extension needed for
-- UUID generation. pgcrypto is enabled anyway for any future hashing needs.
create extension if not exists pgcrypto;

-- Generates a human-readable, non-sequential Platform Student ID
-- (e.g. STU-7F82K4M9), per Doc 7 and the non-guessable-ID requirement in
-- Doc 22 Section 5.
create or replace function generate_platform_student_id()
returns text
language sql
volatile
as $$
  select 'STU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

-- Shared "updated_at" touch trigger, used by any table that tracks it.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
