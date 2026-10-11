import { createClient } from "@supabase/supabase-js";
import type { Database } from "./generated-types";

// Service-role client -- bypasses RLS entirely. Server-only: never import
// this into a Client Component or anything that ships to the browser. Used
// where a flow legitimately needs to act before the caller has any RLS-
// visible identity yet (e.g. creating the admin's auth user with
// email_confirm skipped during school registration, mirroring how
// tests/fixtures.ts seeds QA users) -- not a general-purpose escape hatch
// from RLS in ordinary request handling.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
