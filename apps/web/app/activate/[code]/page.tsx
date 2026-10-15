import { createServerClient } from "@schoolos/db";
import { ActivateForm } from "./activate-form";

// Doc 12 "Teacher Activation"/"Family Activation" step 2: "Opens link ->
// confirms identity". Public page, no auth guard -- the person has no
// account yet. validate_activation_code is anon-callable (migration 037).
export default async function ActivatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
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
