"use client";

import { useState, useTransition } from "react";
import { retractAssignment } from "./actions";

export function RetractButton({ assignmentId }: { assignmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRetract() {
    setError(null);
    startTransition(async () => {
      const result = await retractAssignment(assignmentId);
      if (result.error) setError(result.error);
      else setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-secondary">Retract this assignment?</span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleRetract}
            className="rounded-sm border border-danger/30 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
          >
            Confirm retract
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-primary-light"
          >
            Cancel
          </button>
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-primary-light"
    >
      Retract
    </button>
  );
}
