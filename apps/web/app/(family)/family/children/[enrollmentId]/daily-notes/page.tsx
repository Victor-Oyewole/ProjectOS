import { createServerClient } from "@schoolos/db";

export default async function ChildDailyNotesPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();

  const { data: rows } = await supabase
    .from("DailyNote")
    .select("note_text, category, date, created_at")
    .eq("enrollment_id", enrollmentId)
    .order("created_at", { ascending: false });

  return (
    <ul className="flex flex-col gap-2">
      {(rows ?? []).map((r, i) => (
        <li key={i} className="rounded-md border border-border p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-secondary">{r.category}</span>
            <span className="text-xs text-ink-secondary">{r.date}</span>
          </div>
          <p className="mt-1 text-ink">{r.note_text}</p>
        </li>
      ))}
      {(rows ?? []).length === 0 ? <li className="text-sm text-ink-secondary">No notes yet.</li> : null}
    </ul>
  );
}
