import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    hookTimeout: 120_000,
    // withNetworkRetry (tests/network-retry.ts) can take up to 4 attempts x
    // 2s delay on its own for a single flaky call; a test making several
    // such calls needs more headroom than vitest's 5s/20s defaults.
    testTimeout: 60_000,
    // All test files share the same live Supabase project and the same
    // global fixture emails (tests/fixtures.ts). Running files in parallel
    // (vitest's default) means separate workers race to create/seed the
    // same rows -- e.g. two workers both see qa-platform-admin doesn't
    // exist yet and both call createUser, so one gets "already registered".
    // Sequential files also let fixtures.ts's module-level cache actually
    // work (same process), so only the first file pays the full seed cost.
    fileParallelism: false,
    // Share module state across files too (not just sequential execution):
    // without this, each file still gets its own fresh import of
    // fixtures.ts and pays the full seed cost independently even when run
    // one after another, multiplying network calls against a project
    // that's shown repeated transient blips this session.
    isolate: false,
  },
});
