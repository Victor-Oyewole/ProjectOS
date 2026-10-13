"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseCsvWithHeader } from "@/lib/csv";

// Doc 12 Step 4, Families tab. Person has no admin-insert RLS policy (it's
// platform-level, see 040_people.sql's note) -- admin_create_family_person()
// (migration 040) bootstraps the Person + FamilyMembership AND generates
// the activation code ("on confirm: activation codes generated per
// person," Doc 12 Step 4) in one Postgres transaction. Guardian and
// FamilyStudentRelationship after that are ordinary RLS-scoped admin
// inserts, not folded in: a failure there just means no guardian record
// yet, recoverable by re-trying, unlike the Person+code pair where a
// partial failure would otherwise leave an uncontactable orphan (the bug
// this exact pattern was created to prevent for Teachers -- see migration
// 040's comment).
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

  const { data: bootstrap, error: bootstrapError } = await supabase.rpc("admin_create_family_person", {
    p_name: parsed.data.guardianName,
    p_contact_info: parsed.data.contactInfo,
  });
  if (bootstrapError) return { error: bootstrapError.message };
  const { membership_id: membershipId } = bootstrap as { membership_id: string; code: string };

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

// Doc 12 Step 4, "[Bulk Import CSV]". Expected columns: guardian_name
// (required), relationship, contact_info (both optional). Doesn't support
// linking students via CSV (Doc 12 doesn't specify how a families CSV
// would cross-reference a students CSV) -- link students afterward via
// the manual "Add family" form's checkboxes.
export interface FamilyCsvRow {
  rowNumber: number;
  guardianName: string;
  relationship: string;
  contactInfo: string;
  errors: string[];
}

export async function previewFamiliesCsv(csvText: string): Promise<{ error?: string; rows?: FamilyCsvRow[] }> {
  const records = parseCsvWithHeader(csvText);
  if (records.length === 0) return { error: "The file has no data rows." };

  const rows: FamilyCsvRow[] = records.map((record, index) => {
    const errors: string[] = [];
    const guardianName = record.guardian_name ?? "";
    if (!guardianName) errors.push("guardian_name is required");

    return {
      rowNumber: index + 2,
      guardianName,
      relationship: record.relationship ?? "",
      contactInfo: record.contact_info ?? "",
      errors,
    };
  });

  return { rows };
}

export async function confirmFamiliesCsv(rows: FamilyCsvRow[]): Promise<{ error?: string }> {
  if (rows.some((r) => r.errors.length > 0)) {
    return { error: "Fix all row errors before confirming -- no records were created." };
  }

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_bulk_add_families", {
    p_rows: rows.map((r) => ({
      guardian_name: r.guardianName,
      relationship: r.relationship || null,
      contact_info: r.contactInfo || null,
    })),
  });
  if (error) return { error: error.message };

  revalidatePath("/people/families");
  return {};
}
