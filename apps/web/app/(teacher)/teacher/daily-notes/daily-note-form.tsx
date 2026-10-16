"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { sendDailyNote } from "./actions";
import { Select } from "@schoolos/ui";

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
      <p className="text-sm text-ink-secondary">
        You aren&rsquo;t assigned to any class yet -- ask your school admin to set this up.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Class</label>
          <Select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-md border border-border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.className}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Student</label>
          <Select
            name="enrollmentId"
            required
            disabled={!classId}
            className="rounded-md border border-border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {classStudents.map((s) => (
              <option key={s.enrollmentId} value={s.enrollmentId}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Category</label>
          <Select name="category" required className="rounded-md border border-border px-2 py-1.5 text-sm">
            <option value="general">General</option>
            <option value="academic">Academic</option>
            <option value="behavior">Behavior</option>
            <option value="health">Health</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Note</label>
        <textarea name="noteText" required rows={3} className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60 transition-colors duration-fast ease-standard"
      >
        Send note
      </button>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
