import * as Sentry from "@sentry/nextjs";

// Doc 3 Section 6 / Doc 21 Section 7 (Monitoring & Observability): "Error
// tracking: Sentry, capturing both client and server errors." No DSN set
// (NEXT_PUBLIC_SENTRY_DSN, see .env.example) -- the SDK no-ops silently,
// so this is safe to ship even before a real Sentry project exists.
// tracesSampleRate/replay rates are this session's own conservative
// defaults (not specified anywhere in the build pack) -- revisit once
// real traffic volume is known.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
