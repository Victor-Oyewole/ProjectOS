import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { EmptyState, DeletionRequestStatusBadge, type DeletionRequestStatus } from "@schoolos/ui";
import { ReviewRequestForm } from "./review-request-form";

// Doc 28 Section 6, parallel to /transfers (Doc 13 journey #7). RLS
// (datadeletionrequest_select_admin_enrollment_scoped) already scopes
// this to enrollment_scoped requests for the caller's own school -- no
// extra filtering needed here, unlike /transfers which has to split
// incoming/outgoing because TransferRequest is legitimately two-sided.
export default async function DeletionRequestsPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }

  const { data: requests } = await supabase
    .from("DataDeletionRequest")
    .select("request_id, status, created_at, resolution_notes, PlatformStudent(name)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Deletion requests</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Family-submitted requests to delete a child&apos;s records at this school.
        </p>
      </div>

      {(requests ?? []).length === 0 ? (
        <EmptyState message="No deletion requests." />
      ) : (
        <ul className="flex flex-col gap-3">
          {(requests ?? []).map((r) => (
            <li key={r.request_id} className="flex flex-col gap-2 rounded-md border border-border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  {r.PlatformStudent?.name ?? "—"} — requested{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <DeletionRequestStatusBadge status={r.status as DeletionRequestStatus} />
              </div>
              {r.resolution_notes ? <p className="text-ink-secondary">{r.resolution_notes}</p> : null}
              {r.status === "pending" || r.status === "in_review" ? (
                <ReviewRequestForm requestId={r.request_id} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
