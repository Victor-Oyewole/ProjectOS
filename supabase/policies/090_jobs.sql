-- Job, JobRecipientStatus.
--
-- Pure background-job plumbing (Doc 23 Section 4): written and processed by
-- the job execution layer (Supabase Edge Functions / pg_cron), which runs
-- under the service role and so isn't subject to RLS at all. No doc
-- describes school admin, teacher, or family ever reading or writing these
-- tables directly -- the operational visibility mentioned in Doc 20 Section
-- 7 (job queue depth/failure rate) is a Sentry/structured-logging concern,
-- not an in-app query against these rows, and the Platform Admin Dashboard
-- spec (Doc 17-equivalent, "Platform Admin Dashboard" section) doesn't list
-- job internals either. So: platform-admin override only, no per-school
-- role gets a policy here.

alter table "Job" enable row level security;

create policy "job_all_platform_admin" on "Job"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "JobRecipientStatus" enable row level security;

create policy "jobrecipientstatus_all_platform_admin" on "JobRecipientStatus"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
