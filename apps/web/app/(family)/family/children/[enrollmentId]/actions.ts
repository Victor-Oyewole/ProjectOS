"use server";

import { requireFamily } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logged } from "@/lib/action-log";

// Doc 28 Section 6: "Family dashboard gains a 'Request Data Deletion'
// action under account/profile settings." No settings/profile page exists
// in this app yet, and the request itself (family_request_deletion,
// migration 047) is inherently per-enrollment (platform_student_id +
// school_id) -- the child's own Overview tab is the natural, already-
// scoped place for this rather than inventing a generic settings section
// for a single action. Only enrollment-scoped requests are submittable by
// family (Doc 28 Section 5): full-platform-erasure is Platform Admin only,
// and Platform Admin tooling is explicitly Deferred to Post-V1 (Doc 16),
// so there is no UI anywhere in this app for that path, by design.
const RequestDeletionSchema = z.object({
  enrollmentId: z.string().uuid(),
});

export async function requestDataDeletion(formData: FormData): Promise<{ error?: string }> {
  return logged("family.children.requestDataDeletion", async () => {
    const parsed = RequestDeletionSchema.safeParse({ enrollmentId: formData.get("enrollmentId") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireFamily();

    const { data: enrollment, error: fetchError } = await supabase
      .from("SchoolEnrollment")
      .select("platform_student_id")
      .eq("enrollment_id", parsed.data.enrollmentId)
      .maybeSingle();
    if (fetchError) return { error: fetchError.message };
    if (!enrollment) return { error: "Enrollment not found." };

    const { error } = await supabase.rpc("family_request_deletion", {
      p_platform_student_id: enrollment.platform_student_id,
      p_school_id: schoolId,
    });
    if (error) return { error: error.message };

    revalidatePath(`/family/children/${parsed.data.enrollmentId}`);
    return {};
  });
}
