"use client";

import { useActionState } from "react";
import { addTeacher } from "./actions";

export function TeacherForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => addTeacher(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Name</label>
        <input name="name" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Staff ID (optional)</label>
        <input name="staffId" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Contact (optional)</label>
        <input name="contactInfo" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Add teacher
      </button>
      {state?.error ? <p className="w-full text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}
