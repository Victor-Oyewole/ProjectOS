import { createServerClient, getSessionClaims, type SessionClaims } from "@schoolos/db";

// Doc 3 Section 6: "Structured logging: JSON logs for all Server Actions
// and background jobs, including: actor, action, school_id, duration,
// outcome." Scoped tonight to the auth-stage actions already touched for
// rate limiting (login/register/activate) -- Doc 3 pairs "rate limiting
// on auth endpoints" with this requirement in the same bullet, and
// wrapping dozens of OTHER Server Actions safely needs a pattern this
// session can't live-test (see project memory for the two options
// considered and why both were deferred for everything beyond these
// three). console.log here is deliberate, not a placeholder -- Vercel's
// own log drain captures stdout in production already, satisfying "JSON
// logs... from day one" with no extra infrastructure.
//
// Call sites wrap their ENTIRE existing function body, unchanged, inside
// an inner `run()` closure and call logAction from the outer function's
// try/catch -- never as a wrapping higher-order function around the
// exported Server Action itself, which would change its literal export
// shape (a real risk to Next's "use server" reference generation that
// this session can't verify without a live form submission).
export async function logAction(
  action: string,
  startedAt: number,
  outcome: "success" | "error",
  claims?: SessionClaims | null,
): Promise<void> {
  console.log(
    JSON.stringify({
      action,
      actor: claims?.admin_id ?? claims?.teacher_id ?? claims?.person_id ?? claims?.platform_admin_id ?? null,
      school_id: claims?.school_id ?? null,
      duration_ms: Date.now() - startedAt,
      outcome,
    }),
  );
}

// Generic wrapper for every OTHER Server Action (not login/register/
// activate, which establish the session mid-function and need the more
// careful run()-and-log-the-result-shape treatment those three got) --
// the session already exists before any of these run (they all start
// with requireAdminSchoolId()/requireTeacher()/requireFamily()), so
// claims can be fetched once, before `fn` even runs. Wrap just the
// `return` statement, e.g. `return logged("admins.addSecondAdmin", () =>
// { ...original body... });` -- the exported function's own literal
// shape is untouched either way, same safety property as run().
export async function logged<T>(action: string, fn: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  const claims = await getSessionClaims(await createServerClient()).catch(() => null);

  try {
    const result = await fn();
    const outcome =
      result && typeof result === "object" && "error" in result && (result as { error?: unknown }).error
        ? "error"
        : "success";
    await logAction(action, startedAt, outcome, claims);
    return result;
  } catch (err) {
    await logAction(action, startedAt, isNextRedirect(err) ? "success" : "error", claims);
    throw err;
  }
}

// Next's redirect() throws an Error whose `.digest` starts with
// "NEXT_REDIRECT" to unwind the render -- there's no stable public API
// for detecting this (next/navigation doesn't export isRedirectError in
// the version this project pins), so this checks the documented digest
// shape directly rather than reaching into next/dist internals.
export function isNextRedirect(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
