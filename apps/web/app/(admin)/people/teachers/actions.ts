"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 12 Step 4, Teachers tab, "+ Add Manually". Plain RLS-scoped insert
// (teacher_all_admin in 040_people.sql already permits
// auth_app_role() = 'admin' AND school_id = auth_school_id()) -- no
// activation_status is set here, it defaults to 'Pending' (schema default);
// auth_user_id stays null until the teacher actually activates (Doc 12
// Step 5, not built yet).
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

  const { supabase, schoolId } = await requireAdminSchoolId();
  const { error } = await supabase.from("Teacher").insert({
    school_id: schoolId,
    name: parsed.data.name,
    staff_id: parsed.data.staffId ?? null,
    contact_info: parsed.data.contactInfo ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/people/teachers");
  return {};
}
