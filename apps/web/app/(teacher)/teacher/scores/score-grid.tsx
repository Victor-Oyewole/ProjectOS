"use client";

import { useState, useTransition } from "react";
import { saveScores } from "./actions";

export function ScoreGrid({
  assessments,
  students,
  scores,
}: {
  assessments: { assessmentId: string; name: string }[];
  students: { enrollmentId: string; name: string }[];
  scores: { assessmentId: string; enrollmentId: string; value: number }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [grid, setGrid] = useState<Record<string, string>>(
    Object.fromEntries(scores.map((s) => [`${s.assessmentId}:${s.enrollmentId}`, String(s.value)])),
  );

  function handleSave() {
    setError(null);
    setDone(false);
    const entries = Object.entries(grid)
      .filter(([, v]) => v.trim() !== "")
      .map(([key, v]) => {
        const [assessmentId, enrollmentId] = key.split(":") as [string, string];
        return { assessmentId, enrollmentId, value: Number(v) };
      })
      .filter((e) => !Number.isNaN(e.value));

    startTransition(async () => {
      const result = await saveScores({ entries });
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
              {assessments.map((a) => (
                <th key={a.assessmentId} className="py-1 pr-2">
                  {a.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.enrollmentId}>
                <td className="py-1 pr-2">{s.name}</td>
                {assessments.map((a) => {
                  const key = `${a.assessmentId}:${s.enrollmentId}`;
                  return (
                    <td key={a.assessmentId} className="py-1 pr-2">
                      <input
                        type="number"
                        value={grid[key] ?? ""}
                        onChange={(e) => setGrid((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-20 rounded-md border border-border px-2 py-1 text-sm"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="self-start rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60 transition-colors duration-fast ease-standard"
      >
        Save scores
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {done ? <p className="text-sm text-success">Scores saved.</p> : null}
    </div>
  );
}
