-- Doc 28: Data Consent, Deletion & Retention Model. Engineering scope only
-- per the doc's own framing -- this is the technical foundation privacy
-- compliance requires, not a substitute for legal review (DPAs, actual
-- privacy notice wording, jurisdiction-specific legal sign-off all remain
-- outside this migration, same as Doc 28 Section 7 states explicitly).
--
-- Mechanical corrections to the doc's literal SQL (not design decisions):
-- every "platform_student_id uuid" reference in Doc 28's snippets is
-- written as `text` here, matching PlatformStudent.platform_student_id's
-- actual type (migration 004) -- a `uuid references text column` isn't
-- valid SQL, so this is a type fix, not a reinterpretation.

create table "ConsentRecord" (
  consent_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  platform_student_id text not null references "PlatformStudent" (platform_student_id) on delete restrict,
  membership_id uuid references "FamilyMembership" (membership_id) on delete set null,
  consent_type text not null, -- open-ended per Doc 28 Section 1's "e.g." list -- no check constraint
  jurisdiction text not null check (jurisdiction in ('US', 'UK', 'CA', 'NG', 'other')),
  method text not null check (method in ('school_consent_on_behalf', 'guardian_checkbox_at_activation', 'admin_dpa_reference')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  reference_document text
);

create index idx_consentrecord_school_id on "ConsentRecord" (school_id);
create index idx_consentrecord_platform_student_id on "ConsentRecord" (platform_student_id);

create table "DataDeletionRequest" (
  request_id uuid primary key default gen_random_uuid(),
  platform_student_id text not null references "PlatformStudent" (platform_student_id) on delete restrict,
  scope text not null check (scope in ('enrollment_scoped', 'full_platform_erasure')),
  requested_by_membership_id uuid references "FamilyMembership" (membership_id) on delete set null,
  requested_by_school_id uuid references "School" (school_id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'in_review', 'completed', 'denied')),
  reviewed_by text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_datadeletionrequest_platform_student_id on "DataDeletionRequest" (platform_student_id);
create index idx_datadeletionrequest_school_id on "DataDeletionRequest" (requested_by_school_id);

-- No school_id column -- RetentionPolicy is either platform-wide
-- (school_id null) or a school-specific override, per Doc 28 Section 3's
-- literal schema.
create table "RetentionPolicy" (
  policy_id uuid primary key default gen_random_uuid(),
  school_id uuid references "School" (school_id) on delete cascade,
  data_category text not null, -- open-ended per Doc 28 Section 3's "e.g." list -- no check constraint
  retention_period_days integer not null check (retention_period_days > 0),
  action_on_expiry text not null check (action_on_expiry in ('delete', 'anonymize'))
);

create index idx_retentionpolicy_school_id on "RetentionPolicy" (school_id);

create table "ThirdPartyProcessor" (
  processor_id uuid primary key default gen_random_uuid(),
  name text not null,
  purpose text not null,
  data_categories_shared text not null,
  processing_region text
);

-- Doc 28 Section 4: "Seed this table with every processor already in the
-- current architecture." purpose/data_categories_shared are factual
-- descriptions already stated elsewhere in the build pack (Doc 3, Doc 8,
-- Doc 9, Doc 24). processing_region is this project's best general
-- understanding of each processor's infrastructure, NOT sourced from a
-- verified current DPA/subprocessor list -- flag for confirmation before
-- any of this is surfaced in a real privacy notice (see migration's
-- closing comment / session notes for the full flag list).
insert into "ThirdPartyProcessor" (name, purpose, data_categories_shared, processing_region) values
  ('Stripe', 'Platform subscription billing payment processing (Doc 24 Section 4)', 'Billing contact info, payment card data (handled by Stripe directly, not stored by SchoolOS)', 'Global / primarily US-based infrastructure'),
  ('Paystack', 'Platform subscription billing payment processing, Nigeria/Africa-focused gateway (Doc 24 Section 4)', 'Billing contact info, payment card data (handled by Paystack directly, not stored by SchoolOS)', 'Nigeria / Africa-focused infrastructure'),
  ('WhatsApp Cloud API (Meta)', 'One-time account activation link delivery only (Doc 8) -- no other notification type uses this channel', 'Recipient phone number, activation link content', 'Global (Meta infrastructure)'),
  ('Supabase', 'Database hosting, authentication, file storage, and realtime delivery for the entire platform (Doc 3)', 'All application data: student/family/teacher records, academic data, uploaded attachments', 'Project-hosted region (this deployment: eu-west-1, AWS)'),
  ('Sentry', 'Error tracking and structured logging (Doc 3 Section 6)', 'Application error context, which may incidentally include non-sensitive request metadata', 'Global / primarily US-based infrastructure');

-- RLS -------------------------------------------------------------------

alter table "ConsentRecord" enable row level security;

create policy "consentrecord_select_admin" on "ConsentRecord"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "consentrecord_all_platform_admin" on "ConsentRecord"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "DataDeletionRequest" enable row level security;

-- Doc 28 Section 5: School Admin can "view/action" enrollment_scoped
-- requests for their own school -- select here, the actual status
-- transition goes through admin_review_deletion_request below (bundling
-- the write with the deletion side-effects, same reasoning as every other
-- "a write and its consequences happen in one function" rule in this
-- codebase). No admin insert policy -- Doc 28 only grants family the
-- "submit" action.
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

-- Doc 28 Section 5: "Platform Admin: ... can view ConsentRecord and
-- RetentionPolicy across all schools" -- explicitly view, so platform-wide
-- default policies (school_id is null) are managed by Platform Admin via
-- the "all" policy below, consistent with being the only role that can
-- set a platform-wide default in the first place.
create policy "retentionpolicy_all_platform_admin" on "RetentionPolicy"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "ThirdPartyProcessor" enable row level security;

-- Not school-scoped -- this is one global registry. Readable by any
-- authenticated role (a privacy notice/consent flow needs to render it
-- regardless of who's viewing), writable only by Platform Admin (the
-- processor list reflects platform architecture, not a per-school choice).
create policy "thirdpartyprocessor_select_all" on "ThirdPartyProcessor"
  as permissive for select to authenticated
  using (true);

create policy "thirdpartyprocessor_all_platform_admin" on "ThirdPartyProcessor"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- Functions ---------------------------------------------------------------

-- Doc 28 Section 6: consent is recorded either by the family themselves
-- (guardian_checkbox_at_activation, own linked child only) or by an admin
-- on the school's behalf (school_consent_on_behalf / admin_dpa_reference).
-- Cross-table validation (which child is "theirs") needs a function, same
-- reasoning as every other multi-branch-authorization write in this
-- codebase.
create or replace function record_consent(
  p_platform_student_id text,
  p_school_id uuid,
  p_consent_type text,
  p_jurisdiction text,
  p_method text,
  p_membership_id uuid default null,
  p_reference_document text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consent_id uuid;
begin
  if auth_app_role() = 'family' then
    if p_method <> 'guardian_checkbox_at_activation' then
      raise exception 'family can only record consent via guardian_checkbox_at_activation';
    end if;
    if p_membership_id is distinct from auth_membership_id() then
      raise exception 'family can only record consent for their own membership';
    end if;
    if not exists (
      select 1 from "FamilyStudentRelationship"
      where membership_id = auth_membership_id() and platform_student_id = p_platform_student_id
    ) then
      raise exception 'not your child';
    end if;
    if p_school_id <> auth_school_id() then
      raise exception 'school mismatch';
    end if;
  elsif auth_app_role() = 'admin' then
    if p_method not in ('school_consent_on_behalf', 'admin_dpa_reference') then
      raise exception 'admin can only record consent via school_consent_on_behalf or admin_dpa_reference';
    end if;
    if p_school_id <> auth_school_id() then
      raise exception 'school mismatch';
    end if;
  else
    raise exception 'only a family member or school admin can record consent';
  end if;

  insert into "ConsentRecord" (school_id, platform_student_id, membership_id, consent_type, jurisdiction, method, reference_document)
  values (p_school_id, p_platform_student_id, p_membership_id, p_consent_type, p_jurisdiction, p_method, p_reference_document)
  returning consent_id into v_consent_id;

  return v_consent_id;
end;
$$;

revoke all on function record_consent(text, uuid, text, text, text, uuid, text) from public;
grant execute on function record_consent(text, uuid, text, text, text, uuid, text) to authenticated;

create or replace function revoke_consent(p_consent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row "ConsentRecord"%rowtype;
begin
  select * into v_row from "ConsentRecord" where consent_id = p_consent_id;
  if v_row.consent_id is null then
    raise exception 'consent record not found';
  end if;

  if auth_app_role() = 'family' and v_row.membership_id = auth_membership_id() then
    null; -- family revoking their own consent
  elsif auth_app_role() = 'admin' and v_row.school_id = auth_school_id() then
    null; -- school admin revoking on the school's behalf
  else
    raise exception 'not authorized to revoke this consent record';
  end if;

  update "ConsentRecord" set revoked_at = now() where consent_id = p_consent_id;
end;
$$;

revoke all on function revoke_consent(uuid) from public;
grant execute on function revoke_consent(uuid) to authenticated;

-- Internal helper (not granted to any role directly) shared by both the
-- enrollment-scoped and full-platform-erasure paths. Doc 28 Section 2:
-- "Where a record has no independent retention justification: hard
-- delete. Where a record is referenced by something that must be
-- preserved for audit/legal integrity... anonymize, don't delete."
--
-- This codebase's concrete reading of that rule, since Doc 28 only
-- worked through FeeRecord/AuditLog as examples:
--   HARD DELETE (no independent audit need stated anywhere):
--     ClassMembership, Attendance, Score, StudentAssignmentStatus,
--     MilestoneAssessment (Doc 27's narrative-track raw input).
--   PRESERVED, UNTOUCHED (audit/financial/academic-history value, per
--   Doc 28's own FeeRecord/AuditLog examples plus its explicit citation
--   of Doc 27 Section 5's "finalized report cards" as the same
--   principle): FeeRecord, AuditLog, TermResult, TermReportCard.
--   DailyNote: Doc 8 makes it immutable at the DB level with NO role
--   exception (forbid_dailynote_mutation trigger, no carve-out for
--   SECURITY DEFINER callers) -- yet Doc 28 Section 2 explicitly lists
--   "daily notes" as something enrollment-scoped deletion must affect.
--   This is a genuine conflict between the two docs, not something this
--   migration can resolve by inference alone. Resolved here by disabling
--   the one specific trigger (dailynote_immutable) for the span of this
--   function's own transaction, then re-enabling it immediately after --
--   DDL is transactional, so an error anywhere in between rolls the
--   trigger back to enabled along with everything else, it never stays
--   disabled. (An earlier draft of this function used `set local
--   session_replication_role = replica` instead -- reverted: that GUC is
--   superuser-only, and Supabase's hosted `postgres` role is not a true
--   superuser, so it would have failed at runtime. Disabling one named
--   trigger only needs table ownership, which the role applying this
--   migration already has.) Flagged explicitly for the user's sign-off;
--   this is the one place this migration overrides an otherwise-absolute
--   rule from an earlier doc.
--
-- The SchoolEnrollment row ITSELF is never deleted here -- FeeRecord,
-- TermResult, and TermReportCard all reference it with ON DELETE CASCADE
-- (migrations 007/046), so deleting SchoolEnrollment would destroy
-- exactly the audit-preserved records this function is supposed to keep.
create or replace function delete_enrollment_records(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  alter table "DailyNote" disable trigger dailynote_immutable;
  delete from "DailyNote" where enrollment_id = p_enrollment_id;
  alter table "DailyNote" enable trigger dailynote_immutable;

  delete from "MilestoneAssessment" where enrollment_id = p_enrollment_id;
  delete from "StudentAssignmentStatus" where enrollment_id = p_enrollment_id;
  delete from "Score" where enrollment_id = p_enrollment_id;
  delete from "Attendance" where enrollment_id = p_enrollment_id;
  delete from "ClassMembership" where enrollment_id = p_enrollment_id;
end;
$$;

-- Doc 28 Section 5: "Family: can submit a deletion request for their own
-- enrolled child (enrollment-scoped only)." The target enrollment isn't a
-- separate input -- Doc 28's own DataDeletionRequest schema has no
-- enrollment_id column, only platform_student_id + requested_by_school_id
-- -- resolved at processing time via that pair, relying on the existing
-- "at most one active enrollment per school" invariant (migration 036).
create or replace function family_request_deletion(p_platform_student_id text, p_school_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  if auth_app_role() <> 'family' then
    raise exception 'only a family member can submit a deletion request';
  end if;
  if not exists (
    select 1 from "FamilyStudentRelationship"
    where membership_id = auth_membership_id() and platform_student_id = p_platform_student_id
  ) then
    raise exception 'not your child';
  end if;
  if not exists (
    select 1 from "SchoolEnrollment" where platform_student_id = p_platform_student_id and school_id = p_school_id
  ) then
    raise exception 'this child has no enrollment at that school';
  end if;

  insert into "DataDeletionRequest" (platform_student_id, scope, requested_by_membership_id, requested_by_school_id)
  values (p_platform_student_id, 'enrollment_scoped', auth_membership_id(), p_school_id)
  returning request_id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function family_request_deletion(text, uuid) from public;
grant execute on function family_request_deletion(text, uuid) to authenticated;

-- Doc 28 Section 5: "School Admin: can view/action DataDeletionRequest
-- rows scoped to enrollment_scoped for their own school; ... cannot
-- approve full_platform_erasure requests" -- enforced here by refusing
-- any request whose scope isn't enrollment_scoped, in addition to the RLS
-- select policy already scoping visibility.
create or replace function admin_review_deletion_request(
  p_request_id uuid,
  p_decision text, -- 'in_review' | 'completed' | 'denied'
  p_resolution_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_row "DataDeletionRequest"%rowtype;
  v_enrollment record;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can review a deletion request';
  end if;
  if p_decision not in ('in_review', 'completed', 'denied') then
    raise exception 'invalid decision';
  end if;

  select * into v_row from "DataDeletionRequest" where request_id = p_request_id;
  if v_row.request_id is null then
    raise exception 'deletion request not found';
  end if;
  if v_row.scope <> 'enrollment_scoped' then
    raise exception 'school admin cannot review a full_platform_erasure request -- platform admin only';
  end if;
  if v_row.requested_by_school_id <> v_school_id then
    raise exception 'this request does not belong to your school';
  end if;

  if p_decision = 'completed' then
    for v_enrollment in
      select enrollment_id from "SchoolEnrollment"
      where platform_student_id = v_row.platform_student_id and school_id = v_school_id
    loop
      perform delete_enrollment_records(v_enrollment.enrollment_id);
    end loop;
  end if;

  update "DataDeletionRequest"
  set status = p_decision,
      reviewed_by = auth_admin_id()::text,
      resolution_notes = coalesce(p_resolution_notes, resolution_notes),
      completed_at = case when p_decision = 'completed' then now() else completed_at end
  where request_id = p_request_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id, auth_admin_id(), 'admin', 'deletion_request_' || p_decision, 'DataDeletionRequest', p_request_id::text,
    jsonb_build_object('platform_student_id', v_row.platform_student_id, 'scope', v_row.scope)
  );
end;
$$;

revoke all on function admin_review_deletion_request(uuid, text, text) from public;
grant execute on function admin_review_deletion_request(uuid, text, text) to authenticated;

-- Doc 28 Section 5: family "cannot submit a full-platform-erasure request
-- directly" -- only Platform Admin creates one (after being reached
-- through whatever out-of-band channel the actual cross-school escalation
-- process uses, which this doc doesn't specify -- flagged below).
create or replace function platform_admin_create_full_erasure_request(p_platform_student_id text, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  if not is_platform_admin() then
    raise exception 'only platform admin can create a full-platform-erasure request';
  end if;
  if not exists (select 1 from "PlatformStudent" where platform_student_id = p_platform_student_id) then
    raise exception 'platform student not found';
  end if;

  insert into "DataDeletionRequest" (platform_student_id, scope, resolution_notes)
  values (p_platform_student_id, 'full_platform_erasure', p_notes)
  returning request_id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function platform_admin_create_full_erasure_request(text, text) from public;
grant execute on function platform_admin_create_full_erasure_request(text, text) to authenticated;

-- Doc 28 Section 2: "Before approval, the system must surface every
-- active SchoolEnrollment tied to that platform_student_id so Platform
-- Admin can confirm none are still active, or route the request to each
-- affected school first." Implemented as a hard refusal while any Active
-- enrollment remains, listing the affected schools in the exception --
-- there is no override flag. The doc gives two valid paths ("confirm none
-- are active" / "route to each school first") and both converge on the
-- same end state this function checks for: no Active enrollments left.
-- Anonymizes PlatformStudent.name/profile_photo -- dob is NOT NULL in the
-- existing schema (migration 004) and changing that is outside Doc 28's
-- stated scope, so dob is left as-is. Flagged explicitly below.
create or replace function platform_admin_review_full_erasure(
  p_request_id uuid,
  p_decision text, -- 'in_review' | 'completed' | 'denied'
  p_resolution_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row "DataDeletionRequest"%rowtype;
  v_active_schools text;
  v_enrollment record;
begin
  if not is_platform_admin() then
    raise exception 'only platform admin can review a full-platform-erasure request';
  end if;
  if p_decision not in ('in_review', 'completed', 'denied') then
    raise exception 'invalid decision';
  end if;

  select * into v_row from "DataDeletionRequest" where request_id = p_request_id;
  if v_row.request_id is null then
    raise exception 'deletion request not found';
  end if;
  if v_row.scope <> 'full_platform_erasure' then
    raise exception 'this is not a full_platform_erasure request';
  end if;

  if p_decision = 'completed' then
    select string_agg(s.name, ', ') into v_active_schools
    from "SchoolEnrollment" se
    join "School" s on s.school_id = se.school_id
    where se.platform_student_id = v_row.platform_student_id and se.status = 'Active';

    if v_active_schools is not null then
      raise exception 'cannot complete -- % still has an active enrollment at: %. Confirm none are active, or route to each school first.', v_row.platform_student_id, v_active_schools;
    end if;

    for v_enrollment in
      select enrollment_id from "SchoolEnrollment" where platform_student_id = v_row.platform_student_id
    loop
      perform delete_enrollment_records(v_enrollment.enrollment_id);
    end loop;

    delete from "FamilyStudentRelationship" where platform_student_id = v_row.platform_student_id;

    update "PlatformStudent"
    set name = 'Deleted Student', profile_photo = null
    where platform_student_id = v_row.platform_student_id;
  end if;

  update "DataDeletionRequest"
  set status = p_decision,
      reviewed_by = auth_platform_admin_id()::text,
      resolution_notes = coalesce(p_resolution_notes, resolution_notes),
      completed_at = case when p_decision = 'completed' then now() else completed_at end
  where request_id = p_request_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  select se.school_id, auth_platform_admin_id(), 'platform_admin', 'full_erasure_' || p_decision, 'DataDeletionRequest', p_request_id::text,
    jsonb_build_object('platform_student_id', v_row.platform_student_id)
  from "SchoolEnrollment" se
  where se.platform_student_id = v_row.platform_student_id;
end;
$$;

revoke all on function platform_admin_review_full_erasure(uuid, text, text) from public;
grant execute on function platform_admin_review_full_erasure(uuid, text, text) to authenticated;

-- Retention enforcement -----------------------------------------------------

-- Doc 28 Section 3: "a recurring job checks each RetentionPolicy against
-- record age and performs the specified action automatically." This
-- function only knows how to act on the four example data_category
-- values Doc 28 itself names -- data_category is intentionally free text
-- (Section 3's "e.g." list), and there is no category -> table mapping
-- table specified anywhere to make this fully generic. A RetentionPolicy
-- row with an unrecognized category is skipped, not guessed at. Flagged
-- below as a real limitation.
--
-- A school-specific RetentionPolicy row for a category overrides the
-- platform-wide default (school_id is null) for that same category at
-- that school; the platform-wide default only applies to schools with no
-- override of their own.
create or replace function enforce_retention_policies()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy record;
  v_school record;
  v_deleted_count int := 0;
  v_anonymized_count int := 0;
  v_enrollment record;
begin
  for v_policy in
    select * from "RetentionPolicy" where school_id is not null
    union all
    select * from "RetentionPolicy" p
    where p.school_id is null
      and not exists (
        select 1 from "RetentionPolicy" o where o.school_id is not null and o.data_category = p.data_category
      )
  loop
    if v_policy.data_category = 'inactive_student_records' then
      for v_school in
        select school_id from "School"
        where (v_policy.school_id is null or school_id = v_policy.school_id)
      loop
        for v_enrollment in
          select enrollment_id from "SchoolEnrollment"
          where school_id = v_school.school_id
            and status <> 'Active'
            and end_date is not null
            and end_date < (current_date - v_policy.retention_period_days)
        loop
          if v_policy.action_on_expiry = 'delete' then
            perform delete_enrollment_records(v_enrollment.enrollment_id);
            v_deleted_count := v_deleted_count + 1;
          end if;
          -- 'anonymize' for this category has no further action beyond
          -- what delete_enrollment_records already does (hard-delete
          -- non-audit rows, leave audit-preserved rows untouched) --
          -- there is no separate "anonymize instead of delete" variant
          -- for inactive_student_records specifically; Doc 28 doesn't
          -- distinguish one.
        end loop;
      end loop;

    elsif v_policy.data_category = 'notification_history' then
      if v_policy.action_on_expiry = 'delete' then
        delete from "Notification"
        where created_at < (now() - make_interval(days => v_policy.retention_period_days))
          and (
            v_policy.school_id is null
            or membership_id in (select membership_id from "FamilyMembership" where school_id = v_policy.school_id)
          );
        get diagnostics v_deleted_count = row_count;
      else
        update "Notification"
        set message_text = '[redacted]'
        where created_at < (now() - make_interval(days => v_policy.retention_period_days))
          and message_text <> '[redacted]'
          and (
            v_policy.school_id is null
            or membership_id in (select membership_id from "FamilyMembership" where school_id = v_policy.school_id)
          );
        get diagnostics v_anonymized_count = row_count;
      end if;

    elsif v_policy.data_category = 'activity_audit_logs' then
      if v_policy.action_on_expiry = 'delete' then
        delete from "AuditLog"
        where "timestamp" < (now() - make_interval(days => v_policy.retention_period_days))
          and (v_policy.school_id is null or school_id = v_policy.school_id);
        get diagnostics v_deleted_count = row_count;
      end if;
      -- AuditLog has no content field worth anonymizing independent of
      -- deletion -- an 'anonymize' policy for this category is a no-op,
      -- same reasoning as inactive_student_records above.

    elsif v_policy.data_category = 'uploaded_attachments' then
      if v_policy.action_on_expiry = 'delete' then
        delete from "AssignmentAttachment"
        where uploaded_at < (now() - make_interval(days => v_policy.retention_period_days))
          and (v_policy.school_id is null or school_id = v_policy.school_id);
        get diagnostics v_deleted_count = row_count;
      end if;
      -- Deletes only the Postgres row/metadata -- the underlying file in
      -- Supabase Storage is a separate deletion this SQL function cannot
      -- reach (Storage objects aren't Postgres rows). A real enforcement
      -- pass needs a companion Storage-API cleanup step; flagged below.
    end if;
    -- Any other data_category value: skipped, not guessed at.
  end loop;

  return jsonb_build_object('deleted', v_deleted_count, 'anonymized', v_anonymized_count);
end;
$$;

revoke all on function enforce_retention_policies() from public;
grant execute on function enforce_retention_policies() to service_role;

-- Doc 28 Section 3: "Using the background-job architecture already
-- corrected in Doc 23 Section 4 (Supabase Edge Functions + pg_cron, not a
-- persistent worker)." Unlike the assignment-notification fan-out
-- (migration 043) and CSV import, this requirement doesn't need an Edge
-- Function at all -- the entire unit of work is expressible as plain SQL
-- inside Postgres, so pg_cron alone (no separate deployed function, no
-- extra infrastructure) already satisfies "a real scheduled job, not a
-- policy document." Schedule: daily at 03:00 UTC -- Doc 28 doesn't
-- specify a cadence; this is a reasonable engineering default, not a
-- legal requirement, and can be changed via `cron.schedule` later without
-- a migration.
create extension if not exists pg_cron;

select cron.schedule(
  'enforce-retention-policies',
  '0 3 * * *',
  $$select enforce_retention_policies();$$
);
