"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

// Catches errors that escape even the root layout itself -- the four
// route-segment error.tsx boundaries (app/error.tsx, (admin)/(family)/
// (teacher)/error.tsx) handle everything else; this is Next.js's
// documented last resort, required by the Sentry Next.js SDK to capture
// that remaining sliver. Deliberately uses next/error's plain built-in
// fallback (inline styles, no Tailwind) rather than this app's own
// ErrorState/design tokens -- global-error replaces the ENTIRE document
// including <head>, so the app's own CSS pipeline can't be assumed to
// have loaded if something this fundamental broke.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
