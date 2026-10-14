import { createClient as createServerClient } from "./server-client";
import { getSessionClaims } from "./session-claims";

// Family-side counterpart to requireAdminSchoolId/requireTeacher -- same
// reasoning: every family-only Server Action assumes the page-level guard
// already redirected anyone else.
export async function requireFamily() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "family" || !claims.school_id || !claims.membership_id) {
    throw new Error("Not signed in as a family member.");
  }
  return { supabase, schoolId: claims.school_id, membershipId: claims.membership_id };
}
