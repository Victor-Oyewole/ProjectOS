import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// Doc 12 Step 4: People Setup -- "tabbed (Teachers / Students / Families)".
export default async function PeopleLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">People setup</h1>
        <Link href="/admins" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          Manage school admins
        </Link>
      </div>
      <nav className="flex gap-4 border-b border-slate-200 text-sm font-medium">
        <Link href="/people/teachers" className="px-1 pb-3 hover:text-slate-900">
          Teachers
        </Link>
        <Link href="/people/students" className="px-1 pb-3 hover:text-slate-900">
          Students
        </Link>
        <Link href="/people/families" className="px-1 pb-3 hover:text-slate-900">
          Families
        </Link>
      </nav>
      {children}
      <Link
        href="/activations"
        className="self-start rounded-md bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
      >
        Save &amp; continue to distribute activations
      </Link>
    </main>
  );
}
