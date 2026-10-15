"use client";

import { useActionState } from "react";
import {
  addGradeBand,
  addMilestoneLevel,
  assignTeacherToClass,
  createAcademicSession,
  createAssessment,
  createClass,
  createSubject,
  createTerm,
  removeGradeBand,
  removeMilestoneLevel,
  setAssessmentWeight,
  setSubjectCreditWeight,
  updateAssessmentModel,
} from "./actions";

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-danger">{error}</p>;
}

export const ASSESSMENT_MODEL_LABELS: Record<string, string> = {
  equal_weight: "Equal-weight average",
  credit_weighted: "Credit-weighted average",
  narrative_milestone: "Narrative / milestone-based",
};

export function AssessmentModelForm({ current }: { current: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => updateAssessmentModel(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Assessment model</label>
        <select
          name="assessmentModel"
          defaultValue={current}
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        >
          {Object.entries(ASSESSMENT_MODEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Save model
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function AddGradeBandForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => addGradeBand(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Min</label>
        <input name="min" type="number" required className="w-20 rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Max</label>
        <input name="max" type="number" required className="w-20 rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Grade</label>
        <input name="grade" placeholder="A" required className="w-20 rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Remark (optional)</label>
        <input name="remark" placeholder="Excellent" className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm border border-border px-3 py-1.5 text-sm font-medium hover:bg-primary-light disabled:opacity-60"
      >
        Add band
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function RemoveGradeBandButton({ index }: { index: number }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => removeGradeBand(formData),
    null,
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="index" value={index} />
      <button type="submit" disabled={isPending} className="text-xs text-danger hover:underline disabled:opacity-60">
        Remove
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function AddMilestoneLevelForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => addMilestoneLevel(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Level name</label>
        <input
          name="level"
          placeholder="Emerging"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm border border-border px-3 py-1.5 text-sm font-medium hover:bg-primary-light disabled:opacity-60"
      >
        Add level
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function RemoveMilestoneLevelButton({ index }: { index: number }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => removeMilestoneLevel(formData),
    null,
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="index" value={index} />
      <button type="submit" disabled={isPending} className="text-xs text-danger hover:underline disabled:opacity-60">
        Remove
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function SubjectCreditWeightForm({ subjectId, current }: { subjectId: string; current: number }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => setSubjectCreditWeight(formData),
    null,
  );
  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="subjectId" value={subjectId} />
      <input
        name="creditWeight"
        type="number"
        min={1}
        defaultValue={current}
        className="w-14 rounded-md border border-border px-1.5 py-0.5 text-xs"
      />
      <button type="submit" disabled={isPending} className="text-xs text-primary hover:underline disabled:opacity-60">
        Save
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function AssessmentWeightForm({ assessmentId, current }: { assessmentId: string; current: number }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => setAssessmentWeight(formData),
    null,
  );
  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input
        name="weight"
        type="number"
        min={0}
        max={100}
        defaultValue={current}
        className="w-14 rounded-md border border-border px-1.5 py-0.5 text-xs"
      />
      <span className="text-xs text-ink-secondary">%</span>
      <button type="submit" disabled={isPending} className="text-xs text-primary hover:underline disabled:opacity-60">
        Save
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function NewSessionForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createAcademicSession(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Session name</label>
        <input
          name="name"
          placeholder="2026/2027"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Start date</label>
        <input
          name="startDate"
          type="date"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">End date</label>
        <input
          name="endDate"
          type="date"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Add session
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function NewTermForm({ sessionId }: { sessionId: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createTerm(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Term name</label>
        <input
          name="name"
          placeholder="Term 1"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Start date</label>
        <input
          name="startDate"
          type="date"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">End date</label>
        <input
          name="endDate"
          type="date"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm border border-border px-3 py-1.5 text-sm font-medium hover:bg-primary-light disabled:opacity-60"
      >
        Add term
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function NewClassForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createClass(formData),
    null,
  );
  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Class name</label>
        <input
          name="name"
          placeholder="Primary 3A"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Add class
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function NewSubjectForm({ showCreditWeight, label }: { showCreditWeight?: boolean; label?: string } = {}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createSubject(formData),
    null,
  );
  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">{label ?? "Subject name"}</label>
        <input
          name="name"
          placeholder="Mathematics"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      {showCreditWeight ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary">Credit weight</label>
          <input
            name="creditWeight"
            type="number"
            min={1}
            defaultValue={1}
            className="w-20 rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Add {label ? label.toLowerCase() : "subject"}
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function AssignTeacherForm({
  teachers,
  classes,
  subjects,
  sessions,
}: {
  teachers: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  sessions: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => assignTeacherToClass(formData),
    null,
  );
  if (teachers.length === 0 || classes.length === 0 || subjects.length === 0 || sessions.length === 0) {
    return (
      <p className="text-sm text-ink-secondary">
        Add at least one teacher, class, subject, and session before assigning teachers to classes.
      </p>
    );
  }
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Teacher</label>
        <select name="teacherId" required className="rounded-md border border-border px-2 py-1.5 text-sm">
          <option value="">—</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Class</label>
        <select name="classId" required className="rounded-md border border-border px-2 py-1.5 text-sm">
          <option value="">—</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Subject</label>
        <select name="subjectId" required className="rounded-md border border-border px-2 py-1.5 text-sm">
          <option value="">—</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Session</label>
        <select name="sessionId" required className="rounded-md border border-border px-2 py-1.5 text-sm">
          <option value="">—</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Assign
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function NewAssessmentForm({
  classes,
  subjects,
  terms,
}: {
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  terms: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createAssessment(formData),
    null,
  );
  if (classes.length === 0 || subjects.length === 0 || terms.length === 0) {
    return <p className="text-sm text-ink-secondary">Add at least one class, subject, and term first.</p>;
  }
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Class</label>
        <select name="classId" required className="rounded-md border border-border px-2 py-1.5 text-sm">
          <option value="">—</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Subject</label>
        <select name="subjectId" required className="rounded-md border border-border px-2 py-1.5 text-sm">
          <option value="">—</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Term</label>
        <select name="termId" required className="rounded-md border border-border px-2 py-1.5 text-sm">
          <option value="">—</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Assessment name</label>
        <input
          name="name"
          placeholder="Test 1"
          required
          className="rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Weight %</label>
        <input
          name="weight"
          type="number"
          min={0}
          max={100}
          placeholder="30"
          className="w-20 rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Add assessment
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}
