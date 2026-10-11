-- Doc 10 Section 7 (Notifications & Daily Notes). Notification.family_id is
-- renamed to membership_id, following Doc 23 Section 1's Family ->
-- Person/FamilyMembership split.
--
-- DailyNote is documented as immutable ("no update/delete at application
-- level", Doc 8) -- enforced here at the DB level too (not just app-layer),
-- consistent with this project's general preference for DB-enforced
-- guarantees over application-only ones (Doc 3's RLS rationale).

create table "Notification" (
  notification_id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references "FamilyMembership" (membership_id) on delete cascade,
  source_type text not null check (source_type in ('system', 'admin', 'teacher')),
  category text not null check (category in ('assignment', 'attendance', 'fee', 'announcement', 'daily_note')),
  related_entity_id uuid,
  message_text text not null,
  read_status boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notification_membership_id on "Notification" (membership_id, read_status);

create table "DailyNote" (
  note_id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references "SchoolEnrollment" (enrollment_id) on delete cascade,
  teacher_id uuid not null references "Teacher" (teacher_id) on delete restrict,
  category text not null check (category in ('health', 'behavior', 'academic', 'general')),
  note_text text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_dailynote_enrollment_id on "DailyNote" (enrollment_id);

create or replace function forbid_dailynote_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'DailyNote rows are immutable -- corrections must be a new note, not an edit (Doc 8)';
end;
$$;

create trigger dailynote_immutable
  before update or delete on "DailyNote"
  for each row
  execute function forbid_dailynote_mutation();
