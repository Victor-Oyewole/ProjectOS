"use server";

import { requireTeacher } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 13 #3: "Student Grid: Student | Test 1 | Test 2 | Exam... Scores
// recorded per enrollment, entered_by + entered_at logged." Score already
// has complete teacher RLS (060_academic_activity.sql, with_check requiring
// entered_by = auth_teacher_id()) scoped via Assessment -> TeacherClassAssignment,
// so this is a plain client upsert, same reasoning as attendance.
const ScoresSchema = z.object({
  entries: z.array(
    z.object({
      assessmentId: z.string().uuid(),
      enrollmentId: z.string().uuid(),
      value: z.number(),
    }),
  ),
});

export async function saveScores(input: z.infer<typeof ScoresSchema>): Promise<{ error?: string }> {
  const parsed = ScoresSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (parsed.data.entries.length === 0) return { error: "No scores to save." };

  const { supabase, teacherId } = await requireTeacher();
  const { error } = await supabase.from("Score").upsert(
    parsed.data.entries.map((e) => ({
      assessment_id: e.assessmentId,
      enrollment_id: e.enrollmentId,
      value: e.value,
      entered_by: teacherId,
    })),
    { onConflict: "assessment_id,enrollment_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/teacher/scores");
  return {};
}
