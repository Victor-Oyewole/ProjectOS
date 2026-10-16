"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logged } from "@/lib/action-log";

// Doc 12 Step 3 ("Add Second Admin (optional, can be done later)") and
// Doc 3's Admin permissions table ("Add/remove second admin -- Max 2 per
// school (V1)"). admin_add_second_admin (migration 042) generates the
// activation code atomically, same reasoning as admin_add_teacher.
const SecondAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contactInfo: z.string().trim().optional(),
});

export async function addSecondAdmin(formData: FormData): Promise<{ error?: string }> {
  return logged("admins.addSecondAdmin", async () => {
    const parsed = SecondAdminSchema.safeParse({
      name: formData.get("name"),
      contactInfo: formData.get("contactInfo") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();
    const { error } = await supabase.rpc("admin_add_second_admin", {
      p_name: parsed.data.name,
      p_contact_info: parsed.data.contactInfo,
    });
    if (error) return { error: error.message };

    revalidatePath("/admins");
    return {};
  });
}

export async function removeSecondAdmin(adminId: string): Promise<{ error?: string }> {
  return logged("admins.removeSecondAdmin", async () => {
    const { supabase } = await requireAdminSchoolId();
    const { error } = await supabase.rpc("admin_remove_second_admin", { p_admin_id: adminId });
    if (error) return { error: error.message };

    revalidatePath("/admins");
    return {};
  });
}
