import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// Doc 3 Section 6: "Rate limiting on auth endpoints and bulk operations."
// No specific thresholds are given anywhere in the build pack -- the
// numbers each call site below passes are this session's own inferred
// defaults (generous enough not to inconvenience real usage), same
// treatment as every other doc-silent-on-specifics gap this project has
// flagged rather than guessed at silently. Worth confirming with Alana if
// real abuse patterns ever call for tightening them.
//
// check_rate_limit (migration 054) is a single atomic Postgres function
// (fixed window, upsert-based) -- callable here via the admin/service-role
// client so no anon/authenticated grant is needed for the auth-stage call
// sites (login/register/activate), which run before any session exists.
export async function checkRateLimit(
  admin: SupabaseClient,
  key: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });
  // Fail OPEN, not closed: a rate-limit check that errors (e.g. a transient
  // network blip, see vitest_against_live_supabase's own notes on this
  // project's observed Supabase latency) must never itself block a real
  // user from logging in or registering -- that would turn a safety net
  // into an outage.
  if (error) return true;
  return data === true;
}

// x-forwarded-for can carry a client,proxy1,proxy2 chain -- the first
// entry is the original client. Vercel sets this reliably in production;
// locally (no proxy) it's absent, so every anon request in dev shares one
// bucket -- acceptable for a safety net that only matters in production.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}
