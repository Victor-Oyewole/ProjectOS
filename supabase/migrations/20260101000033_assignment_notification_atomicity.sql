-- Doc 23 Section 4: "Assignment INSERT and its 'pending notification' record
-- are written in a SINGLE DATABASE TRANSACTION (both succeed or both roll
-- back -- this is the outbox pattern)." Milestone 0 exit criteria (b)
-- requires this demonstrated under a simulated mid-transaction failure (Doc
-- 23 Section 9) -- see tests/assignment-atomicity.test.ts.
--
-- A trigger is the natural fit for "same transaction, no app-layer
-- coordination required": it fires as part of the INSERT statement itself,
-- so if anything later in that transaction fails, the Job row it created
-- rolls back along with the Assignment row -- Postgres's ordinary
-- transactional guarantee, not something the application has to implement.
create or replace function enqueue_assignment_published_job()
returns trigger
language plpgsql
as $$
begin
  insert into "Job" (job_type, school_id, related_entity_id, payload)
  values (
    'notify_assignment_published',
    new.school_id,
    new.assignment_id,
    jsonb_build_object('class_id', new.class_id)
  );
  return new;
end;
$$;

create trigger assignment_enqueue_notification
  after insert on "Assignment"
  for each row
  when (new.status = 'Published')
  execute function enqueue_assignment_published_job();

-- Test-support function, not a throwaway debug artifact -- kept
-- permanently, same as tests/fixtures.ts, as the mechanism
-- tests/assignment-atomicity.test.ts uses to simulate a mid-transaction
-- failure. A single plpgsql function call is one Postgres transaction, so
-- raising after the INSERT (when p_should_fail) rolls back both the
-- Assignment row and the Job row the trigger created -- the thing this
-- migration is supposed to guarantee.
create or replace function assignment_atomicity_probe(
  p_class_id uuid,
  p_subject_id uuid,
  p_teacher_id uuid,
  p_school_id uuid,
  p_title text,
  p_should_fail boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment_id uuid;
begin
  insert into "Assignment" (class_id, subject_id, teacher_id, school_id, title, available_at, status)
  values (p_class_id, p_subject_id, p_teacher_id, p_school_id, p_title, now(), 'Published')
  returning assignment_id into v_assignment_id;

  if p_should_fail then
    raise exception 'assignment_atomicity_probe: simulated mid-transaction failure';
  end if;

  return v_assignment_id;
end;
$$;

revoke all on function assignment_atomicity_probe(uuid, uuid, uuid, uuid, text, boolean) from public;
grant execute on function assignment_atomicity_probe(uuid, uuid, uuid, uuid, text, boolean) to service_role;
