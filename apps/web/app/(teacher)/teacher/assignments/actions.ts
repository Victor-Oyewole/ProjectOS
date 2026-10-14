"use server";

import { requireTeacher } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 13 #1: "Select Class (only classes assigned to this teacher) -> Select
// Subject (only subjects assigned for that class) -> Title -> Instructions
// -> Available date/time -> Due date/time -> [Schedule Assignment]."
// teacher_create_assignment (migration 043) checks the TeacherClassAssignment
// ownership itself and does the Notification fan-out in the same
// transaction -- see that migration's comment for why fan-out happens here
// synchronously rather than through Doc 23 Section 4's background-job
// design.
const AssignmentSchema = z.object({
  classId: z.string().uuid("Select a class"),
  subjectId: z.string().uuid("Select a subject"),
  title: z.string().trim().min(1, "Title is required"),
  instructions: z.string().trim().optional(),
  availableAt: z.string().min(1, "Available date/time is required"),
  dueAt: z.string().optional(),
});

export async function createAssignment(formData: FormData): Promise<{ error?: string }> {
  const parsed = AssignmentSchema.safeParse({
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    instructions: formData.get("instructions") || undefined,
    availableAt: formData.get("availableAt"),
    dueAt: formData.get("dueAt") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await requireTeacher();
  const { error } = await supabase.rpc("teacher_create_assignment", {
    p_class_id: parsed.data.classId,
    p_subject_id: parsed.data.subjectId,
    p_title: parsed.data.title,
    p_instructions: parsed.data.instructions,
    p_available_at: new Date(parsed.data.availableAt).toISOString(),
    p_due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : undefined,
  });
  if (error) return { error: error.message };

  revalidatePath("/teacher/assignments");
  return {};
}

export async function retractAssignment(assignmentId: string): Promise<{ error?: string }> {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.rpc("teacher_retract_assignment", { p_assignment_id: assignmentId });
  if (error) return { error: error.message };

  revalidatePath("/teacher/assignments");
  return {};
}
