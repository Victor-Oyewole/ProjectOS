import * as Sentry from "@sentry/nextjs";

// Error-capture-only, same reasoning as instrumentation-client.ts: Doc 3
// Section 6 asks for error tracking, not performance tracing.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
