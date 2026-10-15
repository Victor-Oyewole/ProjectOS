import { createServerClient } from "@schoolos/db";
import { EmptyState, FeeStatusBadge, type FeeStatus } from "@schoolos/ui";
import { RequestDeletionButton } from "./request-deletion-button";

export default async function ChildOverviewPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();

  const [{ data: membership }, { data: recentAttendance }, { data: latestFee }, { data: enrollment }] =
    await Promise.all([
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
      supabase
        .from("FeeRecord")
        .select("status, Term(name)")
        .eq("enrollment_id", enrollmentId)
        .order("last_updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("SchoolEnrollment").select("platform_student_id").eq("enrollment_id", enrollmentId).maybeSingle(),
    ]);

  // Doc 28 Section 2/6: show the family's own most recent enrollment-scoped
  // deletion request for THIS child, if any, instead of letting them
  // resubmit a duplicate while one is already pending/in_review. RLS
  // (datadeletionrequest_select_family_own) already scopes this to only
  // the signed-in family's own requests, so the extra platform_student_id
  // filter below is just "which of MY requests is about THIS child."
  const { data: deletionRequest } = enrollment
    ? await supabase
        .from("DataDeletionRequest")
        .select("status, created_at, resolution_notes")
        .eq("platform_student_id", enrollment.platform_student_id)
        .eq("scope", "enrollment_scoped")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

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
      <div className="flex items-center gap-3">
        <p className="text-sm text-ink-secondary">Current class: {membership?.Class?.name ?? "—"}</p>
        {latestFee ? (
          <span className="flex items-center gap-1 text-sm text-ink-secondary">
            Fees ({latestFee.Term?.name}): <FeeStatusBadge status={latestFee.status as FeeStatus} />
          </span>
        ) : null}
      </div>

      <section>
        <h2 className="text-lg font-medium">Latest assignments</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-ink">
          {assignments.map((a, i) => (
            <li key={i}>
              {a.title} ({a.Class?.name} — {a.Subject?.name})
            </li>
          ))}
          {assignments.length === 0 ? <li className="text-ink-secondary">None yet.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium">Recent attendance</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-ink">
          {(recentAttendance ?? []).map((a, i) => (
            <li key={i}>
              {a.date}: {a.status}
            </li>
          ))}
          {(recentAttendance ?? []).length === 0 ? <li className="text-ink-secondary">None recorded yet.</li> : null}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Account &amp; privacy</h2>
        {deletionRequest && deletionRequest.status !== "denied" ? (
          <p className="text-sm text-ink-secondary">
            Data deletion request: <span className="font-medium">{deletionRequest.status}</span> (submitted{" "}
            {new Date(deletionRequest.created_at).toLocaleDateString()})
            {deletionRequest.resolution_notes ? ` -- ${deletionRequest.resolution_notes}` : ""}
          </p>
        ) : (
          <RequestDeletionButton enrollmentId={enrollmentId} />
        )}
      </section>
    </div>
  );
}
