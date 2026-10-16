import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // @schoolos/db ships plain TypeScript source (no build step) -- Next.js
  // needs to transpile it itself rather than treating it as pre-built JS.
  transpilePackages: ["@schoolos/db", "@schoolos/ui"],
};

// Doc 3 Section 6: error tracking. Source-map upload (needs org/project +
// SENTRY_AUTH_TOKEN) is skipped entirely without those env vars set --
// `silent: true` just suppresses the wizard's own build-time log noise
// either way, it doesn't affect whether errors get reported at runtime
// (that's instrumentation-client.ts/sentry.server.config.ts, gated on
// NEXT_PUBLIC_SENTRY_DSN instead).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
