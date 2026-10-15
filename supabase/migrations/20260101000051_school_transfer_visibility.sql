-- Doc 16 Milestone 5 (Transfers), same gap as migration 050 but for
-- School rather than PlatformStudent: school_select_own_or_platform_admin
-- (010_school_and_platform.sql) only allows an admin to see their OWN
-- School row, so an embedded `FromSchool:from_school_id(name)` /
-- `ToSchool:to_school_id(name)` select on TransferRequest silently comes
-- back null for the other party's school -- caught live in browser
-- verification: the outgoing-requests list showed "QA Fixture Student A
-- -- releasing school -- on ..." with the releasing school's name
-- missing, because the requesting (to) school's admin isn't allowed to
-- read the releasing (from) school's row.
--
-- Same fix shape as migration 050: an additional OR clause granting
-- visibility when a TransferRequest links this School to the caller's own
-- school on either side.
alter policy "school_select_own_or_platform_admin" on "School"
  using (
    school_id = auth_school_id()
    or is_platform_admin()
    or exists (
      select 1 from "TransferRequest" tr
      where (tr.from_school_id = "School".school_id or tr.to_school_id = "School".school_id)
        and (tr.from_school_id = auth_school_id() or tr.to_school_id = auth_school_id())
    )
  );
