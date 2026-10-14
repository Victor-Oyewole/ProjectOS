"use server";

import { requireTeacher } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 8: "Free-form text from a teacher about a specific student... One-way
// -- no reply thread in V1... Immutable once sent -- corrections are new
// notes, not edits." DailyNote already has complete teacher-insert RLS
// (070_notifications.sql, scoped via ClassMembership + TeacherClassAssignment)
// and is immutable at the DB level via a trigger, so this is a plain client
// insert, same reasoning as attendance/scores.
const DailyNoteSchema = z.object({
  enrollmentId: z.string().uuid("Select a student"),
  category: z.enum(["health", "behavior", "academic", "general"]),
  noteText: z.string().trim().min(1, "Note text is required"),
});

export async function sendDailyNote(formData: FormData): Promise<{ error?: string }> {
  const parsed = DailyNoteSchema.safeParse({
    enrollmentId: formData.get("enrollmentId"),
    category: formData.get("category"),
    noteText: formData.get("noteText"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, teacherId } = await requireTeacher();
  const { error } = await supabase.from("DailyNote").insert({
    enrollment_id: parsed.data.enrollmentId,
    teacher_id: teacherId,
    category: parsed.data.category,
    note_text: parsed.data.noteText,
  });
  if (error) return { error: error.message };

  revalidatePath("/teacher/daily-notes");
  return {};
}
