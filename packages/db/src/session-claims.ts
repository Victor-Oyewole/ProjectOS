import type { SupabaseClient } from "@supabase/supabase-js";

// The role/school_id claims custom_access_token_hook injects (migration 011,
// fixed in 029) live in the JWT payload itself, not in the User object
// auth.getUser() returns -- decode the session's access_token to read them.
// This is a UI-routing convenience, not the security boundary: RLS at the
// DB layer is what actually enforces access (Doc 3 Section 1), so a client
// trusting a stale/decoded claim here can at worst show the wrong screen,
// never read data it shouldn't.
export interface SessionClaims {
  app_role?: "platform_admin" | "admin" | "teacher" | "family";
  school_id?: string;
  admin_id?: string;
  teacher_id?: string;
  person_id?: string;
  membership_id?: string;
  platform_admin_id?: string;
}

export async function getSessionClaims(supabase: SupabaseClient): Promise<SessionClaims | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const payload = session.access_token.split(".")[1];
  if (!payload) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64").toString());
  } catch {
    return null;
  }
}
