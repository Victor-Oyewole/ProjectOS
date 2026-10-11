// Automated tenant-isolation suite required by the Build Pack's Milestone 0
// exit criteria (Doc 16) and Doc 11's testing requirement: "a School A token
// can never read, write, or enumerate School B's rows ... not verified
// manually, and not assumed correct because RLS is 'turned on'."
//
// Runs against the live linked Supabase project using real signed-in users
// (so the custom_access_token_hook's claims are genuinely exercised, not
// faked) against permanent "QA Fixture" tenants -- see tests/fixtures.ts for
// why they're permanent rather than created/torn down per run.
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { seedFixtures, type Fixtures, type SchoolFixture } from "./fixtures";

let fx: Fixtures;

beforeAll(async () => {
  fx = await seedFixtures();
});

async function visibleCount(
  client: SupabaseClient,
  table: string,
  idColumn: string,
  id: string,
): Promise<number> {
  const { data, error } = await client.from(table).select(idColumn).eq(idColumn, id);
  if (error) throw new Error(`${table}.${idColumn} = ${id} query failed: ${error.message}`);
  return data?.length ?? 0;
}

interface AdminVisibleTable {
  table: string;
  idColumn: string;
  idOf: (s: SchoolFixture) => string;
}

// Every school-scoped table where the admin role has a SELECT policy that
// isn't further narrowed below the admin's own school_id (i.e. the bulk of
// the schema). Tables with a narrower or role-specific visibility story
// (PlatformStudent, Person, DailyNote, Job/JobRecipientStatus,
// TransferRequest/TransferPackage) get their own dedicated blocks further
// down instead of being forced into this generic shape.
const ADMIN_VISIBLE_TABLES: AdminVisibleTable[] = [
  { table: "School", idColumn: "school_id", idOf: (s) => s.schoolId },
  { table: "Subscription", idColumn: "subscription_id", idOf: (s) => s.subscriptionId },
  { table: "AcademicSession", idColumn: "session_id", idOf: (s) => s.sessionId },
  { table: "Term", idColumn: "term_id", idOf: (s) => s.termId },
  { table: "Class", idColumn: "class_id", idOf: (s) => s.classId },
  { table: "Subject", idColumn: "subject_id", idOf: (s) => s.subjectId },
  { table: "SchoolAdmin", idColumn: "admin_id", idOf: (s) => s.adminId },
  { table: "Teacher", idColumn: "teacher_id", idOf: (s) => s.teacherId },
  { table: "TeacherClassAssignment", idColumn: "assignment_id", idOf: (s) => s.teacherClassAssignmentId },
  { table: "FamilyMembership", idColumn: "membership_id", idOf: (s) => s.membershipId },
  { table: "Guardian", idColumn: "guardian_id", idOf: (s) => s.guardianId },
  { table: "FamilyStudentRelationship", idColumn: "relationship_id", idOf: (s) => s.familyStudentRelationshipId },
  { table: "SchoolEnrollment", idColumn: "enrollment_id", idOf: (s) => s.enrollmentId },
  { table: "ClassMembership", idColumn: "membership_id", idOf: (s) => s.classMembershipId },
  { table: "Assignment", idColumn: "assignment_id", idOf: (s) => s.assignmentId },
  { table: "AssignmentAttachment", idColumn: "attachment_id", idOf: (s) => s.attachmentId },
  { table: "StudentAssignmentStatus", idColumn: "id", idOf: (s) => s.studentAssignmentStatusId },
  { table: "Attendance", idColumn: "attendance_id", idOf: (s) => s.attendanceId },
  { table: "Assessment", idColumn: "assessment_id", idOf: (s) => s.assessmentId },
  { table: "Score", idColumn: "score_id", idOf: (s) => s.scoreId },
  { table: "FeeRecord", idColumn: "fee_record_id", idOf: (s) => s.feeRecordId },
  { table: "Notification", idColumn: "notification_id", idOf: (s) => s.notificationId },
  { table: "AuditLog", idColumn: "log_id", idOf: (s) => s.auditLogId },
];

