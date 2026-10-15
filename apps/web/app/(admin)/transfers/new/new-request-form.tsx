"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StudentCandidate } from "../../people/students/actions";
import { searchTransferStudent, searchFromSchool, submitTransferRequest, type SchoolCandidate } from "../actions";

// Doc 7's 4-step flow: (1) find the platform student by name/dob -- they
// aren't enrolled here yet, so there's nothing else to search by; (2)
// find the releasing school by name (the family already told the admin
// which school); (3) submit. Step 4 (review/approve/deny) happens on the
// OTHER school's side, at /transfers/[requestId].
export function NewRequestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [student, setStudent] = useState<StudentCandidate | null>(null);
  const [studentCandidates, setStudentCandidates] = useState<StudentCandidate[] | null>(null);

  const [school, setSchool] = useState<SchoolCandidate | null>(null);
  const [schoolCandidates, setSchoolCandidates] = useState<SchoolCandidate[] | null>(null);

  function handleStudentSearch(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await searchTransferStudent(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.candidates || result.candidates.length === 0) {
        setError("No matching student found at any school. Double-check the name and date of birth.");
        return;
      }
      setStudentCandidates(result.candidates);
    });
  }

  function handleSchoolSearch(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await searchFromSchool(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.schools || result.schools.length === 0) {
        setError("No matching school found.");
        return;
      }
      setSchoolCandidates(result.schools);
    });
  }

  function handleSubmit() {
    if (!student || !school) return;
    setError(null);
    startTransition(async () => {
      const result = await submitTransferRequest(student.platform_student_id, school.school_id);
      if (result.error) setError(result.error);
      else router.push("/transfers");
    });
  }

  if (student && school) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-border p-4">
        <p className="text-sm">
          Requesting records for <span className="font-medium">{student.name}</span> ({student.dob}) from{" "}
          <span className="font-medium">{school.name}</span>.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            Submit transfer request
          </button>
          <button
            type="button"
            onClick={() => setSchool(null)}
            className="rounded-md border border-border px-4 py-1.5 text-sm font-medium hover:bg-primary-light"
          >
            Back
          </button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  if (student) {
    if (schoolCandidates) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-secondary">
            Which school is currently holding {student.name}&apos;s records?
          </p>
          <ul className="flex flex-col gap-2">
            {schoolCandidates.map((s) => (
              <li key={s.school_id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span>{s.name}</span>
                <button
                  type="button"
                  onClick={() => setSchool(s)}
                  className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-primary-light"
                >
                  Select
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setSchoolCandidates(null)}
            className="self-start text-sm text-ink-secondary hover:text-ink"
          >
            Search again
          </button>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      );
    }

    return (
      <form action={handleSchoolSearch} className="flex flex-col gap-3">
        <p className="text-sm text-ink-secondary">
          Found <span className="font-medium">{student.name}</span> ({student.dob}). Now search for the releasing
          school by name.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-secondary">Releasing school name</label>
            <input name="name" required className="w-64 rounded-md border border-border px-2 py-1.5 text-sm" />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            Search school
          </button>
          <button
            type="button"
            onClick={() => setStudent(null)}
            className="rounded-md border border-border px-4 py-1.5 text-sm font-medium hover:bg-primary-light"
          >
            Back
          </button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    );
  }

  if (studentCandidates) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-secondary">Select the student this request is for:</p>
        <ul className="flex flex-col gap-2">
          {studentCandidates.map((c) => (
            <li
              key={c.platform_student_id}
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
            >
              <span>
                {c.name} ({c.dob}) — <span className="font-medium">{c.confidence}</span> confidence
              </span>
              <button
                type="button"
                onClick={() => setStudent(c)}
                className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-primary-light"
              >
                Select
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setStudentCandidates(null)}
          className="self-start text-sm text-ink-secondary hover:text-ink"
        >
          Search again
        </button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <form action={handleStudentSearch} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Student name</label>
        <input name="name" required className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-secondary">Date of birth</label>
        <input name="dob" type="date" required className="rounded-md border border-border px-2 py-1.5 text-sm" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        Find student
      </button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}
