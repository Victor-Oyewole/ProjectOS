-- ConsentRecord, DataDeletionRequest, RetentionPolicy, ThirdPartyProcessor
-- (Doc 28). Mirrors 20260101000047_consent_deletion_retention.sql -- see
-- that migration for the full reasoning; this file is the human-reviewed
-- source of truth per this project's convention
-- (supabase_policies_not_auto_applied), kept in sync manually.

alter table "ConsentRecord" enable row level security;

create policy "consentrecord_select_admin" on "ConsentRecord"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "consentrecord_all_platform_admin" on "ConsentRecord"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "DataDeletionRequest" enable row level security;

create policy "datadeletionrequest_select_admin_enrollment_scoped" on "DataDeletionRequest"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and scope = 'enrollment_scoped' and requested_by_school_id = auth_school_id());

create policy "datadeletionrequest_select_family_own" on "DataDeletionRequest"
  as permissive for select to authenticated
  using (auth_app_role() = 'family' and requested_by_membership_id = auth_membership_id());

create policy "datadeletionrequest_all_platform_admin" on "DataDeletionRequest"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "RetentionPolicy" enable row level security;

create policy "retentionpolicy_all_admin_own_school" on "RetentionPolicy"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "retentionpolicy_all_platform_admin" on "RetentionPolicy"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "ThirdPartyProcessor" enable row level security;

create policy "thirdpartyprocessor_select_all" on "ThirdPartyProcessor"
  as permissive for select to authenticated
  using (true);

create policy "thirdpartyprocessor_all_platform_admin" on "ThirdPartyProcessor"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
