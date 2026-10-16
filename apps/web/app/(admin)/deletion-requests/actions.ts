"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logged } from "@/lib/action-log";

// Doc 28 Section 6: "Admin dashboard gains a Deletion Requests queue
// (parallel to the existing Transfer Requests queue, Doc 13 journey #7)
// for reviewing and actioning enrollment-scoped requests." Only
// enrollment-scoped -- admin_review_deletion_request (migration 047)
// itself refuses a full_platform_erasure row, and
// datadeletionrequest_select_admin_enrollment_scoped (120_consent_
// deletion_retention.sql) already hides those rows from admin entirely,
// so there is nothing here that could even attempt the wrong path.
const ReviewSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["in_review", "completed", "denied"]),
  resolutionNotes: z.string().trim().optional(),
});

export async function reviewDeletionRequest(formData: FormData): Promise<{ error?: string }> {
  return logged("deletionRequests.reviewDeletionRequest", async () => {
    const parsed = ReviewSchema.safeParse({
      requestId: formData.get("requestId"),
      decision: formData.get("decision"),
      resolutionNotes: formData.get("resolutionNotes") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();
    const { error } = await supabase.rpc("admin_review_deletion_request", {
      p_request_id: parsed.data.requestId,
      p_decision: parsed.data.decision,
      p_resolution_notes: parsed.data.resolutionNotes,
    });
    if (error) return { error: error.message };

    revalidatePath("/deletion-requests");
    return {};
  });
}
