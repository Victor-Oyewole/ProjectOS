// Doc 12 Step 1 / Doc 24 Section 2, Milestone 1 (Doc 16): a school admin
// can self-register without engineering intervention. Exercises the real
// register_school() function (migration 034) end to end: a brand-new
// Supabase Auth user (no app_role claim yet) signs up, calls
// register_school, then signs in again and should have a working
// admin/school_id claim via the existing custom_access_token_hook.
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient } from "./fixtures";
import { withNetworkRetry } from "./network-retry";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const FIXTURE_PASSWORD = "Qa-Fixture-Pw-1!";

// Unique per run -- registration itself must work repeatedly, not just
// once, so this can't reuse a fixed email (Supabase Auth emails are
// globally unique) or a fixed school name (would collide across runs on
// the "already registered" check once the first run's user persists).
const email = `qa-registration-${crypto.randomUUID()}@schoolos-test.invalid`;
const schoolName = `QA Registration Test School ${crypto.randomUUID()}`;

let admin: ReturnType<typeof adminClient>;
let newSchoolId: string;
let newAdminAuthUserId: string;

beforeAll(async () => {
  admin = adminClient();
});

describe("school self-registration", () => {
  it("signing up, then calling register_school, creates School + Subscription + SchoolAdmin together", async () => {
    // ".invalid" (RFC 2606) is correctly rejected by Supabase Auth's
    // client-facing signUp() email-format validation, same as any other
    // obviously-fake domain would be for a real user -- not a product
    // concern, just means the test needs the same admin-bypass pattern
    // tests/fixtures.ts already uses for every other QA fixture user.
    const { data: created, error: createError } = await withNetworkRetry(() =>
      admin.auth.admin.createUser({ email, password: FIXTURE_PASSWORD, email_confirm: true }),
    );
    expect(createError).toBeNull();
    newAdminAuthUserId = created.user!.id;

    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInError } = await withNetworkRetry(() =>
      client.auth.signInWithPassword({ email, password: FIXTURE_PASSWORD }),
    );
    expect(signInError).toBeNull();

    const { data: schoolId, error: registerError } = await withNetworkRetry(() =>
      client.rpc("register_school", {
        p_school_name: schoolName,
        p_country: "Nigeria",
        p_admin_name: "QA Registration Admin",
        p_admin_contact: email,
      }),
    );
    expect(registerError).toBeNull();
    expect(schoolId).toBeTruthy();
    newSchoolId = schoolId as string;

    const { data: school } = await admin.from("School").select("*").eq("school_id", newSchoolId).single();
    expect(school?.name).toBe(schoolName);
    expect(school?.country).toBe("Nigeria");

    const { data: subscription } = await admin
      .from("Subscription")
      .select("*")
      .eq("school_id", newSchoolId)
      .single();
    expect(subscription?.status).toBe("Trialing");
    expect(subscription?.tier).toBe("tier_1");

    const { data: schoolAdmin } = await admin
      .from("SchoolAdmin")
      .select("*")
      .eq("auth_user_id", newAdminAuthUserId)
      .single();
    expect(schoolAdmin?.school_id).toBe(newSchoolId);
    expect(schoolAdmin?.activation_status).toBe("Active");
  });

  it("is logged to AuditLog", async () => {
    const { data, error } = await admin
      .from("AuditLog")
      .select("action_type, target_id")
      .eq("school_id", newSchoolId)
      .eq("action_type", "school_registered");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(1);
    expect(data?.[0].target_id).toBe(newSchoolId);
  });

  it("signing in afterward yields admin/school_id JWT claims via the existing hook", async () => {
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await withNetworkRetry(() =>
      client.auth.signInWithPassword({ email, password: FIXTURE_PASSWORD }),
    );
    expect(error).toBeNull();

    const payload = JSON.parse(Buffer.from(data.session!.access_token.split(".")[1], "base64").toString());
    expect(payload.app_role).toBe("admin");
    expect(payload.school_id).toBe(newSchoolId);

    const { data: ownSchool, error: selectError } = await client
      .from("School")
      .select("school_id")
      .eq("school_id", newSchoolId);
    expect(selectError).toBeNull();
    expect(ownSchool).toHaveLength(1);
  });

  it("registering a second school with the same already-registered account is rejected", async () => {
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await withNetworkRetry(() => client.auth.signInWithPassword({ email, password: FIXTURE_PASSWORD }));

    const { error } = await withNetworkRetry(() =>
      client.rpc("register_school", {
        p_school_name: "QA Second School Attempt",
        p_country: "Nigeria",
        p_admin_name: "QA Registration Admin",
      }),
    );
    expect(error).not.toBeNull();
    expect(error?.message).toContain("already registered");
  });

  it("an unauthenticated (anon) caller cannot register a school", async () => {
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.rpc("register_school", {
      p_school_name: "QA Anon Attempt",
      p_country: "Nigeria",
      p_admin_name: "Nobody",
    });
    expect(error).not.toBeNull();
  });
});
