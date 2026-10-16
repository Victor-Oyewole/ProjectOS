import { createAdminClient, createServerClient } from "@schoolos/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ActivateForm } from "./activate-form";

// Doc 12 "Teacher Activation"/"Family Activation" step 2: "Opens link ->
// confirms identity". Public page, no auth guard -- the person has no
// account yet. validate_activation_code is anon-callable (migration 037).
//
// Doc 3 Section 6: this GET is the actual code-enumeration surface (no
// form submission needed to probe whether a code is valid), so it's rate
// limited by IP ahead of the RPC call itself, not just the activate()
// submit action.
export default async function ActivatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const allowed = await checkRateLimit(createAdminClient(), `activate-check:${await getClientIp()}`, 20, 3600);
  if (!allowed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">Too many attempts</h1>
        <p className="text-ink-secondary">Please wait a while before trying another activation link.</p>
      </main>
    );
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("validate_activation_code", { p_code: code });

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">This activation link isn&rsquo;t valid</h1>
        <p className="text-ink-secondary">
          {error?.message ?? "It may have expired, been used already, or been revoked."} Ask your
          school admin for a new link.
        </p>
      </main>
    );
  }

  const info = data as { name: string; school_name: string };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Activate your account</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {info.name} &mdash; {info.school_name}
        </p>
      </div>
      <ActivateForm code={code} />
    </main>
  );
}
