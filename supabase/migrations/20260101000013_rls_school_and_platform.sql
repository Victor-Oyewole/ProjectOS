-- Mirrors supabase/policies/010_school_and_platform.sql, the reviewed source of truth for this
-- policy set (see Doc 3 Sec 1 / Sec 5). Kept in sync manually: edit the
-- policies file first, then copy the change into a new migration here --
-- supabase db push only runs files in supabase/migrations/, never
-- supabase/policies/ directly.

-- School, PlatformAdmin, Subscription, AuditLog.
--
-- School self-registration (Doc 24 Section 2) is a Milestone 1 feature with
-- its own bootstrapping concern (a brand-new school owner has no school_id/
-- admin_id claims yet, since those don't exist until the signup transaction
-- completes) -- that flow is deliberately NOT given a client-facing INSERT
-- policy here. In Milestone 0, School/SchoolAdmin rows for test/dev schools
-- are created via the service-role client only.

alter table "School" enable row level security;

create policy "school_select_own_or_platform_admin" on "School"
  as permissive for select to authenticated
  using (school_id = auth_school_id() or is_platform_admin());

create policy "school_update_own_admin" on "School"
  as permissive for update to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "school_all_platform_admin" on "School"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "PlatformAdmin" enable row level security;

create policy "platformadmin_select_self" on "PlatformAdmin"
  as permissive for select to authenticated
  using (platform_admin_id = auth_platform_admin_id());

alter table "Subscription" enable row level security;

create policy "subscription_select_own_school" on "Subscription"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "subscription_all_platform_admin" on "Subscription"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "AuditLog" enable row level security;

-- Doc 23 Section 6: Platform Admin sees every school's audit log; School
-- Admin sees only their own school's.
create policy "auditlog_select_own_school_admin" on "AuditLog"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "auditlog_select_all_platform_admin" on "AuditLog"
  as permissive for select to authenticated
  using (is_platform_admin());

-- Any authenticated role can write an audit entry for their own school --
-- AuditLog rows are never updated or deleted (no update/delete policy
-- defined, so both are denied by default).
create policy "auditlog_insert_own_school" on "AuditLog"
  as permissive for insert to authenticated
  with check (school_id = auth_school_id() or is_platform_admin());
