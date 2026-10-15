import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { Button, EmptyState, ReportStatusBadge } from "@schoolos/ui";
import {
  CompileNarrativeReportsButton,
  ComputeResultsButton,
  FinalizeClassTermButton,
  PublishClassTermButton,
  ReopenTermReportButton,
  ReopenTermResultButton,
} from "./lifecycle-buttons";

// Doc 27 Section 7: "the report card screen... shows a full subject/
// score/credit/grade table for Option 1/2; for Option 3 it instead shows
// each developmental area with its milestone level and narrative note."
// This is the admin-facing side of the Doc 27 Section 5 lifecycle --
// compute/compile, review drafts, finalize, publish, reopen a single
// student's result/report for correction. One class+term at a time, same
// granularity the underlying RPCs use.
export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; termId?: string }>;
}) {
  const { classId, termId } = await searchParams;
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }

  const [{ data: classes }, { data: sessions }, { data: school }] = await Promise.all([
    supabase.from("Class").select("class_id, name").order("name"),
    supabase
      .from("AcademicSession")
      .select("name, Term(term_id, name)")
      .order("start_date", { ascending: false }),
    supabase.from("School").select("assessment_model").single(),
  ]);
  const terms = (sessions ?? []).flatMap((s) => s.Term.map((t) => ({ id: t.term_id, name: `${s.name} — ${t.name}` })));
  const isNarrative = school?.assessment_model === "narrative_milestone";

  type StudentRow = {
    enrollmentId: string;
    name: string;
    results: { resultId: string; subjectName: string; rawScore: number; creditWeight: number; grade: string | null; status: string }[];
    report: {
      reportId: string;
      overallScore: number | null;
      overallGrade: string | null;
      classPosition: number | null;
      overallSummary: string | null;
      status: string;
    } | null;
  };
  let students: StudentRow[] = [];

  if (classId && termId) {
    const { data: memberships } = await supabase
      .from("ClassMembership")
      .select("enrollment_id, SchoolEnrollment(platform_student_id, PlatformStudent(name))")
      .eq("class_id", classId)
      .is("end_date", null);

    const enrollmentIds = (memberships ?? []).map((m) => m.enrollment_id);
    const nameByEnrollment = new Map(
      (memberships ?? [])
        .filter((m) => m.SchoolEnrollment?.PlatformStudent)
        .map((m) => [m.enrollment_id, m.SchoolEnrollment!.PlatformStudent!.name]),
    );

    const [{ data: resultRows }, { data: reportRows }] = await Promise.all([
      supabase
        .from("TermResult")
        .select("result_id, enrollment_id, raw_score, credit_weight_snapshot, grade, status, Subject(name)")
        .eq("term_id", termId)
        .in("enrollment_id", enrollmentIds.length > 0 ? enrollmentIds : [""]),
      supabase
        .from("TermReportCard")
        .select("report_id, enrollment_id, overall_score, overall_grade, class_position, overall_summary, status")
        .eq("term_id", termId)
        .in("enrollment_id", enrollmentIds.length > 0 ? enrollmentIds : [""]),
    ]);

    const reportByEnrollment = new Map((reportRows ?? []).map((r) => [r.enrollment_id, r]));

    students = enrollmentIds
      .filter((id) => nameByEnrollment.has(id))
      .map((enrollmentId) => {
        const report = reportByEnrollment.get(enrollmentId);
        return {
          enrollmentId,
          name: nameByEnrollment.get(enrollmentId)!,
          results: (resultRows ?? [])
            .filter((r) => r.enrollment_id === enrollmentId)
            .map((r) => ({
              resultId: r.result_id,
              subjectName: r.Subject?.name ?? "—",
              rawScore: Number(r.raw_score),
              creditWeight: r.credit_weight_snapshot,
              grade: r.grade,
              status: r.status,
            })),
          report: report
            ? {
                reportId: report.report_id,
                overallScore: report.overall_score !== null ? Number(report.overall_score) : null,
                overallGrade: report.overall_grade,
                classPosition: report.class_position,
                overallSummary: report.overall_summary,
                status: report.status,
              }
            : null,
        };
      });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Results &amp; report cards</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {isNarrative
            ? "Compile narrative reports, then finalize and publish once reviewed."
            : "Compute results, then finalize and publish once reviewed. Reopen a single result to send it back for correction."}
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Class</label>
          <select name="classId" defaultValue={classId ?? ""} className="rounded-sm border border-border px-2 py-1.5 text-sm">
            <option value="">—</option>
            {(classes ?? []).map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Term</label>
          <select name="termId" defaultValue={termId ?? ""} className="rounded-sm border border-border px-2 py-1.5 text-sm">
            <option value="">—</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Load
        </Button>
      </form>

      {classId && termId ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {isNarrative ? (
              <CompileNarrativeReportsButton classId={classId} termId={termId} />
            ) : (
              <ComputeResultsButton classId={classId} termId={termId} />
            )}
            <FinalizeClassTermButton classId={classId} termId={termId} />
            <PublishClassTermButton classId={classId} termId={termId} />
          </div>

          {students.length === 0 ? (
            <EmptyState message="No students enrolled in this class, or nothing computed yet." />
          ) : (
            <ul className="flex flex-col gap-4">
              {students.map((s) => (
                <li key={s.enrollmentId} className="rounded-md border border-border p-4">
                  <p className="font-medium">{s.name}</p>

                  {isNarrative ? (
                    s.report ? (
                      <div className="mt-2 flex flex-col gap-2 text-sm">
                        <p className="whitespace-pre-wrap text-ink-secondary">{s.report.overallSummary}</p>
                        <div className="flex items-center gap-2">
                          <ReportStatusBadge status={s.report.status as "draft" | "finalized" | "published"} />
                          {s.report.status !== "draft" ? <ReopenTermReportButton reportId={s.report.reportId} /> : null}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-ink-secondary">No narrative report compiled yet.</p>
                    )
                  ) : (
                    <>
                      {s.results.length > 0 ? (
                        <table className="mt-2 w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-border text-xs text-ink-secondary">
                              <th className="py-1 pr-2">Subject</th>
                              <th className="py-1 pr-2">Score</th>
                              <th className="py-1 pr-2">Credit</th>
                              <th className="py-1 pr-2">Grade</th>
                              <th className="py-1 pr-2">Status</th>
                              <th className="py-1">Reopen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.results.map((r) => (
                              <tr key={r.resultId} className="border-b border-border/60">
                                <td className="py-1 pr-2">{r.subjectName}</td>
                                <td className="py-1 pr-2">{r.rawScore.toFixed(1)}</td>
                                <td className="py-1 pr-2">{r.creditWeight}</td>
                                <td className="py-1 pr-2">{r.grade ?? "—"}</td>
                                <td className="py-1 pr-2">
                                  <ReportStatusBadge status={r.status as "draft" | "finalized" | "published"} />
                                </td>
                                <td className="py-1">
                                  {r.status !== "draft" ? <ReopenTermResultButton resultId={r.resultId} /> : null}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="mt-2 text-sm text-ink-secondary">No results computed yet.</p>
                      )}

                      {s.report ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-2 text-sm">
                          <span>
                            Overall: <span className="font-medium">{s.report.overallScore?.toFixed(1) ?? "—"}</span>{" "}
                            {s.report.overallGrade ?? ""}
                          </span>
                          <span className="text-ink-secondary">
                            Class position: {s.report.classPosition ?? "—"}
                          </span>
                          <ReportStatusBadge status={s.report.status as "draft" | "finalized" | "published"} />
                        </div>
                      ) : null}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">Select a class and term to view or compute results.</p>
      )}
    </main>
  );
}
