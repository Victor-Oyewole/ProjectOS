import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RecordPaymentForm } from "./record-payment-form";
import { SendReminderButton } from "./send-reminder-button";

// Doc 13 #5 Screen 1: "Fee Overview -- Filter: Class / Status. Table:
// Student | Class | Expected | Paid | Status. [Export CSV] [Send
// Reminder]." A student with no FeeRecord row yet for the selected term
// shows as Expected 0 / Paid 0 / Owing -- same as what the recompute
// trigger would produce for an all-zero row, just without a row existing
// until the admin actually records something for them.
export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; classId?: string; status?: string }>;
}) {
  const { termId, classId, status } = await searchParams;
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }

  const { data: sessions } = await supabase
    .from("AcademicSession")
    .select("name, Term(term_id, name)")
    .order("start_date", { ascending: false });
  const terms = (sessions ?? []).flatMap((s) => s.Term.map((t) => ({ id: t.term_id, name: `${s.name} — ${t.name}` })));

  const { data: classes } = await supabase.from("Class").select("class_id, name").order("name");

  let rows: {
    enrollmentId: string;
    name: string;
    className: string | null;
    amountExpected: number;
    amountPaid: number;
    status: "Paid" | "Partial" | "Owing";
  }[] = [];

  if (termId) {
    const { data: enrollments } = await supabase
      .from("SchoolEnrollment")
      .select("enrollment_id, platform_student_id, PlatformStudent(name), ClassMembership(class_id, end_date, Class(name))")
      .eq("status", "Active");

    const { data: feeRecords } = await supabase
      .from("FeeRecord")
      .select("enrollment_id, amount_expected, amount_paid, status")
      .eq("term_id", termId);
    const feeByEnrollment = new Map((feeRecords ?? []).map((f) => [f.enrollment_id, f]));

    rows = (enrollments ?? [])
      .map((e) => {
        const currentMembership = e.ClassMembership.find((cm) => cm.end_date === null);
        if (classId && currentMembership?.class_id !== classId) return null;
        const fee = feeByEnrollment.get(e.enrollment_id);
        const rowStatus = (fee?.status as "Paid" | "Partial" | "Owing" | undefined) ?? "Owing";
        if (status && rowStatus !== status) return null;
        return {
          enrollmentId: e.enrollment_id,
          name: e.PlatformStudent?.name ?? "—",
          className: currentMembership?.Class?.name ?? null,
          amountExpected: Number(fee?.amount_expected ?? 0),
          amountPaid: Number(fee?.amount_paid ?? 0),
          status: rowStatus,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Fees</h1>
        <p className="mt-1 text-sm text-slate-600">Record payments and send reminders, per term.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Term</label>
          <select name="termId" defaultValue={termId ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">—</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Class</label>
          <select name="classId" defaultValue={classId ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">All</option>
            {(classes ?? []).map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Status</label>
          <select name="status" defaultValue={status ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">All</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Owing">Owing</option>
          </select>
        </div>
        <button type="submit" className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-100">
          Load
        </button>
      </form>

      {termId ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/fees/export?termId=${termId}${classId ? `&classId=${classId}` : ""}${status ? `&status=${status}` : ""}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
            >
              Export CSV
            </Link>
            <SendReminderButton termId={termId} />
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-1 pr-2">Student</th>
                <th className="py-1 pr-2">Class</th>
                <th className="py-1 pr-2">Expected</th>
                <th className="py-1 pr-2">Paid</th>
                <th className="py-1 pr-2">Status</th>
                <th className="py-1">Record payment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.enrollmentId} className="border-b border-slate-100">
                  <td className="py-2 pr-2">{r.name}</td>
                  <td className="py-2 pr-2 text-slate-500">{r.className ?? "—"}</td>
                  <td className="py-2 pr-2">{r.amountExpected}</td>
                  <td className="py-2 pr-2">{r.amountPaid}</td>
                  <td className="py-2 pr-2">
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
                  </td>
                  <td className="py-2">
                    <RecordPaymentForm
                      enrollmentId={r.enrollmentId}
                      termId={termId}
                      currentExpected={r.amountExpected}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-sm text-slate-500">
                    No students match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Select a term to view fee status.</p>
      )}
    </main>
  );
}
