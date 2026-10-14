"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { sendDailyNote } from "./actions";

export function DailyNoteForm({
  classes,
  students,
}: {
  classes: { classId: string; className: string }[];
  students: { enrollmentId: string; classId: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => sendDailyNote(formData),
    null,
  );
  const [classId, setClassId] = useState("");

  const classStudents = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);

  if (classes.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        You aren&rsquo;t assigned to any class yet -- ask your school admin to set this up.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.className}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Student</label>
          <select
            name="enrollmentId"
            required
            disabled={!classId}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {classStudents.map((s) => (
              <option key={s.enrollmentId} value={s.enrollmentId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Category</label>
          <select name="category" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="general">General</option>
            <option value="academic">Academic</option>
            <option value="behavior">Behavior</option>
            <option value="health">Health</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Note</label>
        <textarea name="noteText" required rows={3} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Send note
      </button>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}
