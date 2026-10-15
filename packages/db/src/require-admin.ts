import { createClient as createServerClient } from "./server-client";
import { getSessionClaims } from "./session-claims";

// Shared by every admin-only Server Action (academic setup, people setup,
// ...). Throws rather than returning an error shape -- these are called
// from actions.ts files that already assume a valid admin session got them
// this far (the page-level auth guard already redirected anyone else), so
// a throw here means something more surprising happened (e.g. a stale
// session) and should surface as a real error, not a quiet form message.
export async function requireAdminSchoolId() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin" || !claims.school_id || !claims.admin_id) {
    throw new Error("Not signed in as a school admin.");
  }
  return { supabase, schoolId: claims.school_id, adminId: claims.admin_id };
}
