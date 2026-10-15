import { createServerClient } from "@schoolos/db";
import { EmptyState } from "@schoolos/ui";

// Doc 27 Section 6: "Family views TermReportCard only once published."
// RLS (termreportcard_select_family_published / termresult_select_family_published,
// migrations 046/053) already enforces this -- any row this query gets
// back is by definition published, so no extra status check is needed here.
//
// Flagged, inferred default (Doc 27's own "How to apply" gap): for a term
// that has never gone through the Doc 27 compute/finalize/publish
// lifecycle at all (the vast majority of schools/terms today, since this
// is a brand-new feature), there is no TermReportCard row yet -- showing
// nothing would silently remove functionality every family has had since
// Milestone 3. For any such term, this falls back to the original raw
// Score list, clearly labeled "Provisional." Once a term's report card is
// published, its entry switches to the computed view and the raw fallback
// is suppressed for that term. This is a product-level call Doc 27 left
// open, not a silent engineering default -- worth confirming with Alana
// once a school actually starts using Compute/Finalize/Publish for real.
export default async function ChildResultsPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();

  const [{ data: reportCards }, { data: resultRows }, { data: rawScores }] = await Promise.all([
    supabase
      .from("TermReportCard")
      .select("report_id, term_id, overall_score, overall_grade, class_position, overall_summary, teacher_remark, Term(name)")
      .eq("enrollment_id", enrollmentId)
      .order("term_id"),
    supabase
      .from("TermResult")
      .select("term_id, raw_score, credit_weight_snapshot, grade, Subject(name)")
      .eq("enrollment_id", enrollmentId),
    supabase
      .from("Score")
      .select("value, entered_at, Assessment(name, Subject(name), term_id, Term(name))")
      .eq("enrollment_id", enrollmentId)
      .order("entered_at", { ascending: false }),
  ]);

  type ResultRow = NonNullable<typeof resultRows>[number];
  const publishedTermIds = new Set((reportCards ?? []).map((r) => r.term_id));
  const resultsByTerm = new Map<string, ResultRow[]>();
  for (const r of resultRows ?? []) {
    const list = resultsByTerm.get(r.term_id) ?? [];
    list.push(r);
    resultsByTerm.set(r.term_id, list);
  }
  const provisionalScores = (rawScores ?? []).filter((s) => {
    const termId = s.Assessment?.term_id;
    return termId !== undefined && !publishedTermIds.has(termId);
  });

  const hasAnything = (reportCards ?? []).length > 0 || provisionalScores.length > 0;

  if (!hasAnything) {
    return <EmptyState message="No results recorded yet." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {(reportCards ?? []).map((card) => {
        const subjectResults = resultsByTerm.get(card.term_id) ?? [];
        return (
          <div key={card.report_id} className="rounded-md border border-border p-4">
            <p className="font-medium">{card.Term?.name}</p>

            {subjectResults.length > 0 ? (
              <table className="mt-2 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-ink-secondary">
                    <th className="py-1 pr-2">Subject</th>
                    <th className="py-1 pr-2">Score</th>
                    <th className="py-1 pr-2">Credit</th>
                    <th className="py-1 pr-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectResults.map((r, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-1 pr-2">{r.Subject?.name ?? "—"}</td>
                      <td className="py-1 pr-2">{Number(r.raw_score).toFixed(1)}</td>
                      <td className="py-1 pr-2">{r.credit_weight_snapshot}</td>
                      <td className="py-1 pr-2">{r.grade ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : card.overall_summary ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary">{card.overall_summary}</p>
            ) : null}

            {card.overall_score !== null ? (
              <p className="mt-3 border-t border-border pt-2 text-sm">
                Overall: <span className="font-medium">{Number(card.overall_score).toFixed(1)}</span>{" "}
                {card.overall_grade ?? ""}
                {card.class_position ? (
                  <span className="text-ink-secondary"> — Class position: {card.class_position}</span>
                ) : null}
              </p>
            ) : null}
            {card.teacher_remark ? (
              <p className="mt-1 text-sm text-ink-secondary">Teacher&apos;s remark: {card.teacher_remark}</p>
            ) : null}
          </div>
        );
      })}

      {provisionalScores.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-ink-secondary">Provisional — not yet finalized</p>
          <ul className="flex flex-col gap-2">
            {provisionalScores.map((r, i) => (
              <li key={i} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span>
                  {r.Assessment?.name} — {r.Assessment?.Subject?.name}{" "}
                  <span className="text-ink-secondary">({r.Assessment?.Term?.name})</span>
                </span>
                <span className="font-medium">{r.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
