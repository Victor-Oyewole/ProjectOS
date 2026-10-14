import { createServerClient } from "@schoolos/db";

export default async function ChildResultsPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();

  const { data: rows } = await supabase
    .from("Score")
    .select("value, entered_at, Assessment(name, Subject(name), Term(name))")
    .eq("enrollment_id", enrollmentId)
    .order("entered_at", { ascending: false });

  return (
    <ul className="flex flex-col gap-2">
      {(rows ?? []).map((r, i) => (
        <li key={i} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
          <span>
            {r.Assessment?.name} — {r.Assessment?.Subject?.name}{" "}
            <span className="text-slate-500">({r.Assessment?.Term?.name})</span>
          </span>
          <span className="font-medium">{r.value}</span>
        </li>
      ))}
      {(rows ?? []).length === 0 ? <li className="text-sm text-slate-500">No results recorded yet.</li> : null}
    </ul>
  );
}
