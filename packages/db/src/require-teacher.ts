import { createClient as createServerClient } from "./server-client";
import { getSessionClaims } from "./session-claims";

// Teacher-side counterpart to requireAdminSchoolId -- same reasoning: every
// teacher-only Server Action assumes the page-level guard already redirected
// anyone else, so a throw here means something more surprising happened.
export async function requireTeacher() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "teacher" || !claims.school_id || !claims.teacher_id) {
    throw new Error("Not signed in as a teacher.");
  }
  return { supabase, schoolId: claims.school_id, teacherId: claims.teacher_id };
}
