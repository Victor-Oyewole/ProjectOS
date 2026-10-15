"use client";

import { useState, useTransition } from "react";
import { Button } from "@schoolos/ui";
import { reviewDeletionRequest } from "./actions";

// Doc 28 Section 2: a completed deletion hard-deletes/anonymizes real
// records (delete_enrollment_records, migration 047) -- the "completed"
// decision is destructive and irreversible, so it gets the same explicit
// confirm step as every other hard-to-reverse action in this app (Doc 19
// Section 5), while "in_review" (no irreversible effect yet) and "denied"
// (closes the request, deletes nothing) don't need one.
export function ReviewRequestForm({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [notes, setNotes] = useState("");

  function submit(decision: "in_review" | "completed" | "denied") {
    setError(null);
    const formData = new FormData();
    formData.set("requestId", requestId);
    formData.set("decision", decision);
    formData.set("resolutionNotes", notes);
    startTransition(async () => {
      const result = await reviewDeletionRequest(formData);
      if (result.error) setError(result.error);
      else setConfirmingComplete(false);
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <label className="text-xs text-ink-secondary">Resolution notes</label>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What was deleted, anonymized, or retained, and why"
        className="rounded-sm border border-border px-2 py-1.5 text-sm"
      />
      {confirmingComplete ? (
        <div className="flex flex-col gap-2 rounded-md border border-danger/30 bg-danger/5 p-3">
          <p className="text-sm text-danger">
            This permanently deletes or anonymizes this child&apos;s records at your school. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="destructive" disabled={isPending} onClick={() => submit("completed")}>
              Yes, complete deletion
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmingComplete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => submit("in_review")}>
            Mark in review
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={() => setConfirmingComplete(true)}>
            Complete deletion
          </Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => submit("denied")}>
            Deny
          </Button>
        </div>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
