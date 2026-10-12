-- Found via manual browser testing of Doc 12 Step 4 (Students tab):
-- confirming an identity match against a student already enrolled at the
-- admin's own school created a SECOND SchoolEnrollment row for the same
-- (platform_student_id, school_id) pair -- nothing in the schema stopped
-- it. A student legitimately CAN have multiple SchoolEnrollment rows over
-- time (transfer out, transfer back in later), so a blanket unique
-- constraint on (platform_student_id, school_id) would be wrong -- the
-- real invariant is "at most one ACTIVE enrollment per student per
-- school," which a partial unique index expresses directly. Matches this
-- project's general preference for DB-enforced invariants over
-- app-layer-only checks (Doc 3's RLS rationale, same reasoning).
--
-- The app-layer fix (actions.ts checking for an existing active enrollment
-- before inserting) is the primary fix for the UX -- this is defense in
-- depth, not a replacement for it.
create unique index idx_schoolenrollment_one_active_per_school
  on "SchoolEnrollment" (platform_student_id, school_id)
  where status = 'Active';
