"use client";

import { useActionState } from "react";
import { approveTransferRequest, denyTransferRequest } from "../actions";

// Doc 13 #7 Screen 2-3: category checkboxes for the Transferable Academic
// Record categories this admin is willing to release, then Approve/Deny.
// "Teacher comments" is deliberately not one of the options -- see
// migration 049's comment: admin has no visibility into DailyNote, so
// there's no way to judge which comments are "appropriate" to release.
const CATEGORIES = [
  { key: "enrollment_history", label: "Enrollment history" },
  { key: "attendance_summary", label: "Attendance summary" },
  { key: "term_results", label: "Term results & report cards" },
  { key: "certificates", label: "Certificates" },
] as const;

export function ReviewForm({ requestId }: { requestId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => approveTransferRequest(formData),
    null,
  );
  const [denyState, denyAction, denyPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => denyTransferRequest(formData),
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={approveAction} className="flex flex-col gap-3 rounded-md border border-border p-4">
        <input type="hidden" name="requestId" value={requestId} />
        <p className="text-sm font-medium">Approve -- select which records to release</p>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={c.key} className="h-4 w-4" />
              {c.label}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Notes (optional)</label>
          <input name="notes" className="rounded-md border border-border px-2 py-1.5 text-sm" />
        </div>
        <button
          type="submit"
          disabled={approvePending}
          className="self-start rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          Approve & generate transfer package
        </button>
        {approveState?.error ? <p className="text-sm text-danger">{approveState.error}</p> : null}
      </form>

      <form action={denyAction} className="flex flex-col gap-3 rounded-md border border-border p-4">
        <input type="hidden" name="requestId" value={requestId} />
        <p className="text-sm font-medium">Deny</p>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Reason (optional)</label>
          <input name="reason" className="rounded-md border border-border px-2 py-1.5 text-sm" />
        </div>
        <button
          type="submit"
          disabled={denyPending}
          className="self-start rounded-sm border border-danger/30 px-4 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
        >
          Deny request
        </button>
        {denyState?.error ? <p className="text-sm text-danger">{denyState.error}</p> : null}
      </form>
    </div>
  );
}
