-- Doc 27: Results Computation & Report Card Model. Extends Doc 10's
-- Assessment/Score tables (not a replacement) -- see Doc 27 for the full
-- spec. This migration is schema + computation logic only; no UI changes
-- (Doc 27 Section 7's UI notes are a separate, not-yet-built pass).
--
-- One real gap in Doc 27 itself: Section 5's workflow explicitly requires
-- "validates assessment weights sum to 100% per subject" at compute time,
-- but no section actually adds a weight field to Assessment -- without one,
-- there is nothing to sum. Adding `Assessment.weight` here is an inferred,
-- necessary extension, not something Doc 27 states outright. Kept as a
-- plain percentage (0-100) to match the doc's own "sum to 100%" language.
--
-- Status values on TermResult/TermReportCard are kept as the lowercase
-- draft/finalized/published Doc 27 specifies verbatim, even though every
-- other status column in this codebase uses PascalCase (Published,
-- Retracted, Active, ...) -- Doc 27 is authoritative on its own literal
-- schema per its own instructions, this is a doc-introduced inconsistency,
-- not a transcription error to silently "fix".

alter table "School"
  add column assessment_model text not null default 'equal_weight'
    check (assessment_model in ('equal_weight', 'credit_weighted', 'narrative_milestone'));

alter table "Subject" add column credit_weight integer not null default 1;

alter table "Assessment" add column weight numeric not null default 0 check (weight >= 0 and weight <= 100);

-- Option 3 only: narrative/milestone-based assessment (Doc 27 Section 4).
create table "MilestoneScale" (
  scale_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  levels jsonb not null,
  unique (school_id)
);

create table "MilestoneAssessment" (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  subject_id uuid not null references "Subject" (subject_id) on delete cascade,
  term_id uuid not null references "Term" (term_id) on delete cascade,
  milestone_level text not null,
  narrative_note text,
  entered_by uuid not null references "Teacher" (teacher_id) on delete restrict,
  entered_at timestamptz not null default now(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  unique (enrollment_id, subject_id, term_id)
);

create index idx_milestoneassessment_enrollment_id on "MilestoneAssessment" (enrollment_id);

-- Shared lifecycle, all three models (Doc 27 Section 5).
create table "GradeScale" (
  scale_id uuid primary key default gen_random_uuid(),
  school_id uuid not null references "School" (school_id) on delete cascade,
  bands jsonb not null,
  unique (school_id)
);

create table "TermResult" (
  -- Option 1/2 only.
  result_id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  term_id uuid not null references "Term" (term_id) on delete cascade,
  subject_id uuid not null references "Subject" (subject_id) on delete cascade,
  raw_score numeric not null,
  credit_weight_snapshot integer not null,
  weighted_contribution numeric not null,
  grade text,
  status text not null default 'draft' check (status in ('draft', 'finalized', 'published')),
  computed_at timestamptz,
  school_id uuid not null references "School" (school_id) on delete cascade,
  unique (enrollment_id, term_id, subject_id)
);

create index idx_termresult_enrollment_term on "TermResult" (enrollment_id, term_id);

create table "TermReportCard" (
  report_id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  term_id uuid not null references "Term" (term_id) on delete cascade,
  overall_score numeric,
  overall_grade text,
  class_position integer,
  overall_summary text,
  attendance_summary jsonb,
  teacher_remark text,
  status text not null default 'draft' check (status in ('draft', 'finalized', 'published')),
  finalized_at timestamptz,
  published_at timestamptz,
  school_id uuid not null references "School" (school_id) on delete cascade,
  unique (enrollment_id, term_id)
);

create index idx_termreportcard_enrollment_term on "TermReportCard" (enrollment_id, term_id);

-- RLS ---------------------------------------------------------------------

alter table "MilestoneScale" enable row level security;

create policy "milestonescale_all_admin" on "MilestoneScale"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "milestonescale_all_platform_admin" on "MilestoneScale"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "MilestoneAssessment" enable row level security;

-- Doc 27 Section 6 treats MilestoneAssessment as the narrative-model
-- equivalent of Score, not of DailyNote -- same teacher scope (own
-- assigned class/subject, not just self-entered rows) as
-- score_all_teacher_assigned (060_academic_activity.sql).
create policy "milestoneassessment_all_teacher_assigned" on "MilestoneAssessment"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'teacher'
    and exists (
      select 1 from "ClassMembership" cm
      join "TeacherClassAssignment" tca on tca.class_id = cm.class_id and tca.subject_id = "MilestoneAssessment".subject_id
      where cm.enrollment_id = "MilestoneAssessment".enrollment_id and tca.teacher_id = auth_teacher_id()
    )
  )
  with check (
    entered_by = auth_teacher_id()
    and exists (
      select 1 from "ClassMembership" cm
      join "TeacherClassAssignment" tca on tca.class_id = cm.class_id and tca.subject_id = "MilestoneAssessment".subject_id
      where cm.enrollment_id = "MilestoneAssessment".enrollment_id and tca.teacher_id = auth_teacher_id()
    )
  );

create policy "milestoneassessment_select_admin" on "MilestoneAssessment"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "milestoneassessment_all_platform_admin" on "MilestoneAssessment"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "GradeScale" enable row level security;

create policy "gradescale_all_admin" on "GradeScale"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "gradescale_all_platform_admin" on "GradeScale"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- TermResult/TermReportCard: no insert/update policy for admin on either
-- table, by design -- Doc 27 Section 6: "Admin cannot hand-edit a computed
-- grade, score, or class position directly -- only reopen the underlying
-- input and let it recompute." All writes go through the SECURITY DEFINER
-- functions below; admin only gets SELECT here.
alter table "TermResult" enable row level security;

create policy "termresult_select_admin" on "TermResult"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "termresult_all_platform_admin" on "TermResult"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "TermReportCard" enable row level security;

create policy "termreportcard_select_admin" on "TermReportCard"
  as permissive for select to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id());

