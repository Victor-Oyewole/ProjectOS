"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { createAssignment } from "./actions";

interface ClassSubject {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

export function AssignmentForm({ classSubjects }: { classSubjects: ClassSubject[] }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createAssignment(formData),
    null,
  );
  const [classId, setClassId] = useState("");

  const classes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const cs of classSubjects) seen.set(cs.classId, cs.className);
    return Array.from(seen, ([classId, className]) => ({ classId, className }));
  }, [classSubjects]);

  const subjects = useMemo(
    () => classSubjects.filter((cs) => cs.classId === classId),
    [classSubjects, classId],
  );

  if (classes.length === 0) {
    return (
      <p className="text-sm text-ink-secondary">
        You aren&rsquo;t assigned to any class/subject yet -- ask your school admin to set this
        up.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Class</label>
          <select
            name="classId"
            required
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
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Subject</label>
          <select name="subjectId" required disabled={!classId} className="rounded-md border border-border px-2 py-1.5 text-sm">
            <option value="">—</option>
            {subjects.map((s) => (
              <option key={s.subjectId} value={s.subjectId}>
                {s.subjectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Title</label>
        <input name="title" required className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Instructions (optional)</label>
        <textarea name="instructions" rows={3} className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Available from</label>
          <input
            name="availableAt"
            type="datetime-local"
            required
            className="rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Due (optional)</label>
          <input name="dueAt" type="datetime-local" className="rounded-md border border-border px-2 py-1.5 text-sm" />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Schedule assignment
      </button>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
