import { createServerClient } from "@schoolos/db";
import { MarkViewedOnMount } from "./mark-viewed-on-mount";
import { AcknowledgeButton } from "./acknowledge-button";

// Doc 13 #4 Screen 5: "List filtered to 'available' window (available_at <=
// now). Tap -> full instructions, [Acknowledge] action." Full instructions
// are shown inline rather than behind a separate tap-through screen -- this
// list IS the detail view, there's no extra content a second screen would
// add. Viewing this list is what Doc 13 means by the student having
// "viewed" an assignment, so the first render here marks any not-yet-seen
// assignment 'Viewed' (via a client-side mount effect, not during this
// Server Component's render).
export default async function ChildAssignmentsPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();

  const { data: membership } = await supabase
    .from("ClassMembership")
    .select("class_id")
    .eq("enrollment_id", enrollmentId)
    .is("end_date", null)
    .maybeSingle();

  let assignments: {
    assignment_id: string;
    title: string;
    instructions: string | null;
    available_at: string;
    Subject: { name: string } | null;
  }[] = [];
  if (membership) {
    const { data } = await supabase
      .from("Assignment")
      .select("assignment_id, title, instructions, available_at, Subject(name)")
      .eq("class_id", membership.class_id)
      .eq("status", "Published")
      .lte("available_at", new Date().toISOString())
      .order("available_at", { ascending: false });
    assignments = data ?? [];
  }

  const { data: statuses } = await supabase
    .from("StudentAssignmentStatus")
    .select("assignment_id, status")
    .eq("enrollment_id", enrollmentId);
  const statusByAssignment = new Map((statuses ?? []).map((s) => [s.assignment_id, s.status]));

  const unseenIds = assignments.filter((a) => !statusByAssignment.has(a.assignment_id)).map((a) => a.assignment_id);

  return (
    <div className="flex flex-col gap-3">
      <MarkViewedOnMount enrollmentId={enrollmentId} assignmentIds={unseenIds} />
      {assignments.map((a) => {
        const status = statusByAssignment.get(a.assignment_id) ?? "Viewed";
        return (
          <div key={a.assignment_id} className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {a.title} <span className="font-normal text-ink-secondary">({a.Subject?.name})</span>
              </p>
              <span className="text-xs text-ink-secondary">{status}</span>
            </div>
            {a.instructions ? <p className="mt-2 text-sm text-ink">{a.instructions}</p> : null}
            <p className="mt-2 text-xs text-ink-secondary">Available {new Date(a.available_at).toLocaleString()}</p>
            {status !== "Acknowledged" ? (
              <div className="mt-3">
                <AcknowledgeButton assignmentId={a.assignment_id} enrollmentId={enrollmentId} />
              </div>
            ) : null}
          </div>
        );
      })}
      {assignments.length === 0 ? <p className="text-sm text-ink-secondary">No assignments available yet.</p> : null}
    </div>
  );
}
