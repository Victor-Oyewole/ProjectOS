import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./generated-types";

// For Client Components. Session lives in cookies (set by the server
// client/middleware), not localStorage -- Doc 23 Section 4: "JWT stored in
// httpOnly cookie (not localStorage -- XSS mitigation)".
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
