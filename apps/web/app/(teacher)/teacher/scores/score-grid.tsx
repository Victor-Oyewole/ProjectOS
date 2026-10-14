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
    return <p className="text-sm text-slate-500">No students enrolled in this class.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
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
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
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
        className="self-start rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Save scores
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {done ? <p className="text-sm text-green-700">Scores saved.</p> : null}
    </div>
  );
}
