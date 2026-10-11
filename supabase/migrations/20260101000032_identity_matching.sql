-- Doc 23 Section 2: Student Identity Matching & Duplicate Resolution.
-- Milestone 0 exit criteria (a) requires this workflow to exist and be
-- demonstrated distinguishing a new student from a HIGH-confidence match
-- (Doc 23 Section 9) -- see tests/identity-matching.test.ts.
--
-- 030_student_identity.sql already commits PlatformStudent to having no
-- client-facing INSERT policy at all -- every write goes through
-- resolve_or_create_platform_student(), a SECURITY DEFINER function, so it
-- can search match candidates across ALL schools (duplicate detection is
-- necessarily platform-wide) without exposing other schools' data through
-- RLS-scoped client queries. That function didn't exist yet; this migration
-- creates it.
create extension if not exists pg_trgm;

-- Read-only candidate search. Returns ONLY minimal distinguishing fields
-- (name, dob) -- never full academic/enrollment history -- per Doc 23
-- Section 2's privacy requirement for the admin resolution screen.
create or replace function find_platform_student_candidates(
  p_name text,
  p_dob date,
  p_guardian_contacts text[] default '{}'
)
returns table (platform_student_id text, name text, dob date, confidence text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can search student identity matches';
  end if;

  return query
  select
    ps.platform_student_id,
    ps.name,
    ps.dob,
    case
      when ps.dob = p_dob
        and similarity(ps.name, p_name) > 0.6
        and exists (
          select 1
          from "FamilyStudentRelationship" fsr
          join "Guardian" g on g.membership_id = fsr.membership_id
          where fsr.platform_student_id = ps.platform_student_id
            and g.contact_info = any(p_guardian_contacts)
        )
        then 'HIGH'
      when ps.dob = p_dob and similarity(ps.name, p_name) > 0.6 then 'MEDIUM'
      else 'LOW'
    end as confidence
  from "PlatformStudent" ps
  where ps.dob = p_dob and similarity(ps.name, p_name) > 0.3;
end;
$$;

revoke all on function find_platform_student_candidates(text, date, text[]) from public;
grant execute on function find_platform_student_candidates(text, date, text[]) to authenticated;

-- The only way to create a PlatformStudent row or attach a new
-- SchoolEnrollment to an existing one via identity confirmation.
-- p_decision: 'new' creates a fresh identity; 'confirm_match' reuses
-- p_matched_platform_student_id (a new platform_student_id is never
-- generated for a confirmed match, per Doc 23 Section 2). Every call is
-- logged to AuditLog either way.
create or replace function resolve_or_create_platform_student(
  p_name text,
  p_dob date,
  p_decision text,
  p_matched_platform_student_id text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_platform_student_id text;
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can resolve student identity';
  end if;

  if p_decision = 'confirm_match' then
    if p_matched_platform_student_id is null then
      raise exception 'p_matched_platform_student_id is required when p_decision = ''confirm_match''';
    end if;
    select platform_student_id into v_platform_student_id
    from "PlatformStudent"
    where platform_student_id = p_matched_platform_student_id;
    if v_platform_student_id is null then
      raise exception 'no PlatformStudent with id %', p_matched_platform_student_id;
    end if;
  elsif p_decision = 'new' then
    insert into "PlatformStudent" (name, dob)
    values (p_name, p_dob)
    returning platform_student_id into v_platform_student_id;
  else
    raise exception 'p_decision must be ''new'' or ''confirm_match'', got %', p_decision;
  end if;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    auth_school_id(),
    auth_admin_id(),
    'admin',
    'identity_resolution_' || p_decision,
    'PlatformStudent',
    v_platform_student_id,
    jsonb_build_object('name', p_name, 'dob', p_dob)
  );

  return v_platform_student_id;
end;
$$;

revoke all on function resolve_or_create_platform_student(text, date, text, text) from public;
grant execute on function resolve_or_create_platform_student(text, date, text, text) to authenticated;
