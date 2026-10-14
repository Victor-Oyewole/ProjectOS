"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { recordPayment } from "./actions";

export function RecordPaymentForm({
  enrollmentId,
  termId,
  currentExpected,
}: {
  enrollmentId: string;
  termId: string;
  currentExpected: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => recordPayment(formData),
    null,
  );

  // Close the form only when a submission just finished successfully (the
  // isPending true -> false transition), not whenever `state` happens to
  // be a non-error object -- `state` persists across re-renders, so
  // reacting to it directly would also fire the moment the form is
  // reopened after an earlier successful save, closing it instantly.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && state && !state.error) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100"
      >
        Record payment
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input type="hidden" name="termId" value={termId} />
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Amount expected</label>
          <input
            name="amountExpected"
            type="number"
            min="0"
            step="0.01"
            defaultValue={currentExpected}
            required
            className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Amount received now</label>
          <input
            name="amountReceived"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            required
            className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Method</label>
          <input name="paymentMethod" className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Notes (optional)</label>
        <input name="notes" className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}
