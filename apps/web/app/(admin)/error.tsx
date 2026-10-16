"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorState } from "@schoolos/ui";

// Doc 19 Section 1 (Error state): "Human-readable message..., with a
// retry action where applicable." Next.js's own error-boundary convention
// (one error.tsx per route segment, auto-wrapped around every page below
// it) is the right way to cover every admin screen's render/data-fetch
// errors with a single file, rather than hand-wrapping each of the ~20
// admin pages individually. `reset()` re-renders the segment -- the
// closest equivalent to Doc 19's "retry" for a Server Component that
// doesn't have its own client-side refetch to call.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Doc 19 Section 1 also requires "errors logged to monitoring (Doc
    // 20) regardless of what's shown to the user" -- Milestone 7 added
    // Sentry (apps/web/instrumentation-client.ts); role/school_id context
    // is attached globally by <SentryUserContext> in the root layout, not
    // here, so every capture across the app carries it consistently.
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
      <ErrorState message="Something went wrong loading this page." onRetry={reset} />
    </main>
  );
}
