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

  if (done) return <p className="text-sm text-green-700">Acknowledged.</p>;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Acknowledge
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
