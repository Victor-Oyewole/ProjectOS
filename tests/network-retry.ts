// The live project's pooler/DNS has repeatedly shown transient blips this
// session (ENOTFOUND, connection timeouts, bare "fetch failed") unrelated to
// anything the code under test is doing. Used both by fixtures.ts (seeding)
// and by the test files themselves (actual assertions) -- a blip during a
// real assertion is just as much infrastructure noise as one during setup.
export function looksLikeNetworkError(error: { message?: string } | null | undefined): boolean {
  if (!error) return false;
  return /fetch failed|ENOTFOUND|ETIMEDOUT|ECONNRESET|network|timed? ?out/i.test(error.message ?? "");
}

export async function withNetworkRetry<T extends { error: any }>(
  fn: () => Promise<T>,
  attempts = 4,
  delayMs = 2000,
): Promise<T> {
  let result = await fn();
  for (let i = 1; i < attempts && looksLikeNetworkError(result.error); i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    result = await fn();
  }
  return result;
}
