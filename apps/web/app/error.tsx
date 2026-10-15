"use client";

import { useEffect } from "react";
import { ErrorState } from "@schoolos/ui";

// Catches routes outside the three role groups (/login, /register,
// /activate/[code], the root page) -- see apps/web/app/(admin)/error.tsx
// for the full rationale.
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
      <ErrorState message="Something went wrong loading this page." onRetry={reset} />
    </main>
  );
}
