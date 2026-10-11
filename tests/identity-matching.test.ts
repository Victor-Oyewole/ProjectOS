// Milestone 0 exit criteria (a), Doc 23 Sections 2 & 9: demonstrates the
// identity-matching workflow correctly distinguishes a new student from a
// HIGH-confidence match. Exercises the real resolve_or_create_platform_student
// / find_platform_student_candidates functions (migration 032) through
// School A's admin -- the only role allowed to call them.
import { beforeAll, describe, expect, it } from "vitest";
import { seedFixtures, type Fixtures } from "./fixtures";
import { withNetworkRetry } from "./network-retry";

let fx: Fixtures;

beforeAll(async () => {
  fx = await seedFixtures();
});

describe("identity matching: no match -> new PlatformStudent", () => {
  // A timestamp-suffixed but otherwise-fixed name ("QA Nonexistent Student
  // <ts>") isn't actually unique against fuzzy matching: these fixtures are
  // permanent (never torn down, see tests/fixtures.ts), so every prior run
  // leaves its own near-identical name behind, and trigram similarity
  // doesn't care about a few trailing digits differing -- two long strings
  // sharing most of their characters still score above the 0.3 threshold.
  // A random UUID as the name has no meaningful n-gram overlap with
  // anything, fixture or prior-run leftover, and a random dob sidesteps the
  // exact-dob requirement entirely as a second line of defense.
  const uniqueName = crypto.randomUUID();
  const uniqueDob = `19${50 + Math.floor(Math.random() * 50)}-0${1 + Math.floor(Math.random() * 8)}-1${Math.floor(Math.random() * 8)}`;

  it("a genuinely new name/dob with no existing student returns no candidates", async () => {
    const { data, error } = await withNetworkRetry(() =>
      fx.schoolA.adminClient.rpc("find_platform_student_candidates", {
        p_name: uniqueName,
        p_dob: uniqueDob,
        p_guardian_contacts: [],
      }),
    );
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("resolving with decision 'new' creates a fresh PlatformStudent distinct from any fixture", async () => {
    const { data: newId, error } = await withNetworkRetry(() =>
      fx.schoolA.adminClient.rpc("resolve_or_create_platform_student", {
        p_name: uniqueName,
        p_dob: uniqueDob,
        p_decision: "new",
        p_matched_platform_student_id: null,
      }),
    );
    expect(error).toBeNull();
    expect(newId).toBeTruthy();
    expect(newId).not.toBe(fx.schoolA.platformStudentId);
    expect(newId).not.toBe(fx.schoolB.platformStudentId);

    const { data: created } = await fx.admin
      .from("PlatformStudent")
      .select("platform_student_id, name, dob")
      .eq("platform_student_id", newId)
      .single();
    expect(created?.name).toBe(uniqueName);
  });
});

describe("identity matching: HIGH confidence match -> admin can reuse, not duplicate", () => {
  it("same name + dob + overlapping guardian contact as an existing student scores HIGH", async () => {
    // fx.schoolA's fixture student ("QA Fixture Student A", dob 2015-06-01)
    // has a guardian (fx.schoolA's FamilyMembership/Guardian row) whose
    // contact_info we don't have directly in the fixture object, so fetch it
    // to build a realistic "same family re-registering" scenario.
    const { data: guardian } = await fx.admin
      .from("Guardian")
      .select("contact_info")
      .eq("membership_id", fx.schoolA.membershipId)
      .single();

    const { data, error } = await fx.schoolA.adminClient.rpc("find_platform_student_candidates", {
      p_name: "QA Fixture Student A", // exact match -> similarity 1.0
      p_dob: "2015-06-01",
      p_guardian_contacts: guardian?.contact_info ? [guardian.contact_info] : [],
    });
    expect(error).toBeNull();
    const match = (data ?? []).find((r: any) => r.platform_student_id === fx.schoolA.platformStudentId);
    expect(match).toBeDefined();
    expect(match.confidence).toBe("HIGH");
  });

  it("confirming the match reuses the existing platform_student_id -- no duplicate is created", async () => {
    const before = await fx.admin.from("PlatformStudent").select("platform_student_id", { count: "exact", head: true });

    const { data: resolvedId, error } = await fx.schoolA.adminClient.rpc("resolve_or_create_platform_student", {
      p_name: "QA Fixture Student A",
      p_dob: "2015-06-01",
      p_decision: "confirm_match",
      p_matched_platform_student_id: fx.schoolA.platformStudentId,
    });
    expect(error).toBeNull();
    expect(resolvedId).toBe(fx.schoolA.platformStudentId);

    const after = await fx.admin.from("PlatformStudent").select("platform_student_id", { count: "exact", head: true });
    expect(after.count).toBe(before.count);
  });

  it("confirming the match is logged to AuditLog", async () => {
    const { data, error } = await fx.admin
      .from("AuditLog")
      .select("action_type, target_entity, target_id")
      .eq("school_id", fx.schoolA.schoolId)
      .eq("action_type", "identity_resolution_confirm_match")
      .eq("target_id", fx.schoolA.platformStudentId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(1);
  });
});

describe("identity matching: role restriction", () => {
  it("teacher cannot call resolve_or_create_platform_student", async () => {
    const { error } = await fx.schoolA.teacherClient.rpc("resolve_or_create_platform_student", {
      p_name: "Should Not Work",
      p_dob: "2020-01-01",
      p_decision: "new",
      p_matched_platform_student_id: null,
    });
    expect(error).not.toBeNull();
  });

  it("family cannot search identity candidates", async () => {
    const { error } = await fx.schoolA.familyClient.rpc("find_platform_student_candidates", {
      p_name: "Should Not Work",
      p_dob: "2020-01-01",
      p_guardian_contacts: [],
    });
    expect(error).not.toBeNull();
  });
});
