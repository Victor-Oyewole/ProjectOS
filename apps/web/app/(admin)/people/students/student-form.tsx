"use client";

import { useState, useTransition } from "react";
import {
  confirmStudentMatch,
  createNewStudent,
  searchStudentCandidates,
  type StudentCandidate,
} from "./actions";

export function StudentForm({ classes }: { classes: { class_id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingSearch, setPendingSearch] = useState<{ name: string; dob: string; classId: string } | null>(
    null,
  );
  const [candidates, setCandidates] = useState<StudentCandidate[] | null>(null);

  function handleSearch(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const dob = String(formData.get("dob") ?? "");
    const classId = String(formData.get("classId") ?? "");
    setError(null);
    startTransition(async () => {
      const result = await searchStudentCandidates(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.candidates && result.candidates.length > 0) {
        setPendingSearch({ name, dob, classId });
        setCandidates(result.candidates);
      } else {
        const createResult = await createNewStudent(name, dob, classId || null);
        if (createResult.error) setError(createResult.error);
      }
    });
  }

  function handleConfirmMatch(platformStudentId: string) {
    if (!pendingSearch) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmStudentMatch(
        platformStudentId,
        pendingSearch.name,
        pendingSearch.dob,
        pendingSearch.classId || null,
      );
      if (result.error) setError(result.error);
      else {
        setCandidates(null);
        setPendingSearch(null);
      }
    });
  }

  function handleCreateAsNew() {
    if (!pendingSearch) return;
    setError(null);
    startTransition(async () => {
      const result = await createNewStudent(pendingSearch.name, pendingSearch.dob, pendingSearch.classId || null);
      if (result.error) setError(result.error);
      else {
        setCandidates(null);
        setPendingSearch(null);
      }
    });
  }

  if (candidates) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-warning/30 bg-warning/10 p-4">
        <p className="text-sm font-medium">
          This looks like it might already be an existing student. Confirm or add as new.
        </p>
        <ul className="flex flex-col gap-2">
          {candidates.map((c) => (
            <li key={c.platform_student_id} className="flex items-center justify-between text-sm">
              <span>
                {c.name} ({c.dob}) — <span className="font-medium">{c.confidence}</span> confidence
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleConfirmMatch(c.platform_student_id)}
                className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-primary-light disabled:opacity-60"
              >
                Same student
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={isPending}
          onClick={handleCreateAsNew}
          className="self-start rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          Different student — add as new
        </button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <form action={handleSearch} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Name</label>
        <input name="name" required className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Date of birth</label>
        <input
          name="dob"
          type="date"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Class (optional)</label>
        <select name="classId" className="rounded-md border border-border px-2 py-1.5 text-sm">
          <option value="">—</option>
          {classes.map((c) => (
            <option key={c.class_id} value={c.class_id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Add student
      </button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}
