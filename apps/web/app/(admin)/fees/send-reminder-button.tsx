"use client";

import { useState, useTransition } from "react";
import { sendFeeReminders } from "./actions";

export function SendReminderButton({ termId }: { termId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; count?: number } | null>(null);

  function handleClick() {
    setResult(null);
    const formData = new FormData();
    formData.set("termId", termId);
    startTransition(async () => {
      const res = await sendFeeReminders(formData);
      setResult(res);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-primary-light disabled:opacity-60"
      >
        Send reminder
      </button>
      {result?.error ? <span className="text-sm text-danger">{result.error}</span> : null}
      {result && !result.error ? (
        <span className="text-sm text-success">
          Sent to {result.count} famil{result.count === 1 ? "y" : "ies"}.
        </span>
      ) : null}
    </div>
  );
}
