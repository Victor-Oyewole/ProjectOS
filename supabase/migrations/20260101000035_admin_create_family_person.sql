-- Doc 12 Step 4 (People Setup, Families tab): a school admin manually
-- adding a family creates a Person record on that person's behalf, before
-- they've ever signed in -- auth_user_id stays null until they activate
-- (Step 5, not built yet). 040_people.sql only grants admin SELECT on
-- Person ("person_select_admin_own_school"), never INSERT -- Person is
-- platform-level like PlatformStudent, so an ordinary school-scoped INSERT
-- policy isn't the right fit; it needs the same SECURITY DEFINER bootstrap
-- pattern as resolve_or_create_platform_student (migration 032).
--
-- Returns membership_id, not person_id: the caller's very next step is
-- always "create a FamilyMembership for this Person at my school" (that
-- part IS ordinary admin-insertable, familymembership_all_admin already
-- permits it), so doing it here in the same transaction avoids a second
-- round trip and an orphaned Person if the second insert were ever skipped.
create or replace function admin_create_family_person(
  p_name text,
  p_contact_info text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
  v_membership_id uuid;
  v_school_id uuid := auth_school_id();
begin
  if auth_app_role() <> 'admin' then
    raise exception 'only a school admin can add a family';
  end if;

  insert into "Person" (name, contact_info, activation_status)
  values (p_name, p_contact_info, 'Pending')
  returning person_id into v_person_id;

  insert into "FamilyMembership" (person_id, school_id, status)
  values (v_person_id, v_school_id, 'Active')
  returning membership_id into v_membership_id;

  insert into "AuditLog" (school_id, actor_id, actor_role, action_type, target_entity, target_id, details)
  values (
    v_school_id,
    auth_admin_id(),
    'admin',
    'family_added',
    'Person',
    v_person_id::text,
    jsonb_build_object('name', p_name)
  );

  return v_membership_id;
end;
$$;

revoke all on function admin_create_family_person(text, text) from public;
grant execute on function admin_create_family_person(text, text) to authenticated;
