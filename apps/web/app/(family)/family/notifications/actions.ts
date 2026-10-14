"use server";

import { requireFamily } from "@schoolos/db";
import { revalidatePath } from "next/cache";

// Doc 8: "Opening the Notification Box list marks its items read
// (mark-as-read-on-open, chosen for V1 simplicity over per-item read
// tracking)." Notification already has a client update policy scoped to
// the caller's own membership_id, so this is a plain update, no new
// function needed.
export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const { supabase, membershipId } = await requireFamily();
  const { error } = await supabase
    .from("Notification")
    .update({ read_status: true })
    .eq("membership_id", membershipId)
    .eq("read_status", false);
  if (error) return { error: error.message };

  revalidatePath("/family/notifications");
  revalidatePath("/family");
  return {};
}
