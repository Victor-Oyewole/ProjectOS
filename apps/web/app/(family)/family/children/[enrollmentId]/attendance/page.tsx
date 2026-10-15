import { createServerClient } from "@schoolos/db";

export default async function ChildAttendancePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();

  const { data: rows } = await supabase
    .from("Attendance")
    .select("date, status")
    .eq("enrollment_id", enrollmentId)
    .order("date", { ascending: false });

  return (
    <ul className="flex flex-col gap-2">
      {(rows ?? []).map((r, i) => (
        <li key={i} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
          <span>{r.date}</span>
          <span className="text-ink-secondary">{r.status}</span>
        </li>
      ))}
      {(rows ?? []).length === 0 ? <li className="text-sm text-ink-secondary">No attendance recorded yet.</li> : null}
    </ul>
  );
}
