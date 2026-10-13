"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 12 Step 4, Teachers tab, "+ Add Manually". admin_add_teacher()
// (migration 040) creates the Teacher row AND generates its activation
// code ("on confirm: activation codes generated per person," Doc 12 Step
// 4) in one Postgres transaction -- a previous two-call version (plain
// insert, then a separate RPC) left an orphaned Teacher row with no code
// whenever the second call failed, since nothing rolled back the first.
const TeacherSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  staffId: z.string().trim().optional(),
  contactInfo: z.string().trim().optional(),
});

export async function addTeacher(formData: FormData): Promise<{ error?: string }> {
  const parsed = TeacherSchema.safeParse({
    name: formData.get("name"),
    staffId: formData.get("staffId") || undefined,
    contactInfo: formData.get("contactInfo") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_add_teacher", {
    p_name: parsed.data.name,
    p_staff_id: parsed.data.staffId,
    p_contact_info: parsed.data.contactInfo,
  });
  if (error) return { error: error.message };

  revalidatePath("/people/teachers");
  return {};
}
