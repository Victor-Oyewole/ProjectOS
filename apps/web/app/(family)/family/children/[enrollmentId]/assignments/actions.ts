"use server";

import { requireFamily } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MarkSchema = z.object({
  assignmentId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  status: z.enum(["Viewed", "Acknowledged"]),
});

export async function markAssignmentStatus(input: z.infer<typeof MarkSchema>): Promise<{ error?: string }> {
  const parsed = MarkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireFamily();
  const { error } = await supabase.rpc("family_mark_assignment_status", {
    p_assignment_id: parsed.data.assignmentId,
    p_enrollment_id: parsed.data.enrollmentId,
    p_status: parsed.data.status,
  });
  if (error) return { error: error.message };

  revalidatePath(`/family/children/${parsed.data.enrollmentId}/assignments`);
  return {};
}
