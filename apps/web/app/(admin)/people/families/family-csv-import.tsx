"use client";

import { useState, useTransition } from "react";
import { confirmFamiliesCsv, previewFamiliesCsv, type FamilyCsvRow } from "./actions";

export function FamilyCsvImport() {
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<FamilyCsvRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setDone(false);
    file.text().then((text) => {
      startTransition(async () => {
        const result = await previewFamiliesCsv(text);
        if (result.error) setError(result.error);
        else setRows(result.rows ?? []);
      });
    });
    e.target.value = "";
  }

  function handleConfirm() {
    if (!rows) return;
    startTransition(async () => {
      const result = await confirmFamiliesCsv(rows);
      if (result.error) setError(result.error);
      else {
        setRows(null);
        setDone(true);
      }
    });
  }

  const hasErrors = rows?.some((r) => r.errors.length > 0) ?? false;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <p className="text-sm font-medium">Bulk import CSV</p>
      <p className="text-xs text-ink-secondary">
        Columns: <code>guardian_name</code> (required), <code>relationship</code>,{" "}
        <code>contact_info</code>.
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
                <th className="py-1 pr-2">Guardian</th>
                <th className="py-1 pr-2">Relationship</th>
                <th className="py-1">Issues</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNumber} className={row.errors.length > 0 ? "bg-danger/10" : undefined}>
                  <td className="py-1 pr-2 text-ink-secondary">{row.rowNumber}</td>
                  <td className="py-1 pr-2">{row.guardianName || "—"}</td>
                  <td className="py-1 pr-2">{row.relationship || "—"}</td>
                  <td className="py-1 text-danger">{row.errors.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            disabled={isPending || hasErrors}
            onClick={handleConfirm}
            className="self-start rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            Confirm import ({rows.length} {rows.length === 1 ? "row" : "rows"})
          </button>
          {hasErrors ? (
            <p className="text-xs text-danger">Fix every row before confirming -- no partial imports.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
