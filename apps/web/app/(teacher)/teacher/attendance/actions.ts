"use server";

import { requireTeacher } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Doc 13 #2: "Each student: Present / Absent / Late -> [Submit Attendance]."
// Attendance already has complete RLS for a teacher's own assigned class
// (060_academic_activity.sql) -- insert for new rows, update only within the
// same-day editable_until window -- so this is a plain client upsert, no new
// Postgres function needed (unlike assignment creation, which also has to
// write Notification rows RLS won't let a client write directly).
const AttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().min(1),
  entries: z.array(
    z.object({
      enrollmentId: z.string().uuid(),
      status: z.enum(["Present", "Absent", "Late"]),
    }),
  ),
});

export async function submitAttendance(input: z.infer<typeof AttendanceSchema>): Promise<{ error?: string }> {
  const parsed = AttendanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (parsed.data.entries.length === 0) return { error: "No students to mark." };

  const { supabase, schoolId, teacherId } = await requireTeacher();
  const { error } = await supabase.from("Attendance").upsert(
    parsed.data.entries.map((e) => ({
      class_id: parsed.data.classId,
      teacher_id: teacherId,
      school_id: schoolId,
      enrollment_id: e.enrollmentId,
      date: parsed.data.date,
      status: e.status,
    })),
    { onConflict: "enrollment_id,class_id,date" },
  );
  if (error) return { error: error.message };

  revalidatePath("/teacher/attendance");
  return {};
}
