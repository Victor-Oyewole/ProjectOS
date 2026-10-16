import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// Doc 19 #2: the bell icon with unread badge must be "visible from every
// screen" -- lives in this shared layout rather than any one page so it
// carries across the dashboard and every child's profile.
export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "family" || !claims.membership_id) {
    redirect("/login");
  }

  const { count: unreadCount } = await supabase
    .from("Notification")
    .select("notification_id", { count: "exact", head: true })
    .eq("membership_id", claims.membership_id)
    .eq("read_status", false);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <nav className="flex items-center justify-between border-b border-border pb-3 text-sm font-medium">
        <div className="flex gap-4">
          <Link href="/family" className="hover:text-ink transition-colors duration-fast ease-standard">
            Dashboard
          </Link>
        </div>
        <Link href="/family/notifications" className="flex items-center gap-1 hover:text-ink transition-colors duration-fast ease-standard">
          <span aria-hidden>🔔</span>
          {unreadCount ? (
            <span className="rounded-full bg-danger px-1.5 py-0.5 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>
      </nav>
      {children}
    </main>
  );
}
