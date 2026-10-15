import type { ReactNode } from "react";

// Doc 19 Section 1 (Empty state): "A specific, friendly message + relevant
// next action... never a blank screen." `action` is optional -- some
// empty states genuinely have no next action (e.g. "No assignments yet"
// shown to a family when the teacher hasn't published anything, per the
// doc's own example), and forcing a placeholder action there would be
// worse than omitting one.
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm text-ink-secondary">{message}</p>
      {action}
    </div>
  );
}
