-- Doc 27 UI pass: the score-entry screen needs to read a narrative_milestone
-- school's MilestoneScale.levels to populate the teacher's level picker, but
-- MilestoneScale (migration 046) only ever granted admin/platform-admin
-- access -- teacher had no select policy at all. Same class of gap as the
-- Milestone 5 cross-tenant visibility fixes (050/051), just same-tenant.

create policy "milestonescale_select_teacher" on "MilestoneScale"
  as permissive for select to authenticated
  using (auth_app_role() = 'teacher' and school_id = auth_school_id());
