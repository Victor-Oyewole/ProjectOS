"use client";

import { useState, useTransition } from "react";
import { saveMilestoneAssessments } from "./actions";

export function MilestoneGrid({
  subjectId,
  termId,
  levels,
  students,
  entries,
}: {
  subjectId: string;
  termId: string;
  levels: string[];
  students: { enrollmentId: string; name: string }[];
  entries: { enrollmentId: string; milestoneLevel: string; narrativeNote: string | null }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [levelGrid, setLevelGrid] = useState<Record<string, string>>(
    Object.fromEntries(entries.map((e) => [e.enrollmentId, e.milestoneLevel])),
  );
  const [noteGrid, setNoteGrid] = useState<Record<string, string>>(
    Object.fromEntries(entries.map((e) => [e.enrollmentId, e.narrativeNote ?? ""])),
  );

  function handleSave() {
    setError(null);
    setDone(false);
    const toSave = students
      .map((s) => ({
        enrollmentId: s.enrollmentId,
        milestoneLevel: levelGrid[s.enrollmentId] ?? "",
        narrativeNote: noteGrid[s.enrollmentId] ?? "",
      }))
      .filter((e) => e.milestoneLevel.trim() !== "");

    startTransition(async () => {
      const result = await saveMilestoneAssessments({ subjectId, termId, entries: toSave });
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  if (students.length === 0) {
    return <p className="text-sm text-ink-secondary">No students enrolled in this class.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-ink-secondary">
              <th className="py-1 pr-2">Student</th>
              <th className="py-1 pr-2">Milestone level</th>
              <th className="py-1 pr-2">Narrative note</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.enrollmentId}>
                <td className="py-1 pr-2">{s.name}</td>
                <td className="py-1 pr-2">
                  <select
                    value={levelGrid[s.enrollmentId] ?? ""}
                    onChange={(e) => setLevelGrid((prev) => ({ ...prev, [s.enrollmentId]: e.target.value }))}
                    className="rounded-md border border-border px-2 py-1 text-sm"
                  >
                    <option value="">—</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="text"
                    value={noteGrid[s.enrollmentId] ?? ""}
                    onChange={(e) => setNoteGrid((prev) => ({ ...prev, [s.enrollmentId]: e.target.value }))}
                    className="w-full min-w-[12rem] rounded-md border border-border px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="self-start rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Save milestone assessments
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {done ? <p className="text-sm text-success">Milestone assessments saved.</p> : null}
    </div>
  );
}
