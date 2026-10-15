import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { TransferStatusBadge, type TransferStatus } from "@schoolos/ui";
import { ReviewForm } from "./review-form";

// Doc 13 #7 Screen 2: "Shows requested record categories (Platform
// Identity / Transferable Academic / School-Internal)." Platform Identity
// (name, dob) is shown directly below -- it's always part of a transfer,
// never a selectable category. School-Internal records (Doc 7) are never
// transferred at all, so there's nothing to show for that category here.
export default async function ReviewTransferRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }
  const schoolId = claims.school_id;

  const { data: request } = await supabase
    .from("TransferRequest")
    .select(
      "request_id, status, created_at, resolved_at, from_school_id, to_school_id, PlatformStudent(name, dob), ToSchool:to_school_id(name)",
    )
    .eq("request_id", requestId)
    .maybeSingle();
  if (!request) notFound();

  const isReleasingSchool = request.from_school_id === schoolId;

  const { data: pkg } = await supabase
    .from("TransferPackage")
    .select("included_records, created_at")
    .eq("request_id", requestId)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transfer request</h1>
        <Link href="/transfers" className="text-sm text-ink-secondary hover:text-ink">
          Back to transfers
        </Link>
      </div>

      <div className="flex flex-col gap-1 rounded-md border border-border p-4 text-sm">
        <p>
          <span className="text-ink-secondary">Student (Platform Identity):</span> {request.PlatformStudent?.name ?? "—"}{" "}
          ({request.PlatformStudent?.dob ?? "—"})
        </p>
        <p>
          <span className="text-ink-secondary">Requesting school:</span> {request.ToSchool?.name ?? "—"}
        </p>
        <p>
          <span className="text-ink-secondary">Requested:</span> {new Date(request.created_at).toLocaleString()}
        </p>
        <p className="flex items-center gap-2">
          <span className="text-ink-secondary">Status:</span> <TransferStatusBadge status={request.status as TransferStatus} />
        </p>
      </div>

      {!isReleasingSchool ? (
        <p className="text-sm text-ink-secondary">
          This request is awaiting review by the releasing school. You submitted it, so there's nothing further for
          you to do here yet.
        </p>
      ) : request.status === "Pending" ? (
        <ReviewForm requestId={requestId} />
      ) : (
        <div className="rounded-md border border-border p-4 text-sm">
          <p>
            This request was <span className="font-medium">{request.status.toLowerCase()}</span>
            {request.resolved_at ? ` on ${new Date(request.resolved_at).toLocaleString()}` : ""}.
          </p>
          {pkg ? (
            <ul className="mt-2 list-inside list-disc text-ink-secondary">
              {Object.entries(pkg.included_records as Record<string, boolean>)
                .filter(([, included]) => included)
                .map(([key]) => <li key={key}>{key.replace(/_/g, " ")}</li>)}
            </ul>
          ) : null}
        </div>
      )}
    </main>
  );
}
