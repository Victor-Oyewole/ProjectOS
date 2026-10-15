"use client";

import { useState, useTransition } from "react";
import { Button, EmptyState } from "@schoolos/ui";
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
    return <EmptyState message="No students enrolled in this class." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {students.map((s) => (
          <li
            key={s.enrollmentId}
            className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
          >
            <span>{s.name}</span>
            <div className="flex gap-1">
              {(["Present", "Absent", "Late"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [s.enrollmentId]: status }))}
                  className={`min-h-[44px] rounded-sm border px-3 py-1 text-xs font-medium transition-colors duration-base ease-standard ${
                    statuses[s.enrollmentId] === status
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:bg-primary-light"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <Button type="button" disabled={isPending} onClick={handleSubmit}>
        Submit attendance
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {done ? <p className="text-sm text-success">Attendance saved.</p> : null}
    </div>
  );
}
