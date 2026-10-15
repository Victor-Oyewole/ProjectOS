"use client";

import { useActionState } from "react";
import {
  compileNarrativeReports,
  computeTermResults,
  finalizeClassTerm,
  publishClassTerm,
  reopenTermReport,
  reopenTermResult,
} from "./actions";

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-danger">{error}</p>;
}

function ClassTermForm({
  classId,
  termId,
  action,
  label,
  variant,
}: {
  classId: string;
  termId: string;
  action: (formData: FormData) => Promise<{ error?: string }>;
  label: string;
  variant: "primary" | "secondary";
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => action(formData),
    null,
  );
  const classes =
    variant === "primary"
      ? "rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      : "rounded-sm border border-border px-4 py-1.5 text-sm font-medium hover:bg-primary-light disabled:opacity-60";
  return (
    <form action={formAction}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="termId" value={termId} />
      <button type="submit" disabled={isPending} className={classes}>
        {label}
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function ComputeResultsButton({ classId, termId }: { classId: string; termId: string }) {
  return <ClassTermForm classId={classId} termId={termId} action={computeTermResults} label="Compute results" variant="primary" />;
}

export function CompileNarrativeReportsButton({ classId, termId }: { classId: string; termId: string }) {
  return (
    <ClassTermForm
      classId={classId}
      termId={termId}
      action={compileNarrativeReports}
      label="Compile narrative reports"
      variant="primary"
    />
  );
}

export function FinalizeClassTermButton({ classId, termId }: { classId: string; termId: string }) {
  return <ClassTermForm classId={classId} termId={termId} action={finalizeClassTerm} label="Finalize" variant="secondary" />;
}

export function PublishClassTermButton({ classId, termId }: { classId: string; termId: string }) {
  return <ClassTermForm classId={classId} termId={termId} action={publishClassTerm} label="Publish" variant="secondary" />;
}

function ReopenForm({ id, action }: { id: string; action: (formData: FormData) => Promise<{ error?: string }> }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => action(formData),
    null,
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={isPending} className="text-xs text-danger hover:underline disabled:opacity-60">
        Reopen
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function ReopenTermResultButton({ resultId }: { resultId: string }) {
  return <ReopenForm id={resultId} action={reopenTermResult} />;
}

export function ReopenTermReportButton({ reportId }: { reportId: string }) {
  return <ReopenForm id={reportId} action={reopenTermReport} />;
}
