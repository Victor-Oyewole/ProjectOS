// Seeds (idempotently) a small set of permanent "QA Fixture" tenants used by
// tests/tenant-isolation.test.ts. These run against the live linked Supabase
// project (a deliberate choice -- see conversation/PR notes), so the fixtures
// are designed to be created ONCE and reused forever rather than torn down:
// "DailyNote" rows are immutable at the DB level (forbid_dailynote_mutation
// trigger, migration 008), so a fixture note can never be deleted again once
// it exists -- recreate-and-destroy-per-run isn't an option for this schema.
// Every fixture row/user is named/emailed with a "QA Fixture" / ".invalid"
// marker so it's unmistakably test data, never confused with a real school.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const FIXTURE_PASSWORD = "Qa-Fixture-Pw-1!";
const EMAIL_DOMAIN = "schoolos-test.invalid";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set -- tests/setup.ts should have loaded it from .env.local`,
    );
  }
  return value;
}

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureRow<T extends Record<string, unknown>>(
  admin: SupabaseClient,
  table: string,
  match: Record<string, unknown>,
  insert: Record<string, unknown>,
): Promise<T> {
  const { data: existing, error: selectError } = await admin
    .from(table)
    .select("*")
    .match(match)
    .maybeSingle();
  if (selectError) {
    throw new Error(`select ${table} (${JSON.stringify(match)}) failed: ${selectError.message}`);
  }
  if (existing) return existing as T;

  const { data: created, error: insertError } = await admin
    .from(table)
    .insert(insert)
    .select("*")
    .single();
  if (insertError) {
    throw new Error(`insert ${table} (${JSON.stringify(insert)}) failed: ${insertError.message}`);
  }
  return created as T;
}

// Returns the auth user's id WITHOUT keeping that session -- the row that
// gives this user their JWT claims (SchoolAdmin/Teacher/Person/PlatformAdmin)
// may not exist yet at this point, so any session minted here would come
// back with no app_role claim. Callers must create that row first, then call
// freshSignIn() separately to mint the session actually handed to tests.
async function ensureAuthUserId(admin: SupabaseClient, email: string): Promise<string> {
  const probe = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await probe.auth.signInWithPassword({ email, password: FIXTURE_PASSWORD });
  if (!error && data.user) return data.user.id;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: FIXTURE_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`createUser ${email} failed: ${createError?.message}`);
  }
  return created.user.id;
}

async function freshSignIn(email: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password: FIXTURE_PASSWORD });
  if (error || !data.user) {
    throw new Error(`signIn ${email} failed: ${error?.message}`);
  }
  return client;
}

interface Row {
  [key: string]: any;
}

export interface SchoolFixture {
  label: string;
  schoolId: string;
  adminId: string;
  adminClient: SupabaseClient;
  teacherId: string;
  teacherClient: SupabaseClient;
  personId: string;
  membershipId: string;
  familyClient: SupabaseClient;
  classId: string;
  subjectId: string;
  sessionId: string;
  termId: string;
  platformStudentId: string;
  enrollmentId: string;
  assignmentId: string;
  attachmentId: string;
  attendanceId: string;
  assessmentId: string;
  scoreId: string;
  feeRecordId: string;
  notificationId: string;
  dailyNoteId: string;
  jobId: string;
  jobRecipientStatusId: string;
  auditLogId: string;
  subscriptionId: string;
  teacherClassAssignmentId: string;
  guardianId: string;
  familyStudentRelationshipId: string;
  classMembershipId: string;
  studentAssignmentStatusId: string;
}

async function buildSchool(admin: SupabaseClient, label: "A" | "B"): Promise<SchoolFixture> {
  const school: Row = await ensureRow(
    admin,
    "School",
    { name: `QA Fixture School ${label}` },
    { name: `QA Fixture School ${label}`, country: "Nigeria" },
  );
  const schoolId = school.school_id;

  const subscription: Row = await ensureRow(
    admin,
    "Subscription",
    { school_id: schoolId },
    {
      school_id: schoolId,
      tier: "tier_1",
      status: "Trialing",
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    },
  );

  const adminEmail = `qa-admin-${label.toLowerCase()}@${EMAIL_DOMAIN}`;
  const adminUserId = await ensureAuthUserId(admin, adminEmail);
  const schoolAdmin: Row = await ensureRow(
    admin,
    "SchoolAdmin",
    { auth_user_id: adminUserId },
    { school_id: schoolId, name: `QA Fixture Admin ${label}`, auth_user_id: adminUserId, activation_status: "Active" },
  );
  const adminClientInstance = await freshSignIn(adminEmail);

  const teacherEmail = `qa-teacher-${label.toLowerCase()}@${EMAIL_DOMAIN}`;
  const teacherUserId = await ensureAuthUserId(admin, teacherEmail);
  const teacher: Row = await ensureRow(
    admin,
    "Teacher",
    { auth_user_id: teacherUserId },
    { school_id: schoolId, name: `QA Fixture Teacher ${label}`, auth_user_id: teacherUserId, activation_status: "Active" },
  );
  const teacherClientInstance = await freshSignIn(teacherEmail);

  const familyEmail = `qa-family-${label.toLowerCase()}@${EMAIL_DOMAIN}`;
  const personUserId = await ensureAuthUserId(admin, familyEmail);
  const person: Row = await ensureRow(
    admin,
    "Person",
    { auth_user_id: personUserId },
    { name: `QA Fixture Guardian ${label}`, auth_user_id: personUserId, activation_status: "Active" },
  );
  const familyMembership: Row = await ensureRow(
    admin,
    "FamilyMembership",
    { person_id: person.person_id, school_id: schoolId },
    { person_id: person.person_id, school_id: schoolId, status: "Active" },
  );
  const guardian: Row = await ensureRow(
    admin,
    "Guardian",
    { membership_id: familyMembership.membership_id },
    { membership_id: familyMembership.membership_id, name: `QA Fixture Guardian ${label}`, relationship: "Mother" },
  );
  const familyClientInstance = await freshSignIn(familyEmail);

  const session: Row = await ensureRow(
    admin,
    "AcademicSession",
    { school_id: schoolId, name: `QA Fixture Session ${label}` },
    { school_id: schoolId, name: `QA Fixture Session ${label}`, start_date: "2026-01-01", end_date: "2026-12-31" },
  );
  const term: Row = await ensureRow(
    admin,
    "Term",
    { session_id: session.session_id, name: `QA Fixture Term ${label}` },
    { session_id: session.session_id, name: `QA Fixture Term ${label}`, start_date: "2026-01-01", end_date: "2026-04-30" },
  );
  const klass: Row = await ensureRow(
    admin,
    "Class",
    { school_id: schoolId, name: `QA Fixture Class ${label}` },
    { school_id: schoolId, name: `QA Fixture Class ${label}` },
  );
  const subject: Row = await ensureRow(
    admin,
    "Subject",
    { school_id: schoolId, name: `QA Fixture Subject ${label}` },
    { school_id: schoolId, name: `QA Fixture Subject ${label}` },
  );
  const teacherClassAssignment: Row = await ensureRow(
    admin,
    "TeacherClassAssignment",
    { teacher_id: teacher.teacher_id, class_id: klass.class_id, subject_id: subject.subject_id },
    { teacher_id: teacher.teacher_id, class_id: klass.class_id, subject_id: subject.subject_id, session_id: session.session_id },
  );

  const platformStudent: Row = await ensureRow(
    admin,
    "PlatformStudent",
    { name: `QA Fixture Student ${label}` },
    { name: `QA Fixture Student ${label}`, dob: "2015-06-01" },
  );
  const enrollment: Row = await ensureRow(
    admin,
    "SchoolEnrollment",
    { platform_student_id: platformStudent.platform_student_id, school_id: schoolId },
    {
      platform_student_id: platformStudent.platform_student_id,
      school_id: schoolId,
      start_date: "2026-01-01",
      status: "Active",
    },
  );
  const classMembership: Row = await ensureRow(
    admin,
    "ClassMembership",
    { enrollment_id: enrollment.enrollment_id, class_id: klass.class_id },
    {
      enrollment_id: enrollment.enrollment_id,
      class_id: klass.class_id,
      academic_session_id: session.session_id,
      start_date: "2026-01-01",
    },
  );
  const familyStudentRelationship: Row = await ensureRow(
    admin,
    "FamilyStudentRelationship",
    { membership_id: familyMembership.membership_id, platform_student_id: platformStudent.platform_student_id },
    {
      membership_id: familyMembership.membership_id,
      platform_student_id: platformStudent.platform_student_id,
      relationship_type: "parent",
    },
  );

  const feeRecord: Row = await ensureRow(
    admin,
    "FeeRecord",
    { enrollment_id: enrollment.enrollment_id, term_id: term.term_id },
    { enrollment_id: enrollment.enrollment_id, term_id: term.term_id, amount_expected: 1000, amount_paid: 0 },
  );

  const assignment: Row = await ensureRow(
    admin,
    "Assignment",
    { teacher_id: teacher.teacher_id, class_id: klass.class_id, subject_id: subject.subject_id, title: `QA Fixture Assignment ${label}` },
    {
      school_id: schoolId,
      teacher_id: teacher.teacher_id,
      class_id: klass.class_id,
      subject_id: subject.subject_id,
      title: `QA Fixture Assignment ${label}`,
      available_at: new Date(Date.now() - 86_400_000).toISOString(),
      status: "Published",
    },
  );
  const attachment: Row = await ensureRow(
    admin,
    "AssignmentAttachment",
    { assignment_id: assignment.assignment_id },
    {
      assignment_id: assignment.assignment_id,
      school_id: schoolId,
      file_type: "pdf",
      storage_path: `qa-fixtures/${label}/dummy.pdf`,
      file_size_bytes: 100,
      original_filename: "dummy.pdf",
    },
  );
  const studentAssignmentStatus: Row = await ensureRow(
    admin,
    "StudentAssignmentStatus",
    { assignment_id: assignment.assignment_id, enrollment_id: enrollment.enrollment_id },
    { assignment_id: assignment.assignment_id, enrollment_id: enrollment.enrollment_id },
  );

  const attendance: Row = await ensureRow(
    admin,
    "Attendance",
    { enrollment_id: enrollment.enrollment_id, class_id: klass.class_id, date: "2026-01-15" },
    {
      class_id: klass.class_id,
      teacher_id: teacher.teacher_id,
      school_id: schoolId,
      enrollment_id: enrollment.enrollment_id,
      date: "2026-01-15",
      status: "Present",
    },
  );

  const assessment: Row = await ensureRow(
    admin,
    "Assessment",
    { class_id: klass.class_id, subject_id: subject.subject_id, term_id: term.term_id, name: `QA Fixture Assessment ${label}` },
    {
      class_id: klass.class_id,
      subject_id: subject.subject_id,
      term_id: term.term_id,
      school_id: schoolId,
      name: `QA Fixture Assessment ${label}`,
    },
  );
  const score: Row = await ensureRow(
    admin,
    "Score",
    { assessment_id: assessment.assessment_id, enrollment_id: enrollment.enrollment_id },
    { assessment_id: assessment.assessment_id, enrollment_id: enrollment.enrollment_id, value: 85, entered_by: teacher.teacher_id },
  );

  const notification: Row = await ensureRow(
    admin,
    "Notification",
    { membership_id: familyMembership.membership_id, message_text: `QA fixture notification ${label}` },
    {
      membership_id: familyMembership.membership_id,
      source_type: "system",
      category: "announcement",
      message_text: `QA fixture notification ${label}`,
    },
  );
  const dailyNote: Row = await ensureRow(
    admin,
    "DailyNote",
    { enrollment_id: enrollment.enrollment_id, teacher_id: teacher.teacher_id, note_text: `QA fixture daily note ${label}` },
    {
      enrollment_id: enrollment.enrollment_id,
      teacher_id: teacher.teacher_id,
      category: "general",
      note_text: `QA fixture daily note ${label}`,
      date: "2026-01-15",
    },
  );

  const job: Row = await ensureRow(
    admin,
    "Job",
    { school_id: schoolId, job_type: "notify_assignment_published" },
    { school_id: schoolId, job_type: "notify_assignment_published", payload: {}, status: "pending" },
  );
  const jobRecipientStatus: Row = await ensureRow(
    admin,
    "JobRecipientStatus",
    { job_id: job.job_id, recipient_membership_id: familyMembership.membership_id },
    { job_id: job.job_id, recipient_membership_id: familyMembership.membership_id },
  );

  const auditLog: Row = await ensureRow(
    admin,
    "AuditLog",
    { school_id: schoolId, action_type: "qa_fixture_seed" },
    { school_id: schoolId, actor_role: "system", action_type: "qa_fixture_seed", target_entity: "School", target_id: schoolId },
  );

  return {
    label,
    schoolId,
    adminId: schoolAdmin.admin_id,
    adminClient: adminClientInstance,
    teacherId: teacher.teacher_id,
    teacherClient: teacherClientInstance,
    personId: person.person_id,
    membershipId: familyMembership.membership_id,
    familyClient: familyClientInstance,
    classId: klass.class_id,
    subjectId: subject.subject_id,
    sessionId: session.session_id,
    termId: term.term_id,
    platformStudentId: platformStudent.platform_student_id,
    enrollmentId: enrollment.enrollment_id,
    assignmentId: assignment.assignment_id,
    attachmentId: attachment.attachment_id,
    attendanceId: attendance.attendance_id,
    assessmentId: assessment.assessment_id,
    scoreId: score.score_id,
    feeRecordId: feeRecord.fee_record_id,
    notificationId: notification.notification_id,
    dailyNoteId: dailyNote.note_id,
    jobId: job.job_id,
    jobRecipientStatusId: jobRecipientStatus.id,
    auditLogId: auditLog.log_id,
    subscriptionId: subscription.subscription_id,
    teacherClassAssignmentId: teacherClassAssignment.assignment_id,
    guardianId: guardian.guardian_id,
    familyStudentRelationshipId: familyStudentRelationship.relationship_id,
    classMembershipId: classMembership.membership_id,
    studentAssignmentStatusId: studentAssignmentStatus.id,
  };
}

export interface Fixtures {
  admin: SupabaseClient;
  platformAdminClient: SupabaseClient;
  schoolA: SchoolFixture;
  schoolB: SchoolFixture;
  schoolC: { schoolId: string; adminId: string; adminClient: SupabaseClient };
  transferRequestId: string;
  transferPackageId: string;
}

let cached: Fixtures | null = null;

export async function seedFixtures(): Promise<Fixtures> {
  if (cached) return cached;

  const admin = adminClient();

  const platformAdminEmail = `qa-platform-admin@${EMAIL_DOMAIN}`;
  const platformAdminUserId = await ensureAuthUserId(admin, platformAdminEmail);
  await ensureRow(
    admin,
    "PlatformAdmin",
    { auth_user_id: platformAdminUserId },
    { name: "QA Fixture Platform Admin", auth_user_id: platformAdminUserId },
  );
  const platformAdminClient = await freshSignIn(platformAdminEmail);

  const schoolA = await buildSchool(admin, "A");
  const schoolB = await buildSchool(admin, "B");

  const cSchool: Row = await ensureRow(
    admin,
    "School",
    { name: "QA Fixture School C (uninvolved)" },
    { name: "QA Fixture School C (uninvolved)", country: "Nigeria" },
  );
  const cAdminEmail = `qa-admin-c@${EMAIL_DOMAIN}`;
  const cAdminUserId = await ensureAuthUserId(admin, cAdminEmail);
  const cSchoolAdmin: Row = await ensureRow(
    admin,
    "SchoolAdmin",
    { auth_user_id: cAdminUserId },
    { school_id: cSchool.school_id, name: "QA Fixture Admin C", auth_user_id: cAdminUserId, activation_status: "Active" },
  );
  const cAdminClient = await freshSignIn(cAdminEmail);

  // A transfer request between A (releasing) and B (receiving) -- School C
  // is party to neither side, which is what makes it useful for asserting
  // isolation on a table that two *different* schools are both legitimately
  // allowed to see.
  const transferRequest: Row = await ensureRow(
    admin,
    "TransferRequest",
    { platform_student_id: schoolA.platformStudentId, from_school_id: schoolA.schoolId, to_school_id: schoolB.schoolId },
    {
      platform_student_id: schoolA.platformStudentId,
      from_school_id: schoolA.schoolId,
      to_school_id: schoolB.schoolId,
      requested_by: schoolB.adminId,
      status: "Pending",
    },
  );
  const transferPackage: Row = await ensureRow(
    admin,
    "TransferPackage",
    { request_id: transferRequest.request_id },
    { request_id: transferRequest.request_id, included_records: {} },
  );

  cached = {
    admin,
    platformAdminClient,
    schoolA,
    schoolB,
    schoolC: { schoolId: cSchool.school_id, adminId: cSchoolAdmin.admin_id, adminClient: cAdminClient },
    transferRequestId: transferRequest.request_id,
    transferPackageId: transferPackage.package_id,
  };
  return cached;
}
