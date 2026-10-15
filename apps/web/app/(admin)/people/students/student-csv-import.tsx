"use client";

import { useState, useTransition } from "react";
import { confirmStudentsCsv, previewStudentsCsv, type StudentCsvRow } from "./actions";

export function StudentCsvImport() {
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<StudentCsvRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setDone(false);
    file.text().then((text) => {
      startTransition(async () => {
        const result = await previewStudentsCsv(text);
        if (result.error) setError(result.error);
        else setRows(result.rows ?? []);
      });
    });
    e.target.value = "";
  }

  function resolveRow(rowNumber: number, decision: "new" | "confirm_match", matchedPlatformStudentId: string | null) {
    setRows((prev) =>
      prev?.map((r) => (r.rowNumber === rowNumber ? { ...r, decision, matchedPlatformStudentId } : r)) ?? null,
    );
  }

  function handleConfirm() {
    if (!rows) return;
    startTransition(async () => {
      const result = await confirmStudentsCsv(rows);
      if (result.error) setError(result.error);
      else {
        setRows(null);
        setDone(true);
      }
    });
  }

  const hasErrors = rows?.some((r) => r.errors.length > 0) ?? false;
  const hasUnresolved = rows?.some((r) => r.decision === null) ?? false;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <p className="text-sm font-medium">Bulk import CSV</p>
      <p className="text-xs text-ink-secondary">
        Columns: <code>name</code>, <code>dob</code> (both required), <code>class</code> (optional, matched by
        name).
      </p>
      <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {done ? <p className="text-sm text-success">Import complete.</p> : null}

      {rows ? (
        <div className="flex flex-col gap-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-secondary">
                <th className="py-1 pr-2">Row</th>
                <th className="py-1 pr-2">Name</th>
                <th className="py-1 pr-2">DOB</th>
                <th className="py-1 pr-2">Class</th>
                <th className="py-1">Issues / resolution</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.rowNumber}
                  className={row.errors.length > 0 ? "bg-danger/10" : row.decision === null ? "bg-warning/10" : undefined}
                >
                  <td className="py-1 pr-2 align-top text-ink-secondary">{row.rowNumber}</td>
                  <td className="py-1 pr-2 align-top">{row.name || "—"}</td>
                  <td className="py-1 pr-2 align-top">{row.dob || "—"}</td>
                  <td className="py-1 pr-2 align-top">{row.className || "—"}</td>
                  <td className="py-1 align-top">
                    {row.errors.length > 0 ? (
                      <span className="text-danger">{row.errors.join("; ")}</span>
                    ) : null}
                    {row.warnings.length > 0 ? (
                      <span className="block text-warning">{row.warnings.join("; ")}</span>
                    ) : null}
                    {row.decision === null ? (
                      <div className="flex flex-col gap-1 pt-1">
                        <span className="text-warning">Possible existing student -- confirm or add as new:</span>
                        <ul className="flex flex-col gap-1">
                          {row.candidates.map((c) => (
                            <li key={c.platform_student_id} className="flex items-center justify-between gap-2">
                              <span>
                                {c.name} ({c.dob}) — <span className="font-medium">{c.confidence}</span>
                              </span>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => resolveRow(row.rowNumber, "confirm_match", c.platform_student_id)}
                                className="rounded-md border border-border px-2 py-0.5 text-xs font-medium hover:bg-primary-light disabled:opacity-60"
                              >
                                Same student
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => resolveRow(row.rowNumber, "new", null)}
                          className="self-start rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-60"
                        >
                          Different student — add as new
                        </button>
                      </div>
                    ) : row.candidates.length > 0 ? (
                      <span className="text-success">
                        {row.decision === "new" ? "Will add as new" : "Will match existing"}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            disabled={isPending || hasErrors || hasUnresolved}
            onClick={handleConfirm}
            className="self-start rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            Confirm import ({rows.length} {rows.length === 1 ? "row" : "rows"})
          </button>
          {hasErrors ? (
            <p className="text-xs text-danger">Fix every row before confirming -- no partial imports.</p>
          ) : hasUnresolved ? (
            <p className="text-xs text-warning">Resolve every ambiguous match before confirming.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
