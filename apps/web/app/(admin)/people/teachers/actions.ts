"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseCsvWithHeader } from "@/lib/csv";

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

// Doc 12 Step 4, "[Bulk Import CSV]": "download template -> upload ->
// preview/validate (flag errors/warnings per row) -> confirm." Expected
// columns: name (required), staff_id, contact_info (both optional).
export interface TeacherCsvRow {
  rowNumber: number;
  name: string;
  staffId: string;
  contactInfo: string;
  errors: string[];
}

export async function previewTeachersCsv(csvText: string): Promise<{ error?: string; rows?: TeacherCsvRow[] }> {
  const { supabase, schoolId } = await requireAdminSchoolId();
  const records = parseCsvWithHeader(csvText);
  if (records.length === 0) return { error: "The file has no data rows." };

  const { data: existingTeachers } = await supabase.from("Teacher").select("staff_id").eq("school_id", schoolId);
  const existingStaffIds = new Set((existingTeachers ?? []).map((t) => t.staff_id).filter(Boolean));
  const seenInFile = new Set<string>();

  const rows: TeacherCsvRow[] = records.map((record, index) => {
    const errors: string[] = [];
    const name = record.name ?? "";
    const staffId = record.staff_id ?? "";
    const contactInfo = record.contact_info ?? "";

    if (!name) errors.push("Name is required");
    if (staffId) {
      if (existingStaffIds.has(staffId)) errors.push(`Staff ID "${staffId}" already exists at this school`);
      if (seenInFile.has(staffId)) errors.push(`Staff ID "${staffId}" is duplicated in this file`);
      seenInFile.add(staffId);
    }

    return { rowNumber: index + 2, name, staffId, contactInfo, errors };
  });

  return { rows };
}

export async function confirmTeachersCsv(rows: TeacherCsvRow[]): Promise<{ error?: string }> {
  if (rows.some((r) => r.errors.length > 0)) {
    return { error: "Fix all row errors before confirming -- no records were created." };
  }

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_bulk_add_teachers", {
    p_rows: rows.map((r) => ({ name: r.name, staff_id: r.staffId || null, contact_info: r.contactInfo || null })),
  });
  if (error) return { error: error.message };

  revalidatePath("/people/teachers");
  return {};
}