-- Doc 27 Section 6: "Family: views TermReportCard only once status =
-- 'published'" -- drafts/finalized-but-unpublished are never visible to
-- parents, matching the existing "drafts never shown" rule for assignments.
create policy "termreportcard_select_family_published" on "TermReportCard"
  as permissive for select to authenticated
  using (
    status = 'published'
    and exists (
      select 1 from "SchoolEnrollment" se
      join "FamilyStudentRelationship" fsr on fsr.platform_student_id = se.platform_student_id
      where se.enrollment_id = "TermReportCard".enrollment_id and fsr.membership_id = auth_membership_id()
    )
  );

create policy "termreportcard_all_platform_admin" on "TermReportCard"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- Functions -----------------------------------------------------------------

create or replace function lookup_grade(p_school_id uuid, p_score numeric)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_bands jsonb;
  v_band jsonb;
begin
  select bands into v_bands from "GradeScale" where school_id = p_school_id;
  if v_bands is null or p_score is null then
    return null;
  end if;

  for v_band in select * from jsonb_array_elements(v_bands)
  loop
    if p_score >= (v_band ->> 'min')::numeric and p_score <= (v_band ->> 'max')::numeric then
      return v_band ->> 'grade';
    end if;
  end loop;

  return null;
end;
$$;

-- Doc 27 Section 5, step 2 (Option 1/2). Computes one TermResult row per
-- (enrollment, subject) for every student currently in the class, raw_score
-- being the assessment-weighted sum of that student's Score rows for the
-- subject's assessments this term. Blocks the ENTIRE call -- not just the
-- offending subject -- if any subject's assessment weights don't sum to
-- 100, per Doc 27's "blocks computation if not" wording. A missing Score
-- for a given assessment simply doesn't contribute (not treated as zero);
-- Doc 27 doesn't specify absence handling, and silently zeroing an absent
-- student's score would be a bigger, unasked-for behavioral decision.
--
-- Re-running this after a subject has been finalized/published does not
-- silently overwrite it (the ON CONFLICT...WHERE guard below) -- use
-- admin_reopen_term_result first if a correction is needed post-finalize.
create or replace function admin_compute_term_results(p_class_id uuid, p_term_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_assessment_model text;
  v_subject record;
  v_weight_sum numeric;
  v_enrollment record;
  v_raw_score numeric;
  v_credit_weight integer;
  v_grade text;
  v_count int := 0;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can compute term results';
  end if;
  if not exists (select 1 from "Class" where class_id = p_class_id and school_id = v_school_id) then
    raise exception 'class not found';
  end if;

  select assessment_model into v_assessment_model from "School" where school_id = v_school_id;
  if v_assessment_model = 'narrative_milestone' then
    raise exception 'this school uses narrative/milestone assessment -- use admin_compile_narrative_reports instead';
  end if;

  for v_subject in
    select distinct subject_id from "Assessment" where class_id = p_class_id and term_id = p_term_id
  loop
    select coalesce(sum(weight), 0) into v_weight_sum
    from "Assessment"
    where class_id = p_class_id and term_id = p_term_id and subject_id = v_subject.subject_id;

    if v_weight_sum <> 100 then
      raise exception 'assessment weights for subject % sum to % (must be 100) -- fix weights before computing', v_subject.subject_id, v_weight_sum;
    end if;
  end loop;

  for v_enrollment in
    select cm.enrollment_id from "ClassMembership" cm where cm.class_id = p_class_id and cm.end_date is null
  loop
    for v_subject in
      select distinct subject_id from "Assessment" where class_id = p_class_id and term_id = p_term_id
    loop
      select coalesce(sum(s.value * a.weight / 100.0), 0) into v_raw_score
      from "Score" s
      join "Assessment" a on a.assessment_id = s.assessment_id
      where a.class_id = p_class_id and a.term_id = p_term_id and a.subject_id = v_subject.subject_id
        and s.enrollment_id = v_enrollment.enrollment_id;

      if v_assessment_model = 'credit_weighted' then
        select credit_weight into v_credit_weight from "Subject" where subject_id = v_subject.subject_id;
      else
        v_credit_weight := 1;
      end if;

      v_grade := lookup_grade(v_school_id, v_raw_score);

      insert into "TermResult" (
        enrollment_id, term_id, subject_id, raw_score, credit_weight_snapshot,
        weighted_contribution, grade, status, computed_at, school_id
      )
      values (
        v_enrollment.enrollment_id, p_term_id, v_subject.subject_id, v_raw_score, v_credit_weight,
        v_raw_score * v_credit_weight, v_grade, 'draft', now(), v_school_id
      )
      on conflict (enrollment_id, term_id, subject_id)
      do update set
        raw_score = excluded.raw_score,
        credit_weight_snapshot = excluded.credit_weight_snapshot,
        weighted_contribution = excluded.weighted_contribution,
        grade = excluded.grade,
        status = 'draft',
        computed_at = excluded.computed_at
      where "TermResult".status = 'draft';

      v_count := v_count + 1;
    end loop;
  end loop;

  return jsonb_build_object('rows_computed', v_count);
end;
$$;

revoke all on function admin_compute_term_results(uuid, uuid) from public;
grant execute on function admin_compute_term_results(uuid, uuid) to authenticated;

-- Doc 27 Section 4/5, step 2 (Option 3). No formula -- narrative entries
-- are compiled into TermReportCard.overall_summary as plain text, one line
-- per developmental area (Subject, reused as the "area" label per Doc 27
-- Section 4's note). A student with no MilestoneAssessment rows for the
-- term is skipped, not written with an empty summary.
create or replace function admin_compile_narrative_reports(p_class_id uuid, p_term_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_assessment_model text;
  v_enrollment record;
  v_summary text;
  v_count int := 0;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can compile narrative reports';
  end if;
  if not exists (select 1 from "Class" where class_id = p_class_id and school_id = v_school_id) then
    raise exception 'class not found';
  end if;

  select assessment_model into v_assessment_model from "School" where school_id = v_school_id;
  if v_assessment_model <> 'narrative_milestone' then
    raise exception 'this school does not use narrative/milestone assessment -- use admin_compute_term_results instead';
  end if;

  for v_enrollment in
    select cm.enrollment_id from "ClassMembership" cm where cm.class_id = p_class_id and cm.end_date is null
  loop
    select string_agg(
      format('%s: %s%s', sub.name, ma.milestone_level, case when ma.narrative_note is not null then ' -- ' || ma.narrative_note else '' end),
      e'\n' order by sub.name
    )
    into v_summary
    from "MilestoneAssessment" ma
    join "Subject" sub on sub.subject_id = ma.subject_id
    where ma.enrollment_id = v_enrollment.enrollment_id and ma.term_id = p_term_id;

    if v_summary is null then
      continue;
    end if;

    insert into "TermReportCard" (enrollment_id, term_id, overall_summary, status, school_id)
    values (v_enrollment.enrollment_id, p_term_id, v_summary, 'draft', v_school_id)
    on conflict (enrollment_id, term_id)
    do update set overall_summary = excluded.overall_summary
    where "TermReportCard".status = 'draft';

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('reports_compiled', v_count);
end;
$$;

revoke all on function admin_compile_narrative_reports(uuid, uuid) from public;
grant execute on function admin_compile_narrative_reports(uuid, uuid) to authenticated;

-- Doc 27 Section 5, step 4. Option 1/2: locks draft TermResult rows, then
-- derives and locks the aggregate TermReportCard (overall_score per the
-- school's locked assessment_model formula, overall_grade via
-- lookup_grade, class_position via RANK() among this same class+term
-- cohort -- "class position only computed for Option 1/2, never Option
-- 3," Doc 27 Section 5). Option 3: no derivation, just locks whatever
-- admin_compile_narrative_reports already drafted.
create or replace function admin_finalize_class_term(p_class_id uuid, p_term_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_assessment_model text;
  v_count int := 0;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can finalize term results';
  end if;
  if not exists (select 1 from "Class" where class_id = p_class_id and school_id = v_school_id) then
    raise exception 'class not found';
  end if;

  select assessment_model into v_assessment_model from "School" where school_id = v_school_id;

  if v_assessment_model = 'narrative_milestone' then
    update "TermReportCard"
    set status = 'finalized', finalized_at = now()
    where term_id = p_term_id
      and status = 'draft'
      and enrollment_id in (select enrollment_id from "ClassMembership" where class_id = p_class_id and end_date is null);
    get diagnostics v_count = row_count;
    return jsonb_build_object('reports_finalized', v_count);
  end if;

  update "TermResult"
  set status = 'finalized'
  where term_id = p_term_id
    and status = 'draft'
    and enrollment_id in (select enrollment_id from "ClassMembership" where class_id = p_class_id and end_date is null);

  with aggregated as (
    select
      tr.enrollment_id,
      case when v_assessment_model = 'credit_weighted'
        then sum(tr.weighted_contribution) / nullif(sum(tr.credit_weight_snapshot), 0)
        else avg(tr.raw_score)
      end as overall_score
    from "TermResult" tr
    where tr.term_id = p_term_id and tr.status = 'finalized'
      and tr.enrollment_id in (select enrollment_id from "ClassMembership" where class_id = p_class_id and end_date is null)
    group by tr.enrollment_id
  ),
  ranked as (
    select enrollment_id, overall_score,
      rank() over (order by overall_score desc) as class_position
    from aggregated
  )
  insert into "TermReportCard" (enrollment_id, term_id, overall_score, overall_grade, class_position, status, finalized_at, school_id)
  select enrollment_id, p_term_id, overall_score, lookup_grade(v_school_id, overall_score), class_position, 'finalized', now(), v_school_id
  from ranked
  on conflict (enrollment_id, term_id)
  do update set
    overall_score = excluded.overall_score,
    overall_grade = excluded.overall_grade,
    class_position = excluded.class_position,
    status = 'finalized',
    finalized_at = excluded.finalized_at
  where "TermReportCard".status = 'draft';

  get diagnostics v_count = row_count;
  return jsonb_build_object('reports_finalized', v_count);
end;
$$;

revoke all on function admin_finalize_class_term(uuid, uuid) from public;
grant execute on function admin_finalize_class_term(uuid, uuid) to authenticated;

-- Doc 27 Section 5, step 5. Generic across all three models -- only a
-- status flip, no model-specific logic.
create or replace function admin_publish_class_term(p_class_id uuid, p_term_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_count int;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can publish term reports';
  end if;
  if not exists (select 1 from "Class" where class_id = p_class_id and school_id = v_school_id) then
    raise exception 'class not found';
  end if;

  update "TermReportCard"
  set status = 'published', published_at = now()
  where term_id = p_term_id
    and status = 'finalized'
    and enrollment_id in (select enrollment_id from "ClassMembership" where class_id = p_class_id and end_date is null);

  get diagnostics v_count = row_count;
  return jsonb_build_object('reports_published', v_count);
end;
$$;

revoke all on function admin_publish_class_term(uuid, uuid) from public;
grant execute on function admin_publish_class_term(uuid, uuid) to authenticated;

-- Doc 27 Section 5, step 3 / Section 6: "can reopen a specific underlying
-- score/note for teacher correction (audit-logged); reopening reverts the
-- affected TermResult/report back to draft." Option 1/2 path: reopening one
-- subject's TermResult also reverts its parent TermReportCard to draft,
-- since the aggregate is now stale and must be re-finalized once the
-- teacher's correction is recomputed.
create or replace function admin_reopen_term_result(p_term_result_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_row "TermResult"%rowtype;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can reopen a term result';
  end if;

  select * into v_row from "TermResult" where result_id = p_term_result_id and school_id = v_school_id;
  if v_row.result_id is null then
    raise exception 'term result not found';
  end if;

  update "TermResult" set status = 'draft' where result_id = p_term_result_id;
  update "TermReportCard" set status = 'draft', finalized_at = null, published_at = null
  where enrollment_id = v_row.enrollment_id and term_id = v_row.term_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id, auth_admin_id(), 'admin', 'term_result_reopened', 'TermResult', p_term_result_id::text,
    jsonb_build_object('subject_id', v_row.subject_id, 'enrollment_id', v_row.enrollment_id, 'term_id', v_row.term_id)
  );
end;
$$;

revoke all on function admin_reopen_term_result(uuid) from public;
grant execute on function admin_reopen_term_result(uuid) to authenticated;

-- Option 3 path: there is no TermResult layer for narrative assessment, so
-- "reopening a note" means directly reverting the TermReportCard itself
-- (the admin would then ask the teacher to correct the underlying
-- MilestoneAssessment row and re-run admin_compile_narrative_reports).
create or replace function admin_reopen_term_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_row "TermReportCard"%rowtype;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can reopen a term report';
  end if;

  select * into v_row from "TermReportCard" where report_id = p_report_id and school_id = v_school_id;
  if v_row.report_id is null then
    raise exception 'term report not found';
  end if;

  update "TermReportCard" set status = 'draft', finalized_at = null, published_at = null where report_id = p_report_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id, auth_admin_id(), 'admin', 'term_report_reopened', 'TermReportCard', p_report_id::text,
    jsonb_build_object('enrollment_id', v_row.enrollment_id, 'term_id', v_row.term_id)
  );
end;
$$;

revoke all on function admin_reopen_term_report(uuid) from public;
grant execute on function admin_reopen_term_report(uuid) to authenticated;
