-- Doc 16 Milestone 5 (Transfers). TransferRequest/TransferPackage schema
-- and RLS already exist in full from Milestone 0 (migration 009,
-- 080_transfers.sql) -- same situation as every other milestone this
-- session. This migration adds the one piece of computation logic the
-- workflow needs plus one small, necessary addition: a cross-school
-- lookup function, since nothing in this project currently lets a school
-- admin see any school but their own (school_select_own_or_platform_admin,
-- 010_school_and_platform.sql), yet Doc 7's flow requires the NEW school's
-- admin to specify WHICH school to request records from.
--
-- Submitting a request needs no new function -- TransferRequest already
-- has a working admin-insert policy for the requesting (to) school
-- (transferrequest_insert_admin_new_school). Only approve/deny need one,
-- because TransferPackage is deliberately system-generated with no direct
-- admin-insert policy (080_transfers.sql's own comment), and because Doc 7
-- requires an audit trail entry recorded atomically with the decision.
create or replace function search_schools(p_name text)
returns table (school_id uuid, name text)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can search for other schools';
  end if;

  return query
  select s.school_id, s.name
  from "School" s
  where s.school_id <> auth_school_id()
    and similarity(s.name, p_name) > 0.2
  order by similarity(s.name, p_name) desc
  limit 10;
end;
$$;

revoke all on function search_schools(text) from public;
grant execute on function search_schools(text) to authenticated;

-- Doc 13 #7 Screen 3: "On approve: TransferPackage generated, audit trail
-- recorded." Doc 7's "Transferable Academic Record" category list
-- ("completed classes, subjects, term results, exam results, attendance
-- summaries, appropriate teacher comments, report cards, certificates,
-- enrollment history") is intentionally collapsed here to four coarse,
-- admin-selectable categories, consistent with Doc 7's own "V1 relies on
-- admin judgment... rather than a fully configurable field-level transfer
-- policy engine": enrollment_history, attendance_summary, term_results,
-- certificates. "Appropriate teacher comments" is deliberately NOT one of
-- them -- DailyNote already has zero admin visibility, by design, tested
-- and confirmed in the Milestone 0 suite ("admin cannot see DailyNote rows
-- even for their own school") -- an admin can't judge the
-- "appropriateness" of a note they're not allowed to read, so offering it
-- as a release category would be asking for a decision the admin has no
-- way to actually make.
create or replace function admin_approve_transfer_request(
  p_request_id uuid,
  p_included_records jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_row "TransferRequest"%rowtype;
  v_package_id uuid;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can approve a transfer request';
  end if;

  select * into v_row from "TransferRequest" where request_id = p_request_id;
  if v_row.request_id is null then
    raise exception 'transfer request not found';
  end if;
  if v_row.from_school_id <> v_school_id then
    raise exception 'only the releasing school can approve this request';
  end if;
  if v_row.status <> 'Pending' then
    raise exception 'this request has already been resolved';
  end if;

  update "TransferRequest"
  set status = 'Approved', approved_by = auth_admin_id(), resolved_at = now()
  where request_id = p_request_id;

  insert into "TransferPackage" (request_id, included_records)
  values (p_request_id, p_included_records)
  returning package_id into v_package_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id, auth_admin_id(), 'admin', 'transfer_approved', 'TransferRequest', p_request_id::text,
    jsonb_build_object(
      'platform_student_id', v_row.platform_student_id,
      'from_school_id', v_row.from_school_id,
      'to_school_id', v_row.to_school_id,
      'included_records', p_included_records,
      'notes', p_notes
    )
  );

  return v_package_id;
end;
$$;

revoke all on function admin_approve_transfer_request(uuid, jsonb, text) from public;
grant execute on function admin_approve_transfer_request(uuid, jsonb, text) to authenticated;

create or replace function admin_deny_transfer_request(p_request_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid := auth_school_id();
  v_row "TransferRequest"%rowtype;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can deny a transfer request';
  end if;

  select * into v_row from "TransferRequest" where request_id = p_request_id;
  if v_row.request_id is null then
    raise exception 'transfer request not found';
  end if;
  if v_row.from_school_id <> v_school_id then
    raise exception 'only the releasing school can deny this request';
  end if;
  if v_row.status <> 'Pending' then
    raise exception 'this request has already been resolved';
  end if;

  update "TransferRequest"
  set status = 'Denied', approved_by = auth_admin_id(), resolved_at = now()
  where request_id = p_request_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id, auth_admin_id(), 'admin', 'transfer_denied', 'TransferRequest', p_request_id::text,
    jsonb_build_object(
      'platform_student_id', v_row.platform_student_id,
      'from_school_id', v_row.from_school_id,
      'to_school_id', v_row.to_school_id,
      'reason', p_reason
    )
  );
end;
$$;

revoke all on function admin_deny_transfer_request(uuid, text) from public;
grant execute on function admin_deny_transfer_request(uuid, text) to authenticated;
