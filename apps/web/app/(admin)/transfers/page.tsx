import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// Doc 13 #7 Screen 1: "Transfer Requests (Pending) -- List: student,
// requesting school, date requested." Doc 6 / 080_transfers.sql: an admin
// sees requests on EITHER side of their school, but can only act on the
// ones where their school is releasing (from_school_id) -- split into two
// sections so it's immediately clear which rows need this admin's action
// versus which are just status updates on a request they themselves made.
export default async function TransfersPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }
  const schoolId = claims.school_id;

  const { data: requests } = await supabase
    .from("TransferRequest")
    .select(
      "request_id, status, created_at, resolved_at, from_school_id, to_school_id, PlatformStudent(name), FromSchool:from_school_id(name), ToSchool:to_school_id(name)",
    )
    .order("created_at", { ascending: false });

  const incoming = (requests ?? []).filter((r) => r.from_school_id === schoolId);
  const outgoing = (requests ?? []).filter((r) => r.to_school_id === schoolId);

  function statusBadge(status: string) {
    const classes =
      status === "Approved"
        ? "bg-green-100 text-green-800"
        : status === "Denied"
          ? "bg-red-100 text-red-800"
          : "bg-amber-100 text-amber-800";
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>{status}</span>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transfers</h1>
          <p className="mt-1 text-sm text-slate-600">Incoming/outgoing student record transfer requests.</p>
        </div>
        <Link
          href="/transfers/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          New transfer request
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Incoming -- requests for us to release records</h2>
        <ul className="flex flex-col gap-2">
          {incoming.map((r) => (
            <li
              key={r.request_id}
              className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"
            >
              <span>
                {r.PlatformStudent?.name ?? "—"} — requested by {r.ToSchool?.name ?? "—"} on{" "}
                {new Date(r.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-3">
                {statusBadge(r.status)}
                {r.status === "Pending" ? (
                  <Link
                    href={`/transfers/${r.request_id}`}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100"
                  >
                    Review
                  </Link>
                ) : null}
              </span>
            </li>
          ))}
          {incoming.length === 0 ? <li className="text-sm text-slate-500">No incoming requests.</li> : null}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Outgoing -- requests we submitted</h2>
        <ul className="flex flex-col gap-2">
          {outgoing.map((r) => (
            <li
              key={r.request_id}
              className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"
            >
              <span>
                {r.PlatformStudent?.name ?? "—"} — releasing school {r.FromSchool?.name ?? "—"} on{" "}
                {new Date(r.created_at).toLocaleDateString()}
              </span>
              {statusBadge(r.status)}
            </li>
          ))}
          {outgoing.length === 0 ? <li className="text-sm text-slate-500">No outgoing requests.</li> : null}
        </ul>
      </section>
    </main>
  );
}
