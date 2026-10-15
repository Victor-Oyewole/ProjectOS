"use client";

import { useActionState } from "react";
import { addFamily } from "./actions";

interface StudentOption {
  platform_student_id: string;
  name: string;
}

export function FamilyForm({ students }: { students: StudentOption[] }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => addFamily(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Guardian name</label>
          <input
            name="guardianName"
            required
            className="rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Relationship</label>
          <input
            name="relationship"
            placeholder="Mother"
            className="rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Contact</label>
          <input name="contactInfo" className="rounded-md border border-border px-2 py-1.5 text-sm" />
        </div>
      </div>

      {students.length > 0 ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Link to student(s)</label>
          <div className="flex flex-wrap gap-3">
            {students.map((s) => (
              <label key={s.platform_student_id} className="flex items-center gap-1 text-sm">
                <input type="checkbox" name="studentIds" value={s.platform_student_id} />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Add family
      </button>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
