// Milestone 0 exit criteria (b), Doc 23 Sections 4 & 9: demonstrates the
// assignment-write + notification transaction cannot leave an inconsistent
// state under a simulated mid-transaction failure. Exercises the real
// outbox trigger (migration 033: AFTER INSERT on "Assignment" enqueues a
// Job row) via assignment_atomicity_probe, a permanent test-support function
// that raises partway through its own transaction when told to.
import { beforeAll, describe, expect, it } from "vitest";
import { seedFixtures, type Fixtures } from "./fixtures";
import { looksLikeNetworkError, withNetworkRetry } from "./network-retry";

let fx: Fixtures;

beforeAll(async () => {
  fx = await seedFixtures();
});

async function assignmentAndJobExist(title: string, schoolId: string) {
  const { data: assignment } = await withNetworkRetry(() =>
    fx.admin.from("Assignment").select("assignment_id").eq("title", title).eq("school_id", schoolId).maybeSingle(),
  );

  if (!assignment) return { assignmentExists: false, jobExists: false };

  const { data: job } = await withNetworkRetry(() =>
    fx.admin
      .from("Job")
      .select("job_id")
      .eq("related_entity_id", assignment.assignment_id)
      .eq("job_type", "notify_assignment_published")
      .maybeSingle(),
  );

  return { assignmentExists: true, jobExists: Boolean(job) };
}

describe("assignment-write + notification atomicity (outbox pattern)", () => {
  it("a normal publish commits both the Assignment and its Job row together", async () => {
    const title = `QA Atomicity Probe (success) ${Date.now()}`;
    const { data: assignmentId, error } = await withNetworkRetry(() =>
      fx.admin.rpc("assignment_atomicity_probe", {
        p_class_id: fx.schoolA.classId,
        p_subject_id: fx.schoolA.subjectId,
        p_teacher_id: fx.schoolA.teacherId,
        p_school_id: fx.schoolA.schoolId,
        p_title: title,
        p_should_fail: false,
      }),
    );
    expect(error).toBeNull();
    expect(assignmentId).toBeTruthy();

    const { assignmentExists, jobExists } = await assignmentAndJobExist(title, fx.schoolA.schoolId);
    expect(assignmentExists).toBe(true);
    expect(jobExists).toBe(true);
  });

  it("a simulated mid-transaction failure rolls back BOTH the Assignment and its Job row", async () => {
    const title = `QA Atomicity Probe (failure) ${Date.now()}`;
    // withNetworkRetry only retries when the error looks like a transient
    // network blip -- the expected "simulated mid-transaction failure"
    // error from the probe itself is left alone, not retried.
    const { data, error } = await withNetworkRetry(() =>
      fx.admin.rpc("assignment_atomicity_probe", {
        p_class_id: fx.schoolA.classId,
        p_subject_id: fx.schoolA.subjectId,
        p_teacher_id: fx.schoolA.teacherId,
        p_school_id: fx.schoolA.schoolId,
        p_title: title,
        p_should_fail: true,
      }),
    );
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(looksLikeNetworkError(error)).toBe(false);
    expect(error?.message).toContain("simulated mid-transaction failure");

    // Neither row should exist -- not the Assignment the probe inserted
    // before raising, and not the Job the trigger would have enqueued.
    const { assignmentExists, jobExists } = await assignmentAndJobExist(title, fx.schoolA.schoolId);
    expect(assignmentExists).toBe(false);
    expect(jobExists).toBe(false);
  });
});
