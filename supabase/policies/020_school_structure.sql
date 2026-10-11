-- AcademicSession, Term, Class, Subject.
-- Admin: full CRUD scoped to own school. Teacher/Family: read-only, scoped
-- to own school (none of this is sensitive -- session/term/class/subject
-- names -- so a flat school-scoped read is sufficient; no further
-- restriction to "assigned classes only" is needed here the way it is for
-- student-identifying data).

alter table "AcademicSession" enable row level security;

create policy "academicsession_all_admin" on "AcademicSession"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "academicsession_select_school_members" on "AcademicSession"
  as permissive for select to authenticated
  using (school_id = auth_school_id());

create policy "academicsession_all_platform_admin" on "AcademicSession"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "Term" enable row level security;

create policy "term_all_admin" on "Term"
  as permissive for all to authenticated
  using (
    auth_app_role() = 'admin'
    and exists (
      select 1 from "AcademicSession" s
      where s.session_id = "Term".session_id and s.school_id = auth_school_id()
    )
  )
  with check (
    exists (
      select 1 from "AcademicSession" s
      where s.session_id = "Term".session_id and s.school_id = auth_school_id()
    )
  );

create policy "term_select_school_members" on "Term"
  as permissive for select to authenticated
  using (
    exists (
      select 1 from "AcademicSession" s
      where s.session_id = "Term".session_id and s.school_id = auth_school_id()
    )
  );

create policy "term_all_platform_admin" on "Term"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "Class" enable row level security;

create policy "class_all_admin" on "Class"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "class_select_school_members" on "Class"
  as permissive for select to authenticated
  using (school_id = auth_school_id());

create policy "class_all_platform_admin" on "Class"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

alter table "Subject" enable row level security;

create policy "subject_all_admin" on "Subject"
  as permissive for all to authenticated
  using (auth_app_role() = 'admin' and school_id = auth_school_id())
  with check (auth_app_role() = 'admin' and school_id = auth_school_id());

create policy "subject_select_school_members" on "Subject"
  as permissive for select to authenticated
  using (school_id = auth_school_id());

create policy "subject_all_platform_admin" on "Subject"
  as permissive for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());
