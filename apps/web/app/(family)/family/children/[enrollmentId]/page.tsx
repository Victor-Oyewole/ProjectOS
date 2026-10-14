import { createServerClient } from "@schoolos/db";

export default async function ChildOverviewPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();

  const [{ data: membership }, { data: recentAttendance }] = await Promise.all([
    supabase
      .from("ClassMembership")
      .select("class_id, Class(name)")
      .eq("enrollment_id", enrollmentId)
      .is("end_date", null)
      .maybeSingle(),
    supabase
      .from("Attendance")
      .select("status, date")
      .eq("enrollment_id", enrollmentId)
      .order("date", { ascending: false })
      .limit(5),
  ]);

  let assignments: { title: string; Class: { name: string } | null; Subject: { name: string } | null }[] = [];
  if (membership) {
    const { data } = await supabase
      .from("Assignment")
      .select("title, Class(name), Subject(name)")
      .eq("class_id", membership.class_id)
      .eq("status", "Published")
      .lte("available_at", new Date().toISOString())
      .order("available_at", { ascending: false })
      .limit(3);
    assignments = data ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-slate-600">Current class: {membership?.Class?.name ?? "—"}</p>

      <section>
        <h2 className="text-lg font-medium">Latest assignments</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
          {assignments.map((a, i) => (
            <li key={i}>
              {a.title} ({a.Class?.name} — {a.Subject?.name})
            </li>
          ))}
          {assignments.length === 0 ? <li className="text-slate-500">None yet.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium">Recent attendance</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
          {(recentAttendance ?? []).map((a, i) => (
            <li key={i}>
              {a.date}: {a.status}
            </li>
          ))}
          {(recentAttendance ?? []).length === 0 ? <li className="text-slate-500">None recorded yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
