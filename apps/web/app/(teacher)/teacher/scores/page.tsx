import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { ScoreGrid } from "./score-grid";

export default async function TeacherScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ pair?: string }>;
}) {
  const { pair } = await searchParams;
  const [classId, subjectId] = (pair ?? "").split(":");
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "teacher" || !claims.teacher_id) {
    redirect("/login");
  }

  const { data: classAssignments } = await supabase
    .from("TeacherClassAssignment")
    .select("class_id, subject_id, Class(name), Subject(name)")
    .eq("teacher_id", claims.teacher_id);

  const classSubjects = (classAssignments ?? [])
    .filter((ca) => ca.Class && ca.Subject)
    .map((ca) => ({
      classId: ca.class_id,
      className: ca.Class!.name,
      subjectId: ca.subject_id,
      subjectName: ca.Subject!.name,
    }));

  const selected = classSubjects.find((cs) => cs.classId === classId && cs.subjectId === subjectId);

  let assessments: { assessmentId: string; name: string }[] = [];
  let students: { enrollmentId: string; name: string }[] = [];
  let scores: { assessmentId: string; enrollmentId: string; value: number }[] = [];

  if (selected) {
    const [{ data: assessmentRows }, { data: memberships }] = await Promise.all([
      supabase.from("Assessment").select("assessment_id, name").eq("class_id", classId!).eq("subject_id", subjectId!),
      supabase
        .from("ClassMembership")
        .select("enrollment_id, SchoolEnrollment(platform_student_id, PlatformStudent(name))")
        .eq("class_id", classId!)
        .is("end_date", null),
    ]);

    assessments = (assessmentRows ?? []).map((a) => ({ assessmentId: a.assessment_id, name: a.name }));
    students = (memberships ?? [])
      .filter((m) => m.SchoolEnrollment?.PlatformStudent)
      .map((m) => ({ enrollmentId: m.enrollment_id, name: m.SchoolEnrollment!.PlatformStudent!.name }));

    if (assessments.length > 0) {
      const { data: scoreRows } = await supabase
        .from("Score")
        .select("assessment_id, enrollment_id, value")
        .in(
          "assessment_id",
          assessments.map((a) => a.assessmentId),
        );
      scores = (scoreRows ?? []).map((s) => ({
        assessmentId: s.assessment_id,
        enrollmentId: s.enrollment_id,
        value: Number(s.value),
      }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Scores</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Assessments (test/exam names, weighting) are set up by your school admin.
        </p>
      </div>

      <form method="get" className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Class / Subject</label>
          <select
            name="pair"
            defaultValue={pair ?? ""}
            className="rounded-md border border-border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {classSubjects.map((cs) => (
              <option key={`${cs.classId}:${cs.subjectId}`} value={`${cs.classId}:${cs.subjectId}`}>
                {cs.className} — {cs.subjectName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md border border-border px-4 py-1.5 text-sm font-medium hover:bg-primary-light"
        >
          Load
        </button>
      </form>

      {selected ? (
        assessments.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            No assessments set up yet for {selected.className} — {selected.subjectName}. Ask your school
            admin to add one.
          </p>
        ) : (
          <ScoreGrid assessments={assessments} students={students} scores={scores} />
        )
      ) : null}
    </div>
  );
}
