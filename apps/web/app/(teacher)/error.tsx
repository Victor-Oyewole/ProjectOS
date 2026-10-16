"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorState } from "@schoolos/ui";

// See apps/web/app/(admin)/error.tsx for the full rationale -- same
// Next.js route-segment error-boundary convention, scoped to every
// teacher screen.
export default function TeacherError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
      <ErrorState message="Something went wrong loading this page." onRetry={reset} />
    </main>
  );
}
