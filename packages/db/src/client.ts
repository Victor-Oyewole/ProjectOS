// Browser-safe subset of this package's exports, for Client Components.
// The main barrel (./index.ts) also re-exports server-client.ts, which
// imports "next/headers" -- pulling that into a Client Component's bundle
// fails the build ("next/headers" is server-only), even if the component
// never actually calls createServerClient itself. Import from
// "@schoolos/db/client" instead of "@schoolos/db" in any Client Component
// that needs createBrowserClient/getSessionClaims.
export { createClient as createBrowserClient } from "./browser-client";
export { getSessionClaims } from "./session-claims";
export type { SessionClaims } from "./session-claims";
