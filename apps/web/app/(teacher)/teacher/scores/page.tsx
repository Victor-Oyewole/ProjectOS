import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { ScoreGrid } from "./score-grid";
import { MilestoneGrid } from "./milestone-grid";
import { Select } from "@schoolos/ui";

export default async function TeacherScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ pair?: string; termId?: string }>;
}) {
  const { pair, termId } = await searchParams;
  const [classId, subjectId] = (pair ?? "").split(":");
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "teacher" || !claims.teacher_id) {
    redirect("/login");
  }

  const [{ data: classAssignments }, { data: school }] = await Promise.all([
    supabase
      .from("TeacherClassAssignment")
      .select("class_id, subject_id, Class(name), Subject(name)")
      .eq("teacher_id", claims.teacher_id),
    supabase.from("School").select("assessment_model").single(),
  ]);

  const isNarrative = school?.assessment_model === "narrative_milestone";

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
  let terms: { id: string; name: string }[] = [];
  let milestoneLevels: string[] = [];
  let milestoneEntries: { enrollmentId: string; milestoneLevel: string; narrativeNote: string | null }[] = [];

  if (selected && isNarrative) {
    const [{ data: sessions }, { data: milestoneScale }, { data: memberships }] = await Promise.all([
      supabase
        .from("AcademicSession")
        .select("name, Term(term_id, name)")
        .order("start_date", { ascending: false }),
      supabase.from("MilestoneScale").select("levels").maybeSingle(),
      supabase
        .from("ClassMembership")
        .select("enrollment_id, SchoolEnrollment(platform_student_id, PlatformStudent(name))")
        .eq("class_id", classId!)
        .is("end_date", null),
    ]);

    terms = (sessions ?? []).flatMap((s) => s.Term.map((t) => ({ id: t.term_id, name: `${s.name} — ${t.name}` })));
    milestoneLevels = (Array.isArray(milestoneScale?.levels) ? milestoneScale.levels : []) as string[];
    students = (memberships ?? [])
      .filter((m) => m.SchoolEnrollment?.PlatformStudent)
      .map((m) => ({ enrollmentId: m.enrollment_id, name: m.SchoolEnrollment!.PlatformStudent!.name }));

    if (termId) {
      const { data: rows } = await supabase
        .from("MilestoneAssessment")
        .select("enrollment_id, milestone_level, narrative_note")
        .eq("subject_id", subjectId!)
        .eq("term_id", termId);
      milestoneEntries = (rows ?? []).map((r) => ({
        enrollmentId: r.enrollment_id,
        milestoneLevel: r.milestone_level,
        narrativeNote: r.narrative_note,
      }));
    }
  } else if (selected) {
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
        <h1 className="text-2xl font-semibold">{isNarrative ? "Developmental assessment" : "Scores"}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {isNarrative
            ? "Milestone levels are set up by your school admin."
            : "Assessments (test/exam names, weighting) are set up by your school admin."}
        </p>
      </div>

      <form method="get" className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Class / Subject</label>
          <Select
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
          </Select>
        </div>
        {isNarrative ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-secondary">Term</label>
            <Select name="termId" defaultValue={termId ?? ""} className="rounded-md border border-border px-2 py-1.5 text-sm">
              <option value="">—</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <button
          type="submit"
          className="rounded-sm border border-border px-4 py-1.5 text-sm font-medium hover:bg-primary-light transition-colors duration-fast ease-standard"
        >
          Load
        </button>
      </form>

      {selected && isNarrative ? (
        !termId ? (
          <p className="text-sm text-ink-secondary">Select a term to enter milestone assessments.</p>
        ) : milestoneLevels.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            No milestone levels set up yet for {selected.subjectName}. Ask your school admin to add one.
          </p>
        ) : (
          <MilestoneGrid
            subjectId={subjectId!}
            termId={termId}
            levels={milestoneLevels}
            students={students}
            entries={milestoneEntries}
          />
        )
      ) : selected ? (
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
