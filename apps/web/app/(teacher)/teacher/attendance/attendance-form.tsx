"use client";

import { useState, useTransition } from "react";
import { submitAttendance } from "./actions";

type Status = "Present" | "Absent" | "Late";

export function AttendanceForm({
  classId,
  date,
  students,
}: {
  classId: string;
  date: string;
  students: { enrollmentId: string; name: string; status: Status | null }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(students.filter((s) => s.status).map((s) => [s.enrollmentId, s.status as Status])),
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit() {
    setError(null);
    setDone(false);
    const entries = Object.entries(statuses).map(([enrollmentId, status]) => ({ enrollmentId, status }));
    startTransition(async () => {
      const result = await submitAttendance({ classId, date, entries });
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  if (students.length === 0) {
    return <p className="text-sm text-slate-500">No students enrolled in this class.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {students.map((s) => (
          <li
            key={s.enrollmentId}
            className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"
          >
            <span>{s.name}</span>
            <div className="flex gap-1">
              {(["Present", "Absent", "Late"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [s.enrollmentId]: status }))}
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    statuses[s.enrollmentId] === status
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="self-start rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Submit attendance
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {done ? <p className="text-sm text-green-700">Attendance saved.</p> : null}
    </div>
  );
}
