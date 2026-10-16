"use client";

import { useState, useTransition } from "react";
import { markAssignmentStatus } from "./actions";

export function AcknowledgeButton({ assignmentId, enrollmentId }: { assignmentId: string; enrollmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await markAssignmentStatus({ assignmentId, enrollmentId, status: "Acknowledged" });
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  if (done) return <p className="text-sm text-success">Acknowledged.</p>;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-60 transition-colors duration-fast ease-standard"
      >
        Acknowledge
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
