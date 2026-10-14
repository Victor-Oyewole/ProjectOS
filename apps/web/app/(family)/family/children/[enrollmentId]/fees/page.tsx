import { createServerClient } from "@schoolos/db";

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

  return (
    <ul className="flex flex-col gap-2">
      {(rows ?? []).map((r, i) => (
        <li key={i} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
          <span>
            {r.Term?.AcademicSession?.name} — {r.Term?.name}
          </span>
          <span className="flex items-center gap-3">
            <span className="text-slate-500">
              {r.amount_paid} / {r.amount_expected}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                r.status === "Paid"
                  ? "bg-green-100 text-green-800"
                  : r.status === "Partial"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {r.status}
            </span>
          </span>
        </li>
      ))}
      {(rows ?? []).length === 0 ? <li className="text-sm text-slate-500">No fee records yet.</li> : null}
    </ul>
  );
}
