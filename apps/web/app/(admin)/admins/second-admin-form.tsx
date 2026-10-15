"use client";

import { useActionState } from "react";
import { addSecondAdmin } from "./actions";

export function SecondAdminForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => addSecondAdmin(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Name</label>
        <input name="name" required className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Contact (optional)</label>
        <input name="contactInfo" className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Add second admin
      </button>
      {state?.error ? <p className="w-full text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
