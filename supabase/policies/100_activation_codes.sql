-- ActivationCode. Doc 12 Step 4/5 + "Activation Code Lifecycle" --
-- never-specified-in-Doc-10 table, designed from the behavioral spec
-- (migration 037, which also has admin_generate_activation_code(),
-- validate_activation_code(), and consume_activation_code() -- not
-- mirrored here, same convention as register_school/
-- admin_create_family_person: functions live solely in their migration).
--
-- No insert/update policy for anyone: every mutation goes through one of
-- those three SECURITY DEFINER functions.

alter table "ActivationCode" enable row level security;

create policy "activationcode_select_admin" on "ActivationCode"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "activationcode_all_platform_admin" on "ActivationCode"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