describe("tenant isolation: admin read access, every admin-visible table", () => {
  for (const { table, idColumn, idOf } of ADMIN_VISIBLE_TABLES) {
    it(`${table}: School A admin sees own row, not School B's`, async () => {
      expect(await visibleCount(fx.schoolA.adminClient, table, idColumn, idOf(fx.schoolA))).toBeGreaterThanOrEqual(1);
      expect(await visibleCount(fx.schoolA.adminClient, table, idColumn, idOf(fx.schoolB))).toBe(0);
    });

    it(`${table}: School B admin sees own row, not School A's`, async () => {
      expect(await visibleCount(fx.schoolB.adminClient, table, idColumn, idOf(fx.schoolB))).toBeGreaterThanOrEqual(1);
      expect(await visibleCount(fx.schoolB.adminClient, table, idColumn, idOf(fx.schoolA))).toBe(0);
    });
  }
});

describe("tenant isolation: PlatformStudent (mediated via enrollment/family, not school_id)", () => {
  it("admin sees their own enrolled student, not the other school's", async () => {
    expect(await visibleCount(fx.schoolA.adminClient, "PlatformStudent", "platform_student_id", fx.schoolA.platformStudentId)).toBeGreaterThanOrEqual(1);
    expect(await visibleCount(fx.schoolA.adminClient, "PlatformStudent", "platform_student_id", fx.schoolB.platformStudentId)).toBe(0);
  });

  it("family sees their own child, not the other school's child", async () => {
    expect(await visibleCount(fx.schoolA.familyClient, "PlatformStudent", "platform_student_id", fx.schoolA.platformStudentId)).toBeGreaterThanOrEqual(1);
    expect(await visibleCount(fx.schoolA.familyClient, "PlatformStudent", "platform_student_id", fx.schoolB.platformStudentId)).toBe(0);
  });
});

describe("tenant isolation: Person (platform-level, mediated via FamilyMembership)", () => {
  it("admin sees the parent/guardian in their own school, not the other school's", async () => {
    expect(await visibleCount(fx.schoolA.adminClient, "Person", "person_id", fx.schoolA.personId)).toBeGreaterThanOrEqual(1);
    expect(await visibleCount(fx.schoolA.adminClient, "Person", "person_id", fx.schoolB.personId)).toBe(0);
  });
});

describe("tenant isolation: Teacher visibility granted to family role (Doc 6)", () => {
  it("family sees their own school's teacher, not the other school's", async () => {
    expect(await visibleCount(fx.schoolA.familyClient, "Teacher", "teacher_id", fx.schoolA.teacherId)).toBeGreaterThanOrEqual(1);
    expect(await visibleCount(fx.schoolA.familyClient, "Teacher", "teacher_id", fx.schoolB.teacherId)).toBe(0);
  });
});

describe("tenant isolation: DailyNote (no admin visibility at all, per Doc 23 Sec 6)", () => {
  it("admin cannot see DailyNote rows even for their own school", async () => {
    expect(await visibleCount(fx.schoolA.adminClient, "DailyNote", "note_id", fx.schoolA.dailyNoteId)).toBe(0);
  });

  it("teacher sees their own note, not the other school's teacher's note", async () => {
    expect(await visibleCount(fx.schoolA.teacherClient, "DailyNote", "note_id", fx.schoolA.dailyNoteId)).toBeGreaterThanOrEqual(1);
    expect(await visibleCount(fx.schoolA.teacherClient, "DailyNote", "note_id", fx.schoolB.dailyNoteId)).toBe(0);
  });

  it("family sees their own child's note, not the other school's", async () => {
    expect(await visibleCount(fx.schoolA.familyClient, "DailyNote", "note_id", fx.schoolA.dailyNoteId)).toBeGreaterThanOrEqual(1);
    expect(await visibleCount(fx.schoolA.familyClient, "DailyNote", "note_id", fx.schoolB.dailyNoteId)).toBe(0);
  });
});

