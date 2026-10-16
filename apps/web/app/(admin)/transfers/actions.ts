"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { StudentCandidate } from "../people/students/actions";
import { logged } from "@/lib/action-log";

// Doc 7's 4-step flow, step 1: the NEW school doesn't have this child
// enrolled yet, so there's no SchoolEnrollment row to search by -- the
// admin finds the right PlatformStudent the same way the "add student"
// flow does (find_platform_student_candidates, Doc 23 Section 2), just
// without ever creating or enrolling anything here.
const SearchStudentSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  dob: z.string().min(1, "Date of birth is required"),
});

export async function searchTransferStudent(
  formData: FormData,
): Promise<{ error?: string; candidates?: StudentCandidate[] }> {
  return logged("transfers.searchTransferStudent", async () => {
    const parsed = SearchStudentSchema.safeParse({ name: formData.get("name"), dob: formData.get("dob") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();
    const { data, error } = await supabase.rpc("find_platform_student_candidates", {
      p_name: parsed.data.name,
      p_dob: parsed.data.dob,
      p_guardian_contacts: [],
    });
    if (error) return { error: error.message };

    // Unlike the "add student" flow, LOW confidence is kept here -- a
    // transfer is explicitly "I believe this child was already at another
    // school," so a looser name/dob match is still worth surfacing rather
    // than hiding (there's no risk of silently creating a duplicate, since
    // this screen never creates a PlatformStudent, only picks an existing one).
    return { candidates: (data ?? []) as StudentCandidate[] };
  });
}

// Doc 7's 4-step flow, step 2: the admin already knows the old school's
// name (the family told them) but School RLS otherwise hides every school
// but their own -- search_schools (migration 049) is the one
// admin-callable lookup that exists for this, by design excluding the
// caller's own school.
const SearchSchoolSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export interface SchoolCandidate {
  school_id: string;
  name: string;
}

export async function searchFromSchool(formData: FormData): Promise<{ error?: string; schools?: SchoolCandidate[] }> {
  return logged("transfers.searchFromSchool", async () => {
    const parsed = SearchSchoolSchema.safeParse({ name: formData.get("name") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();
    const { data, error } = await supabase.rpc("search_schools", { p_name: parsed.data.name });
    if (error) return { error: error.message };

    return { schools: (data ?? []) as SchoolCandidate[] };
  });
}

// Doc 7's 4-step flow, step 3: submitting needs no new function --
// transferrequest_insert_admin_new_school (080_transfers.sql) already
// permits a plain client insert from the requesting (to) school's admin.
export async function submitTransferRequest(
  platformStudentId: string,
  fromSchoolId: string,
): Promise<{ error?: string }> {
  return logged("transfers.submitTransferRequest", async () => {
    const { supabase, schoolId, adminId } = await requireAdminSchoolId();
    if (fromSchoolId === schoolId) return { error: "The releasing school can't be your own school." };

    const { error } = await supabase.from("TransferRequest").insert({
      platform_student_id: platformStudentId,
      from_school_id: fromSchoolId,
      to_school_id: schoolId,
      requested_by: adminId,
    });
    if (error) return { error: error.message };

    revalidatePath("/transfers");
    return {};
  });
}

// Doc 7's 4-step flow, step 4 / Doc 13 #7 Screen 2-3: the releasing
// school's admin selects which record categories to release and
// approves or denies. "Appropriate teacher comments" from Doc 7's record
// list is deliberately not an option here -- see migration 049's comment:
// admin has zero visibility into DailyNote (Doc 23 Sec 6), so there's no
// way for them to judge which comments are "appropriate" to release.
const IncludedRecordsSchema = z.object({
  enrollment_history: z.boolean(),
  attendance_summary: z.boolean(),
  term_results: z.boolean(),
  certificates: z.boolean(),
});

const ApproveSchema = z.object({
  requestId: z.string().uuid(),
  notes: z.string().trim().optional(),
});

export async function approveTransferRequest(formData: FormData): Promise<{ error?: string }> {
  return logged("transfers.approveTransferRequest", async () => {
    const parsed = ApproveSchema.safeParse({
      requestId: formData.get("requestId"),
      notes: formData.get("notes") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const included = IncludedRecordsSchema.parse({
      enrollment_history: formData.get("enrollment_history") === "on",
      attendance_summary: formData.get("attendance_summary") === "on",
      term_results: formData.get("term_results") === "on",
      certificates: formData.get("certificates") === "on",
    });
    if (!Object.values(included).some(Boolean)) {
      return { error: "Select at least one record category to release." };
    }

    const { supabase } = await requireAdminSchoolId();
    const { error } = await supabase.rpc("admin_approve_transfer_request", {
      p_request_id: parsed.data.requestId,
      p_included_records: included,
      p_notes: parsed.data.notes,
    });
    if (error) return { error: error.message };

    revalidatePath("/transfers");
    revalidatePath(`/transfers/${parsed.data.requestId}`);
    return {};
  });
}

// Doc 13 #7 Screen 3: "On deny: request closed, reason optional."
const DenySchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

export async function denyTransferRequest(formData: FormData): Promise<{ error?: string }> {
  return logged("transfers.denyTransferRequest", async () => {
    const parsed = DenySchema.safeParse({
      requestId: formData.get("requestId"),
      reason: formData.get("reason") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();
    const { error } = await supabase.rpc("admin_deny_transfer_request", {
      p_request_id: parsed.data.requestId,
      p_reason: parsed.data.reason,
    });
    if (error) return { error: error.message };

    revalidatePath("/transfers");
    revalidatePath(`/transfers/${parsed.data.requestId}`);
    return {};
  });
}
