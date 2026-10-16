"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseCsvWithHeader } from "@/lib/csv";
import { logged } from "@/lib/action-log";

// Doc 12 Step 4, Students tab. Two-phase flow matching Doc 23 Section 2's
// identity-matching workflow: search first (never silently assume a name
// match means the same child, never silently assume no match means a new
// one), then resolve. Guardian-contact overlap is left out of the manual
// form for now -- at this point in onboarding the admin may not have
// entered the family yet, and Doc 23 Section 2's match tiers already
// degrade sensibly without it (DOB + name alone can still produce a
// MEDIUM-confidence match worth flagging).

const SearchSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  dob: z.string().min(1, "Date of birth is required"),
});

export interface StudentCandidate {
  platform_student_id: string;
  name: string;
  dob: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export async function searchStudentCandidates(
  formData: FormData,
): Promise<{ error?: string; name?: string; dob?: string; candidates?: StudentCandidate[] }> {
  return logged("people.students.searchStudentCandidates", async () => {
    const parsed = SearchSchema.safeParse({ name: formData.get("name"), dob: formData.get("dob") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();
    const { data, error } = await supabase.rpc("find_platform_student_candidates", {
      p_name: parsed.data.name,
      p_dob: parsed.data.dob,
      p_guardian_contacts: [],
    });
    if (error) return { error: error.message };

    // LOW-confidence matches are the normal "probably just a similar name"
    // case (Doc 23 Section 2): only surface MEDIUM/HIGH for admin review.
    const candidates = (data ?? []).filter((c) => c.confidence !== "LOW") as StudentCandidate[];
    return { name: parsed.data.name, dob: parsed.data.dob, candidates };
  });
}

const ClassIdSchema = z.string().uuid().optional();

// enroll_student_in_school (migration 041) -- shared with the CSV bulk
// import path, which needed the same reuse-not-duplicate logic as one
// atomic SQL function rather than duplicating it in TypeScript (the
// previous version of this function) a second time. Not itself exported,
// so not a Server Action -- not wrapped in logged() directly; its two
// callers below are.
async function enrollStudent(platformStudentId: string, schoolId: string, classId?: string | null) {
  const { supabase } = await requireAdminSchoolId();
  const { error } = await supabase.rpc("enroll_student_in_school", {
    p_platform_student_id: platformStudentId,
    p_school_id: schoolId,
    p_class_id: classId ?? undefined,
  });
  if (error) return { error: error.message };

  revalidatePath("/people/students");
  return {};
}

export async function createNewStudent(
  name: string,
  dob: string,
  classId?: string | null,
): Promise<{ error?: string }> {
  return logged("people.students.createNewStudent", async () => {
    const parsedClassId = ClassIdSchema.safeParse(classId ?? undefined);
    const { supabase, schoolId } = await requireAdminSchoolId();

    const { data: platformStudentId, error } = await supabase.rpc("resolve_or_create_platform_student", {
      p_name: name,
      p_dob: dob,
      p_decision: "new",
    });
    if (error) return { error: error.message };

    return enrollStudent(platformStudentId, schoolId, parsedClassId.data);
  });
}

export async function confirmStudentMatch(
  matchedPlatformStudentId: string,
  name: string,
  dob: string,
  classId?: string | null,
): Promise<{ error?: string }> {
  return logged("people.students.confirmStudentMatch", async () => {
    const parsedClassId = ClassIdSchema.safeParse(classId ?? undefined);
    const { supabase, schoolId } = await requireAdminSchoolId();

    const { data: platformStudentId, error } = await supabase.rpc("resolve_or_create_platform_student", {
      p_name: name,
      p_dob: dob,
      p_decision: "confirm_match",
      p_matched_platform_student_id: matchedPlatformStudentId,
    });
    if (error) return { error: error.message };

    return enrollStudent(platformStudentId, schoolId, parsedClassId.data);
  });
}

// Doc 12 Step 4, Students "[Bulk Import CSV]". Columns: name, dob (required),
// class (optional, matched by name against this school's existing Classes --
// "Student CSV import maps to Classes if a class column is included," Doc
// 12). An unmatched class name is a WARNING, not a blocking error ("Missing
// referenced entities... flagged as warning with inline resolution option,"
// Doc 12) -- the row still imports, just without a class assignment.
//
// Doc 23 Section 2's identity-matching workflow applies per row: HIGH/MEDIUM
// candidates must be surfaced for explicit admin confirm-or-reject right in
// the preview table (Doc 12: "matches requiring admin review are surfaced in
// the CSV preview UI... not processed silently in the batch insert"), so
// `decision` starts null for those rows and confirmStudentsCsv refuses to
// run until every row has one.
export interface StudentCsvRow {
  rowNumber: number;
  name: string;
  dob: string;
  className: string;
  classId: string | null;
  errors: string[];
  warnings: string[];
  candidates: StudentCandidate[];
  decision: "new" | "confirm_match" | null;
  matchedPlatformStudentId: string | null;
}

export async function previewStudentsCsv(
  csvText: string,
): Promise<{ error?: string; rows?: StudentCsvRow[] }> {
  return logged("people.students.previewStudentsCsv", async () => {
    const { supabase, schoolId } = await requireAdminSchoolId();
    const records = parseCsvWithHeader(csvText);
    if (records.length === 0) return { error: "The file has no data rows." };

    const { data: classes } = await supabase.from("Class").select("class_id, name").eq("school_id", schoolId);
    const classByName = new Map((classes ?? []).map((c) => [c.name.trim().toLowerCase(), c.class_id]));

    const rows: StudentCsvRow[] = [];
    for (const [index, record] of records.entries()) {
      const errors: string[] = [];
      const warnings: string[] = [];
      const name = record.name ?? "";
      const dob = record.dob ?? "";
      const className = record.class ?? "";

      if (!name) errors.push("name is required");
      if (!dob) errors.push("dob is required");

      let classId: string | null = null;
      if (className) {
        const matched = classByName.get(className.trim().toLowerCase());
        if (matched) classId = matched;
        else warnings.push(`Class "${className}" not found -- row will import without a class`);
      }

      let candidates: StudentCandidate[] = [];
      let decision: "new" | "confirm_match" | null = "new";
      if (name && dob) {
        const { data, error } = await supabase.rpc("find_platform_student_candidates", {
          p_name: name,
          p_dob: dob,
          p_guardian_contacts: [],
        });
        if (error) {
          errors.push(error.message);
        } else {
          candidates = (data ?? []).filter((c) => c.confidence !== "LOW") as StudentCandidate[];
          if (candidates.length > 0) decision = null;
        }
      }

      rows.push({
        rowNumber: index + 2,
        name,
        dob,
        className,
        classId,
        errors,
        warnings,
        candidates,
        decision,
        matchedPlatformStudentId: null,
      });
    }

    return { rows };
  });
}

export async function confirmStudentsCsv(rows: StudentCsvRow[]): Promise<{ error?: string }> {
  return logged("people.students.confirmStudentsCsv", async () => {
    if (rows.some((r) => r.errors.length > 0)) {
      return { error: "Fix all row errors before confirming -- no records were created." };
    }
    if (rows.some((r) => r.decision === null)) {
      return { error: "Resolve every ambiguous match before confirming -- no records were created." };
    }

    const { supabase } = await requireAdminSchoolId();
    const { error } = await supabase.rpc("admin_bulk_add_students", {
      p_rows: rows.map((r) => ({
        name: r.name,
        dob: r.dob,
        decision: r.decision,
        matched_platform_student_id: r.matchedPlatformStudentId,
        class_id: r.classId,
      })),
    });
    if (error) return { error: error.message };

    revalidatePath("/people/students");
    return {};
  });
}