describe("tenant isolation: Job / JobRecipientStatus (platform_admin only, per 090_jobs.sql)", () => {
  it("no school-level role (admin/teacher/family) can see any Job row", async () => {
    for (const client of [fx.schoolA.adminClient, fx.schoolA.teacherClient, fx.schoolA.familyClient]) {
      expect(await visibleCount(client, "Job", "job_id", fx.schoolA.jobId)).toBe(0);
      expect(await visibleCount(client, "Job", "job_id", fx.schoolB.jobId)).toBe(0);
    }
  });

  it("platform_admin sees Job rows from both schools", async () => {
    expect(await visibleCount(fx.platformAdminClient, "Job", "job_id", fx.schoolA.jobId)).toBeGreaterThanOrEqual(1);
    expect(await visibleCount(fx.platformAdminClient, "Job", "job_id", fx.schoolB.jobId)).toBeGreaterThanOrEqual(1);
  });

  it("no school-level role can see any JobRecipientStatus row", async () => {
    expect(await visibleCount(fx.schoolA.adminClient, "JobRecipientStatus", "id", fx.schoolA.jobRecipientStatusId)).toBe(0);
  });
});

describe("tenant isolation: TransferRequest / TransferPackage (legitimately two-sided)", () => {
  it("both parties (from-school and to-school admins) can see the transfer", async () => {
    expect(await visibleCount(fx.schoolA.adminClient, "TransferRequest", "request_id", fx.transferRequestId)).toBeGreaterThanOrEqual(1);
    expect(await visibleCount(fx.schoolB.adminClient, "TransferRequest", "request_id", fx.transferRequestId)).toBeGreaterThanOrEqual(1);
  });

  it("an uninvolved third school cannot see the transfer or its package", async () => {
    expect(await visibleCount(fx.schoolC.adminClient, "TransferRequest", "request_id", fx.transferRequestId)).toBe(0);
    expect(await visibleCount(fx.schoolC.adminClient, "TransferPackage", "package_id", fx.transferPackageId)).toBe(0);
  });
});

describe("tenant isolation: write-path checks (not just read)", () => {
  it("admin cannot update another school's row (RLS USING clause matches 0 rows, not an error)", async () => {
    const { data, error } = await fx.schoolA.adminClient
      .from("Class")
      .update({ name: "hacked-by-school-a" })
      .eq("class_id", fx.schoolB.classId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);

    const { data: stillB } = await fx.admin.from("Class").select("name").eq("class_id", fx.schoolB.classId).single();
    expect(stillB?.name).toBe("QA Fixture Class B");
  });

  it("admin cannot insert a row impersonating another school's school_id (WITH CHECK rejects it)", async () => {
    const { error } = await fx.schoolA.adminClient.from("Class").insert({
      school_id: fx.schoolB.schoolId,
      name: "qa-impersonation-attempt",
    });
    expect(error).not.toBeNull();
  });

  it("teacher cannot insert Attendance into a class they're not assigned to in another school", async () => {
    const { error } = await fx.schoolA.teacherClient.from("Attendance").insert({
      class_id: fx.schoolB.classId,
      teacher_id: fx.schoolA.teacherId,
      school_id: fx.schoolB.schoolId,
      enrollment_id: fx.schoolB.enrollmentId,
      date: "2026-02-01",
      status: "Present",
    });
    expect(error).not.toBeNull();
  });

  it("admin cannot update another school's FeeRecord (USING clause matches 0 rows)", async () => {
    const { data, error } = await fx.schoolA.adminClient
      .from("FeeRecord")
      .update({ amount_paid: 999 })
      .eq("fee_record_id", fx.schoolB.feeRecordId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("admin cannot insert an AuditLog row spoofing another school's school_id", async () => {
    const { error } = await fx.schoolA.adminClient.from("AuditLog").insert({
      school_id: fx.schoolB.schoolId,
      actor_role: "admin",
      action_type: "qa_spoof_attempt",
      target_entity: "School",
      target_id: fx.schoolB.schoolId,
    });
    expect(error).not.toBeNull();
  });
});
