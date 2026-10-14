"use client";

import { useActionState } from "react";
import {
  assignTeacherToClass,
  createAcademicSession,
  createAssessment,
  createClass,
  createSubject,
  createTerm,
} from "./actions";

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-red-600">{error}</p>;
}

export function NewSessionForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createAcademicSession(formData),
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Session name</label>
        <input
          name="name"
          placeholder="2026/2027"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Start date</label>
        <input
          name="startDate"
          type="date"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">End date</label>
        <input
          name="endDate"
          type="date"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
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
        <label className="text-xs text-slate-500">Term name</label>
        <input
          name="name"
          placeholder="Term 1"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Start date</label>
        <input
          name="startDate"
          type="date"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">End date</label>
        <input
          name="endDate"
          type="date"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-60"
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
        <label className="text-xs text-slate-500">Class name</label>
        <input
          name="name"
          placeholder="Primary 3A"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Add class
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function NewSubjectForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createSubject(formData),
    null,
  );
  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Subject name</label>
        <input
          name="name"
          placeholder="Mathematics"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Add subject
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
      <p className="text-sm text-slate-500">
        Add at least one teacher, class, subject, and session before assigning teachers to classes.
      </p>
    );
  }
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Teacher</label>
        <select name="teacherId" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">—</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Class</label>
        <select name="classId" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">—</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Subject</label>
        <select name="subjectId" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">—</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Session</label>
        <select name="sessionId" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
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
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
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
    return <p className="text-sm text-slate-500">Add at least one class, subject, and term first.</p>;
  }
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Class</label>
        <select name="classId" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">—</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Subject</label>
        <select name="subjectId" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">—</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Term</label>
        <select name="termId" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">—</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Assessment name</label>
        <input
          name="name"
          placeholder="Test 1"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Add assessment
      </button>
      <ErrorText error={state?.error} />
    </form>
  );
}
