"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 27 Section 5's five-step lifecycle (compute/compile -> review ->
// finalize -> publish, plus reopen), driven from the admin's new report
// card screen. Every RPC here is already fully built and verified
// (migration 046) -- this file is just the thin Server Action wrapper the
// UI calls, same shape as transfers/actions.ts's approve/deny wrappers.

const ClassTermSchema = z.object({
  classId: z.string().uuid("Select a class"),
  termId: z.string().uuid("Select a term"),
});

function parseClassTerm(formData: FormData) {
  return ClassTermSchema.safeParse({
    classId: formData.get("classId"),
    termId: formData.get("termId"),
  });
}

export async function computeTermResults(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseClassTerm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_compute_term_results", {
    p_class_id: parsed.data.classId,
    p_term_id: parsed.data.termId,
  });
  if (error) return { error: error.message };

  revalidatePath("/results");
  return {};
}

export async function compileNarrativeReports(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseClassTerm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_compile_narrative_reports", {
    p_class_id: parsed.data.classId,
    p_term_id: parsed.data.termId,
  });
  if (error) return { error: error.message };

  revalidatePath("/results");
  return {};
}

export async function finalizeClassTerm(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseClassTerm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_finalize_class_term", {
    p_class_id: parsed.data.classId,
    p_term_id: parsed.data.termId,
  });
  if (error) return { error: error.message };

  revalidatePath("/results");
  return {};
}

export async function publishClassTerm(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseClassTerm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_publish_class_term", {
    p_class_id: parsed.data.classId,
    p_term_id: parsed.data.termId,
  });
  if (error) return { error: error.message };

  revalidatePath("/results");
  return {};
}

const IdSchema = z.object({ id: z.string().uuid() });

export async function reopenTermResult(formData: FormData): Promise<{ error?: string }> {
  const parsed = IdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_reopen_term_result", { p_term_result_id: parsed.data.id });
  if (error) return { error: error.message };

  revalidatePath("/results");
  return {};
}

export async function reopenTermReport(formData: FormData): Promise<{ error?: string }> {
  const parsed = IdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("admin_reopen_term_report", { p_report_id: parsed.data.id });
  if (error) return { error: error.message };

  revalidatePath("/results");
  return {};
}
