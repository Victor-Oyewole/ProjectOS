-- Doc 3 Section 6: "Rate limiting on auth endpoints and bulk operations
-- (CSV import, activation dispatch)." No specific thresholds are given
-- anywhere in the build pack -- every number a call site below uses is
-- this session's own inferred default (generous enough not to
-- inconvenience real usage), flagged here rather than silently guessed:
-- worth confirming with Alana if real abuse patterns ever call for
-- tightening them. "Activation dispatch" itself is NOT rate-limited here
-- -- there is no live dispatch mechanism yet (Milestone 1: no WhatsApp
-- Cloud API credentials, /activations is just a copy-link button), and
-- rate-limiting admin_generate_activation_code's per-row calls would
-- break a legitimate large CSV import (one call per row). Revisit once
-- real dispatch exists.
--
-- One fixed-window counter table + one atomic check-and-increment
-- function, reused by every call site: auth-stage Server Actions
-- (login/register/activate) call it via the admin/service-role client
-- since no session exists yet; the three CSV bulk-add functions below
-- have it inlined directly in the SQL, so it can't be bypassed by
-- calling the RPC directly (same reasoning as every other DB-enforced
-- invariant in this schema).

create table "RateLimitBucket" (
  bucket_key text primary key,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 1
);

-- No RLS -- this table holds no tenant/user data, only opaque counters
-- keyed by caller-chosen strings (email/IP/admin_id), and is only ever
-- touched through this SECURITY DEFINER function, never queried directly
-- by any client role.
create or replace function check_rate_limit(p_key text, p_max_attempts int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into "RateLimitBucket" (bucket_key, window_start, attempt_count)
  values (p_key, now(), 1)
  on conflict (bucket_key) do update set
    attempt_count = case
      when "RateLimitBucket".window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else "RateLimitBucket".attempt_count + 1
    end,
    window_start = case
      when "RateLimitBucket".window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else "RateLimitBucket".window_start
    end
  returning attempt_count into v_count;

  return v_count <= p_max_attempts;
end;
$$;

revoke all on function check_rate_limit(text, int, int) from public;
grant execute on function check_rate_limit(text, int, int) to anon, authenticated, service_role;

-- Cleanup: buckets are small and short-lived (windows measured in
-- minutes/hours), but every distinct key used ever leaves a permanent
-- row otherwise. Daily sweep of anything untouched for a day is more
-- than enough margin above the longest window used below (1 hour).
create or replace function cleanup_rate_limit_buckets()
returns void
language sql
security definer
set search_path = public
as $$
  delete from "RateLimitBucket" where window_start < now() - interval '1 day';
$$;

revoke all on function cleanup_rate_limit_buckets() from public;
grant execute on function cleanup_rate_limit_buckets() to service_role;

select cron.schedule(
  'cleanup-rate-limit-buckets',
  '30 3 * * *',
  $$select cleanup_rate_limit_buckets();$$
);

-- Doc 3 Section 6's "bulk operations (CSV import)" -- renaming the
-- existing function (migration 041) to an `_impl` suffix and wrapping it
-- with a rate-limit check preserves its exact original body (including
-- its `search_path = public, extensions` needed for pgcrypto) without
-- retyping it, same reasoning as never hand-transcribing a working
-- function body when ALTER FUNCTION can do it safely instead. Keyed per
-- calling admin, per function CALL (not per row) -- a single legitimate
-- large CSV import is one call creating many rows, so this guards against
-- rapid repeated SUBMISSIONS, not large ones.
alter function admin_bulk_add_teachers(jsonb) rename to admin_bulk_add_teachers_impl;
alter function admin_bulk_add_students(jsonb) rename to admin_bulk_add_students_impl;
alter function admin_bulk_add_families(jsonb) rename to admin_bulk_add_families_impl;

create function admin_bulk_add_teachers(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not check_rate_limit('bulk_import:' || auth_admin_id()::text, 10, 3600) then
    raise exception 'Too many bulk imports submitted recently -- please wait before trying again';
  end if;
  return admin_bulk_add_teachers_impl(p_rows);
end;
$$;

create function admin_bulk_add_students(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not check_rate_limit('bulk_import:' || auth_admin_id()::text, 10, 3600) then
    raise exception 'Too many bulk imports submitted recently -- please wait before trying again';
  end if;
  return admin_bulk_add_students_impl(p_rows);
end;
$$;

create function admin_bulk_add_families(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not check_rate_limit('bulk_import:' || auth_admin_id()::text, 10, 3600) then
    raise exception 'Too many bulk imports submitted recently -- please wait before trying again';
  end if;
  return admin_bulk_add_families_impl(p_rows);
end;
$$;

revoke all on function admin_bulk_add_teachers(jsonb) from public;
grant execute on function admin_bulk_add_teachers(jsonb) to authenticated;
revoke all on function admin_bulk_add_students(jsonb) from public;
grant execute on function admin_bulk_add_students(jsonb) to authenticated;
revoke all on function admin_bulk_add_families(jsonb) from public;
grant execute on function admin_bulk_add_families(jsonb) to authenticated;

-- The _impl functions are now internal-only -- the public grant moved to
-- the wrapper above, so revoke whatever grant the original carried
-- (authenticated, from migration 041) to close the bypass path.
revoke all on function admin_bulk_add_teachers_impl(jsonb) from public, authenticated;
revoke all on function admin_bulk_add_students_impl(jsonb) from public, authenticated;
revoke all on function admin_bulk_add_families_impl(jsonb) from public, authenticated;
