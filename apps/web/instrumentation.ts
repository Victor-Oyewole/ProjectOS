import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Doc 3 Section 6: "capturing both client and server errors" -- this is
// the server half, catching errors Next.js's own request lifecycle
// surfaces (not just ones a page's error.tsx boundary sees).
export const onRequestError = Sentry.captureRequestError;
