import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./generated-types";

// For Server Components, Server Actions, and Route Handlers. Reads/writes
// the session via Next.js's cookie store -- the RLS-scoped session this
// app's Server Actions are supposed to call Supabase with (Doc 23 Section
// 1 step 4: "Server Action calls Supabase client with the user's session").
// Next.js 15's cookies() is async, so this must be too.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, which can't set cookies --
            // safe to ignore as long as middleware refreshes the session
            // (no middleware yet; revisit if session refresh issues show up).
          }
        },
      },
    },
  );
}
