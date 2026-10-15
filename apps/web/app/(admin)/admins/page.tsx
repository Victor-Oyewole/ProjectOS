import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SecondAdminForm } from "./second-admin-form";
import { RemoveAdminButton } from "./remove-admin-button";

// Doc 12 Step 3: "Add Second Admin (optional, can be done later)." Sits
// between Academic Setup and People Setup in Doc 12's onboarding sequence,
// but -- being optional -- is also fine to skip via the continue link below
// and come back to later from wherever it ends up being linked post-signup.
export default async function AdminsPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }

  const { data: admins } = await supabase
    .from("SchoolAdmin")
    .select("admin_id, name, contact_info, activation_status")
    .order("created_at", { ascending: true });

  const atCap = (admins ?? []).length >= 2;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">School admins</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Optional -- a school can have at most 2 admins. You can add or skip this and come back
          later.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {(admins ?? []).map((admin) => (
          <li
            key={admin.admin_id}
            className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
          >
            <span>
              {admin.name}
              {admin.admin_id === claims.admin_id ? <span className="text-ink-secondary"> (you)</span> : null}
              {admin.contact_info ? <span className="text-ink-secondary"> — {admin.contact_info}</span> : null}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-xs text-ink-secondary">{admin.activation_status}</span>
              {admin.admin_id !== claims.admin_id ? <RemoveAdminButton adminId={admin.admin_id} /> : null}
            </span>
          </li>
        ))}
      </ul>

      {atCap ? (
        <p className="text-sm text-ink-secondary">This school already has 2 admins (the V1 maximum).</p>
      ) : (
        <SecondAdminForm />
      )}

      <Link
        href="/people/teachers"
        className="self-start rounded-md bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark"
      >
        Continue to people setup
      </Link>
    </main>
  );
}
