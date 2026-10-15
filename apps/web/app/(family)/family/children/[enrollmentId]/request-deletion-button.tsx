"use client";

import { useState, useTransition } from "react";
import { Button } from "@schoolos/ui";
import { requestDataDeletion } from "./actions";

// Doc 19 Section 5: "Destructive or hard-to-reverse actions... always
// require an explicit confirmation step" -- same open/confirm/cancel
// pattern already used for transfer deny and fee payment recording in
// this app, not a native window.confirm.
export function RequestDeletionButton({ enrollmentId }: { enrollmentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const formData = new FormData();
    formData.set("enrollmentId", enrollmentId);
    startTransition(async () => {
      const result = await requestDataDeletion(formData);
      if (result.error) setError(result.error);
      else {
        setDone(true);
        setConfirming(false);
      }
    });
  }

  if (done) {
    return <p className="text-sm text-success">Deletion request submitted -- the school will review it.</p>;
  }

  if (!confirming) {
    return (
      <Button type="button" variant="destructive" onClick={() => setConfirming(true)}>
        Request data deletion
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-danger/30 bg-danger/5 p-3">
      <p className="text-sm text-danger">
        This asks the school to delete this child&apos;s records at this school (assignments, attendance, scores,
        daily notes, fee records). It does not affect records at any other school this child may be enrolled in.
        This cannot be undone once the school completes it.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="destructive" disabled={isPending} onClick={handleConfirm}>
          Yes, request deletion
        </Button>
        <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
