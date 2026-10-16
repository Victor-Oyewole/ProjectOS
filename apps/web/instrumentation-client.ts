import * as Sentry from "@sentry/nextjs";

// Doc 3 Section 6 / Doc 21 Section 7 (Monitoring & Observability): "Error
// tracking: Sentry, capturing both client and server errors." No DSN set
// (NEXT_PUBLIC_SENTRY_DSN, see .env.example) -- the SDK no-ops silently,
// so this is safe to ship even before a real Sentry project exists.
//
// Deliberately error-capture-only, nothing more -- Doc 3 Section 6 only
// ever asks for "capturing... errors," never performance tracing or
// replay, both of which cost real weight against Doc 3's own "LCP <
// 2.5s on simulated mid-tier Android, 3G throttling... engineering
// discipline applied to perceived performance" target for the Nigerian
// market specifically. Measured, not assumed:
// - Session replay (Sentry.replayIntegration()): ~103kB -> ~211kB First
//   Load JS across every route. Reverted.
// - A bare Sentry.init({ dsn }) with nothing else (this config, no
//   tracesSampleRate, no integrations): ~103kB -> ~170kB. This ~65kB is
//   the SDK's own irreducible core (error capture, breadcrumbs, context) --
//   adding/removing tracesSampleRate made no measurable difference either
//   way, so that was never the source of the earlier 211kB number; replay
//   was. This ~170kB is accepted as the real, necessary cost of satisfying
//   Doc 3's actual error-tracking requirement, not something to keep
//   chasing down further.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
