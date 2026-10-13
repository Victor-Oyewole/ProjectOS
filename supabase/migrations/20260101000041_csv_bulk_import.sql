-- Doc 12 Step 4 "Bulk Import CSV" + Doc 20 Section 6's requirements:
-- "Duplicate detection... flagged as error, not silently skipped,"
-- "Partial success is not allowed silently -- admin sees a full preview
-- and confirms before any records are created," "batch insert in a single
-- transaction per entity type (all rows succeed or the batch fails
-- atomically)," "activation codes generated per created person."
--
-- Doc 20 Section 6 describes this as a background job (Storage upload,
-- async parse/preview/confirm/insert). That execution infrastructure
-- (Edge Functions + pg_cron/Database Webhooks, Doc 23 Section 4) doesn't
-- exist in this project yet and would be a substantial undertaking
-- separate from CSV import itself -- deliberately built synchronously
-- instead (parse/validate/preview/confirm all happen within one Server
-- Action round trip each), matching Doc 3's own reasoning for why
-- synchronous is fine for bounded, admin-initiated, latency-acceptable
-- operations (unlike notification fan-out, which Doc 3 specifically flags
-- as needing async handling for scale reasons that don't apply to a
-- single school's onboarding CSV). Revisit if row counts or Milestone 2's
-- real job infrastructure make this worth changing.
--
-- "All rows succeed or the batch fails atomically" is still honored: each
-- bulk function below is one SECURITY DEFINER call, so it's one Postgres
-- transaction regardless of how many rows it loops over -- an error on
-- any row aborts the whole thing, same guarantee a background job's
-- single transaction would have given, just without the job queue.

-- Shared by both the single-student-add path (people/students/actions.ts)
-- and the new bulk path -- same reuse-not-duplicate logic as the
-- TypeScript version it replaces (an enrollment and class membership
-- already existing for this student at this school is reused, not
-- duplicated; migration 036's partial unique index is the DB-level
-- backstop either way).
create or replace function enroll_student_in_school(
  p_platform_student_id text,
  p_school_id uuid,
  p_class_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment_id uuid;
  v_session_id uuid;
  v_existing_membership uuid;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can enroll a student';
  end if;
  if auth_school_id() <> p_school_id then
    raise exception 'cannot enroll a student at another school';
  end if;

  select enrollment_id into v_enrollment_id
  from "SchoolEnrollment"
  where platform_student_id = p_platform_student_id
    and school_id = p_school_id
    and status = 'Active';

  if v_enrollment_id is null then
    insert into "SchoolEnrollment" (platform_student_id, school_id, start_date, status)
    values (p_platform_student_id, p_school_id, current_date, 'Active')
    returning enrollment_id into v_enrollment_id;
  end if;

  if p_class_id is not null then
    select session_id into v_session_id
    from "AcademicSession"
    where school_id = p_school_id
    order by start_date desc
    limit 1;

    if v_session_id is not null then
      select membership_id into v_existing_membership
      from "ClassMembership"
      where enrollment_id = v_enrollment_id and class_id = p_class_id;

      if v_existing_membership is null then
        insert into "ClassMembership" (enrollment_id, class_id, academic_session_id, start_date)
        values (v_enrollment_id, p_class_id, v_session_id, current_date);
      end if;
    end if;
  end if;

  return v_enrollment_id;
end;
$$;

revoke all on function enroll_student_in_school(text, uuid, uuid) from public;
grant execute on function enroll_student_in_school(text, uuid, uuid) to authenticated;

-- p_rows: [{"name": "...", "staff_id": "...", "contact_info": "..."}, ...]
create or replace function admin_bulk_add_teachers(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row jsonb;
  v_count int := 0;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can bulk-add teachers';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    perform admin_add_teacher(
      v_row ->> 'name',
      v_row ->> 'staff_id',
      v_row ->> 'contact_info'
    );
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('count', v_count);
end;
$$;

revoke all on function admin_bulk_add_teachers(jsonb) from public;
grant execute on function admin_bulk_add_teachers(jsonb) to authenticated;

-- p_rows: [{"guardian_name": "...", "relationship": "...", "contact_info": "..."}, ...]
create or replace function admin_bulk_add_families(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row jsonb;
  v_bootstrap jsonb;
  v_membership_id uuid;
  v_count int := 0;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can bulk-add families';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_bootstrap := admin_create_family_person(v_row ->> 'guardian_name', v_row ->> 'contact_info');
    v_membership_id := (v_bootstrap ->> 'membership_id')::uuid;

    insert into "Guardian" (membership_id, name, relationship, contact_info)
    values (v_membership_id, v_row ->> 'guardian_name', v_row ->> 'relationship', v_row ->> 'contact_info');

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('count', v_count);
end;
$$;

revoke all on function admin_bulk_add_families(jsonb) from public;
grant execute on function admin_bulk_add_families(jsonb) to authenticated;

-- p_rows: [{"name": "...", "dob": "YYYY-MM-DD", "decision": "new"|"confirm_match",
--           "matched_platform_student_id": "..."|null, "class_id": "..."|null}, ...]
-- Doc 12: "Student CSV import maps to Classes if a class column is
-- included." The identity-match DECISION per row is resolved client-side
-- during the preview step (Doc 23 Section 2 -- never silently assumed
-- here), this function just executes the already-made decisions
-- atomically.
create or replace function admin_bulk_add_students(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row jsonb;
  v_school_id uuid := auth_school_id();
  v_platform_student_id text;
  v_count int := 0;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can bulk-add students';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_platform_student_id := resolve_or_create_platform_student(
      v_row ->> 'name',
      (v_row ->> 'dob')::date,
      v_row ->> 'decision',
      v_row ->> 'matched_platform_student_id'
    );

    perform enroll_student_in_school(
      v_platform_student_id,
      v_school_id,
      nullif(v_row ->> 'class_id', '')::uuid
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('count', v_count);
end;
$$;

revoke all on function admin_bulk_add_students(jsonb) from public;
grant execute on function admin_bulk_add_students(jsonb) to authenticated;
