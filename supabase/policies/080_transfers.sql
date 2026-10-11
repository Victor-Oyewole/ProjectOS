-- TransferRequest, TransferPackage.
--
-- Doc 7 flow: the NEW school (to_school_id) submits the request; the OLD
-- school (from_school_id) reviews and approves/denies, choosing which
-- records to release. Doc 6 / Doc 23 Section 6: admin can view/approve/deny
-- "both incoming and outgoing" -- i.e. an admin sees requests where their
-- own school is on either side, but can only resolve (approve/deny) the
-- ones where their school is the releasing (from) side.
--
-- TransferPackage is system-generated ("System generates a controlled
-- Transfer Package", Doc 7) once the old school's admin makes their
-- release decision -- not a row an admin inserts directly, same reasoning
-- as system-sourced Notification rows in 070_notifications.sql. Only a
-- select policy is granted here.

alter table "TransferRequest" enable row level security;

create policy "transferrequest_select_admin" on "TransferRequest"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'admin'
    and (from_school_id = auth_school_id() or to_school_id = auth_school_id())
  );

create policy "transferrequest_insert_admin_new_school" on "TransferRequest"
  as permissive for insert to authenticated
  with check (
    auth_app_role() = 'admin'
    and requested_by = auth_admin_id()
    and to_school_id = auth_school_id()
  );

create policy "transferrequest_update_admin_old_school" on "TransferRequest"
  as permissive for update to authenticated
  using (auth_app_role() = 'admin' and from_school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and from_school_id = auth_school_id());

create policy "transferrequest_all_platform_admin" on "TransferRequest"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "TransferPackage" enable row level security;

create policy "transferpackage_select_admin" on "TransferPackage"
  as permissive for select to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (
      select 1 from "TransferRequest" tr
      where tr.request_id = "TransferPackage".request_id
        and (tr.from_school_id = auth_school_id() or tr.to_school_id = auth_school_id())
    )
  );

create policy "transferpackage_all_platform_admin" on "TransferPackage"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
