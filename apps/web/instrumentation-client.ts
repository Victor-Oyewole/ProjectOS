import * as Sentry from "@sentry/nextjs";

// Doc 3 Section 6 / Doc 21 Section 7 (Monitoring & Observability): "Error
// tracking: Sentry, capturing both client and server errors." No DSN set
// (NEXT_PUBLIC_SENTRY_DSN, see .env.example) -- the SDK no-ops silently,
// so this is safe to ship even before a real Sentry project exists.
// tracesSampleRate is this session's own conservative default (not
// specified anywhere in the build pack) -- revisit once real traffic
// volume is known.
//
// Deliberately NOT using session replay (Sentry.replayIntegration()) --
// it was tried, measured, and reverted: it roughly doubled this app's
// shared JS bundle (~103kB -> ~211kB First Load JS across every route),
// a real cost against Doc 3's own performance targets ("LCP < 2.5s on
// simulated mid-tier Android, 3G throttling... engineering discipline
// applied to perceived performance" for the Nigerian market specifically).
// Doc 3 Section 6 only ever asks for "capturing... errors," not replay --
// adding it was this session's own initiative, not something asked for,
// and the weight isn't worth it unobserved. Revisit only if debugging a
// real production issue genuinely needs it, as an opt-in, not a default.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
