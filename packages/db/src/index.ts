export { createClient as createBrowserClient } from "./browser-client";
export { createClient as createServerClient } from "./server-client";
export { createAdminClient } from "./admin-client";
export { getSessionClaims } from "./session-claims";
export type { SessionClaims } from "./session-claims";
export { requireAdminSchoolId } from "./require-admin";
export type { Database } from "./generated-types";
