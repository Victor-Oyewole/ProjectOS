import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { MarkReadOnMount } from "./mark-read-on-mount";

const CATEGORY_ICON: Record<string, string> = {
  assignment: "📘",
  attendance: "🗓️",
  fee: "💰",
  announcement: "📣",
  daily_note: "📝",
};

export default async function FamilyNotificationsPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "family" || !claims.membership_id) {
    redirect("/login");
  }

  const { data: notifications } = await supabase
    .from("Notification")
    .select("notification_id, category, message_text, read_status, created_at")
    .eq("membership_id", claims.membership_id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = (notifications ?? []).some((n) => !n.read_status);

  return (
    <div className="flex flex-col gap-4">
      <MarkReadOnMount hasUnread={hasUnread} />
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <ul className="flex flex-col gap-2">
        {(notifications ?? []).map((n) => (
          <li
            key={n.notification_id}
            className={`flex items-start gap-3 rounded-md border p-3 text-sm ${
              n.read_status ? "border-border" : "border-primary bg-bg"
            }`}
          >
            <span aria-hidden>{CATEGORY_ICON[n.category] ?? "🔔"}</span>
            <div>
              <p>{n.message_text}</p>
              <p className="mt-1 text-xs text-ink-secondary">
                {n.category} — {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
        {(notifications ?? []).length === 0 ? (
          <li className="text-sm text-ink-secondary">No notifications yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
