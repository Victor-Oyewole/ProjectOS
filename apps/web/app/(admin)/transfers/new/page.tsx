import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { NewRequestForm } from "./new-request-form";

export default async function NewTransferRequestPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">New transfer request</h1>
        <p className="mt-1 text-sm text-slate-600">
          Request a transferring student&apos;s records from their previous school.
        </p>
      </div>
      <NewRequestForm />
    </main>
  );
}
