import { createServerClient } from "@schoolos/db";
import { EmptyState, FeeStatusBadge, type FeeStatus } from "@schoolos/ui";

// Doc 13 #4 Screen 6 / Doc 9: "Fee Status Tab -- Per term: expected, paid,
// status badge (view-only in V1)." No payment action here -- Doc 6: family
// can view but never edit fee status in V1.
export default async function ChildFeesPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();

  const { data: rows } = await supabase
    .from("FeeRecord")
    .select("amount_expected, amount_paid, status, Term(name, AcademicSession(name))")
    .eq("enrollment_id", enrollmentId)
    .order("payment_date", { ascending: false, nullsFirst: false });

  if ((rows ?? []).length === 0) {
    return <EmptyState message="No fee records yet." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {(rows ?? []).map((r, i) => (
        <li key={i} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
          <span>
            {r.Term?.AcademicSession?.name} — {r.Term?.name}
          </span>
          <span className="flex items-center gap-3">
            <span className="text-ink-secondary">
              {r.amount_paid} / {r.amount_expected}
            </span>
            <FeeStatusBadge status={r.status as FeeStatus} />
          </span>
        </li>
      ))}
    </ul>
  );
}
