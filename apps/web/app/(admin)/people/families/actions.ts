"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 12 Step 4, Families tab. Person has no admin-insert RLS policy (it's
// platform-level, see 040_people.sql's note) -- admin_create_family_person()
// (migration 035) bootstraps the Person + FamilyMembership together; the
// Guardian and FamilyStudentRelationship inserts after that are ordinary
// RLS-scoped admin inserts.
const FamilySchema = z.object({
  guardianName: z.string().trim().min(1, "Guardian name is required"),
  relationship: z.string().trim().optional(),
  contactInfo: z.string().trim().optional(),
  studentIds: z.array(z.string()).optional(),
});

export async function addFamily(formData: FormData): Promise<{ error?: string }> {
  const parsed = FamilySchema.safeParse({
    guardianName: formData.get("guardianName"),
    relationship: formData.get("relationship") || undefined,
    contactInfo: formData.get("contactInfo") || undefined,
    studentIds: formData.getAll("studentIds").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();

  const { data: membershipId, error: bootstrapError } = await supabase.rpc("admin_create_family_person", {
    p_name: parsed.data.guardianName,
    p_contact_info: parsed.data.contactInfo,
  });
  if (bootstrapError) return { error: bootstrapError.message };

  const { error: guardianError } = await supabase.from("Guardian").insert({
    membership_id: membershipId,
    name: parsed.data.guardianName,
    relationship: parsed.data.relationship ?? null,
    contact_info: parsed.data.contactInfo ?? null,
  });
  if (guardianError) return { error: guardianError.message };

  for (const platformStudentId of parsed.data.studentIds ?? []) {
    const { error: linkError } = await supabase.from("FamilyStudentRelationship").insert({
      membership_id: membershipId,
      platform_student_id: platformStudentId,
      relationship_type: "parent",
    });
    if (linkError) return { error: linkError.message };
  }

  revalidatePath("/people/families");
  return {};
}
