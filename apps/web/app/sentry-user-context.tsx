"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { createBrowserClient, getSessionClaims } from "@schoolos/db";

// Doc 3 Section 6: "capturing both client and server errors, with user
// role/school_id attached as context (never PII beyond what's necessary
// for debugging)." Deliberately tags app_role/school_id/the relevant
// person/admin/teacher id only -- never an email, name, or anything else
// from the JWT that would count as PII. Mounted once in the root layout
// rather than per error boundary, so every capture (error.tsx, global-
// error.tsx, server-side via instrumentation.ts) is consistently tagged
// without each one re-deriving it.
export function SentryUserContext() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createBrowserClient();
      const claims = await getSessionClaims(supabase);
      if (cancelled || !claims?.app_role) return;

      Sentry.setTags({
        app_role: claims.app_role,
        school_id: claims.school_id ?? null,
      });
      Sentry.setUser({
        id: claims.admin_id ?? claims.teacher_id ?? claims.person_id ?? claims.platform_admin_id ?? undefined,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
