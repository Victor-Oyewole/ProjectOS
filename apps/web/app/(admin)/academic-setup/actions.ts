"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 12 Step 2: Academic Setup. All four creates are ordinary RLS-scoped
// inserts (academicsession_all_admin / term_all_admin / class_all_admin /
// subject_all_admin in 020_school_structure.sql already permit
// auth_app_role() = 'admin' AND school_id = auth_school_id()) -- unlike
// registration, no SECURITY DEFINER bootstrap function is needed here, the
// admin already has a real session by this point.

const SessionSchema = z.object({
  name: z.string().trim().min(1, "Session name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export async function createAcademicSession(formData: FormData): Promise<{ error?: string }> {
  const parsed = SessionSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, schoolId } = await requireAdminSchoolId();
  const { error } = await supabase.from("AcademicSession").insert({
    school_id: schoolId,
    name: parsed.data.name,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
  });
  if (error) return { error: error.message };

  revalidatePath("/academic-setup");
  return {};
}

const TermSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().trim().min(1, "Term name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export async function createTerm(formData: FormData): Promise<{ error?: string }> {
  const parsed = TermSchema.safeParse({
    sessionId: formData.get("sessionId"),
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.from("Term").insert({
    session_id: parsed.data.sessionId,
    name: parsed.data.name,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
  });
  if (error) return { error: error.message };

  revalidatePath("/academic-setup");
  return {};
}

const NameOnlySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export async function createClass(formData: FormData): Promise<{ error?: string }> {
  const parsed = NameOnlySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, schoolId } = await requireAdminSchoolId();
  const { error } = await supabase.from("Class").insert({ school_id: schoolId, name: parsed.data.name });
  if (error) return { error: error.message };

  revalidatePath("/academic-setup");
  return {};
}

export async function createSubject(formData: FormData): Promise<{ error?: string }> {
  const parsed = NameOnlySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, schoolId } = await requireAdminSchoolId();
  const { error } = await supabase.from("Subject").insert({ school_id: schoolId, name: parsed.data.name });
  if (error) return { error: error.message };

  revalidatePath("/academic-setup");
  return {};
}
