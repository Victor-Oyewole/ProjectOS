"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
}

const ClassIdSchema = z.string().uuid().optional();

async function enrollStudent(platformStudentId: string, schoolId: string, classId?: string | null) {
  const { supabase } = await requireAdminSchoolId();

  // A confirmed identity match can point at a student already enrolled
  // here -- the common case being "admin re-adds a student who's already
  // in the system" (Doc 23 Section 2's whole point). Reuse the existing
  // active enrollment rather than creating a second one for the same
  // (platform_student_id, school_id) pair; idx_schoolenrollment_one_active_per_school
  // (migration 036) also enforces this at the DB level as a backstop.
  const { data: existing } = await supabase
    .from("SchoolEnrollment")
    .select("enrollment_id")
    .eq("platform_student_id", platformStudentId)
    .eq("school_id", schoolId)
    .eq("status", "Active")
    .maybeSingle();

  let enrollment = existing;
  if (!enrollment) {
    const { data: created, error: enrollError } = await supabase
      .from("SchoolEnrollment")
      .insert({
        platform_student_id: platformStudentId,
        school_id: schoolId,
        start_date: new Date().toISOString().slice(0, 10),
        status: "Active",
      })
      .select("enrollment_id")
      .single();
    if (enrollError) return { error: enrollError.message };
    enrollment = created;
  }

  if (classId) {
    const { data: klass } = await supabase.from("Class").select("class_id").eq("class_id", classId).maybeSingle();
    const { data: session } = await supabase
      .from("AcademicSession")
      .select("session_id")
      .eq("school_id", schoolId)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (klass && session) {
      // Same reuse-not-duplicate reasoning as the enrollment above: a
      // reused enrollment can already have this class membership.
      const { data: existingMembership } = await supabase
        .from("ClassMembership")
        .select("membership_id")
        .eq("enrollment_id", enrollment.enrollment_id)
        .eq("class_id", klass.class_id)
        .maybeSingle();
      if (!existingMembership) {
        const { error: membershipError } = await supabase.from("ClassMembership").insert({
          enrollment_id: enrollment.enrollment_id,
          class_id: klass.class_id,
          academic_session_id: session.session_id,
          start_date: new Date().toISOString().slice(0, 10),
        });
        if (membershipError) return { error: membershipError.message };
      }
    }
  }

  revalidatePath("/people/students");
  return {};
}

export async function createNewStudent(
  name: string,
  dob: string,
  classId?: string | null,
): Promise<{ error?: string }> {
  const parsedClassId = ClassIdSchema.safeParse(classId ?? undefined);
  const { supabase, schoolId } = await requireAdminSchoolId();

  const { data: platformStudentId, error } = await supabase.rpc("resolve_or_create_platform_student", {
    p_name: name,
    p_dob: dob,
    p_decision: "new",
  });
  if (error) return { error: error.message };

  return enrollStudent(platformStudentId, schoolId, parsedClassId.data);
}

export async function confirmStudentMatch(
  matchedPlatformStudentId: string,
  name: string,
  dob: string,
  classId?: string | null,
): Promise<{ error?: string }> {
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
}
