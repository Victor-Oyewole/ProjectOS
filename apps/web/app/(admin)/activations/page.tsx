import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { CopyLinkButton } from "./copy-link-button";

// Doc 12 Step 5: Distribute Activation. "[Send via WhatsApp] ... or [Copy
// Link] for manual distribution" -- WhatsApp Cloud API dispatch needs real
// Meta Business API credentials this environment doesn't have, so only the
// copy-link path is built. Each pending person already has a code (Doc 12
// Step 4: "On confirm: activation codes generated per person"), generated
// at creation time in people/teachers and people/families' actions.ts.
export default async function ActivationsPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }

  const { data: codes } = await supabase
    .from("ActivationCode")
    .select("activation_code_id, target_entity, target_id, code, expires_at")
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const rows = await Promise.all(
    (codes ?? []).map(async (c) => {
      let name = "(unknown)";
      if (c.target_entity === "Teacher") {
        const { data } = await supabase.from("Teacher").select("name").eq("teacher_id", c.target_id).single();
        name = data?.name ?? name;
      } else if (c.target_entity === "Person") {
        const { data } = await supabase.from("Person").select("name").eq("person_id", c.target_id).single();
        name = data?.name ?? name;
      } else if (c.target_entity === "SchoolAdmin") {
        const { data } = await supabase.from("SchoolAdmin").select("name").eq("admin_id", c.target_id).single();
        name = data?.name ?? name;
      }
      return { ...c, name };
    }),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Pending activations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Codes expire 7 days after generation. Copy a link and send it to the person however
          works best.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.activation_code_id}
            className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"
          >
            <span>
              {row.name}{" "}
              <span className="text-slate-500">
                ({row.target_entity === "Person" ? "family" : row.target_entity.toLowerCase()})
              </span>
            </span>
            <CopyLinkButton code={row.code} />
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="text-sm text-slate-500">No pending activations.</li>
        ) : null}
      </ul>
    </main>
  );
}
