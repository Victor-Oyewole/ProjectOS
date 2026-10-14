import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  NewSessionForm,
  NewTermForm,
  NewClassForm,
  NewSubjectForm,
  AssignTeacherForm,
  NewAssessmentForm,
} from "./forms";

// Doc 12 Step 2: Academic Setup -- "required before people can be added."
// Also carries two Milestone 2 building blocks that have nowhere else to
// live: which teacher teaches which class/subject (needed before any
// teacher-side screen has something to show), and assessment definitions
// ("grading rules/weighting controlled by admin, not teacher," Doc 13 #3).
// Both are revisited after People Setup in practice, since teachers don't
// exist yet the first time an admin passes through this page -- the forms
// below degrade to a plain message until there's a teacher to assign.
export default async function AcademicSetupPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    redirect("/login");
  }

  const [{ data: sessions }, { data: classes }, { data: subjects }, { data: teachers }, { data: teacherAssignments }, { data: assessments }] =
    await Promise.all([
      supabase
        .from("AcademicSession")
        .select("session_id, name, start_date, end_date, Term(term_id, name, start_date, end_date)")
        .order("start_date", { ascending: false }),
      supabase.from("Class").select("class_id, name").order("name"),
      supabase.from("Subject").select("subject_id, name").order("name"),
      supabase.from("Teacher").select("teacher_id, name").order("name"),
      supabase
        .from("TeacherClassAssignment")
        .select("assignment_id, Teacher(name), Class(name), Subject(name), AcademicSession(name)"),
      supabase.from("Assessment").select("assessment_id, name, Class(name), Subject(name), Term(name)"),
    ]);

  const terms = (sessions ?? []).flatMap((s) => s.Term.map((t) => ({ id: t.term_id, name: `${s.name} — ${t.name}` })));

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Academic setup</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create at least one session, term, class, and subject before adding teachers, students,
          or families.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Academic sessions</h2>
        <ul className="flex flex-col gap-3">
          {(sessions ?? []).map((session) => (
            <li key={session.session_id} className="rounded-md border border-slate-200 p-3">
              <p className="font-medium">
                {session.name}{" "}
                <span className="font-normal text-slate-500">
                  ({session.start_date} – {session.end_date})
                </span>
              </p>
              {session.Term.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 pl-4 text-sm text-slate-600">
                  {session.Term.map((term) => (
                    <li key={term.term_id}>
                      {term.name}: {term.start_date} – {term.end_date}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2">
                <NewTermForm sessionId={session.session_id} />
              </div>
            </li>
          ))}
          {(sessions ?? []).length === 0 ? (
            <li className="text-sm text-slate-500">No sessions yet.</li>
          ) : null}
        </ul>
        <NewSessionForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Classes</h2>
        <ul className="flex flex-wrap gap-2">
          {(classes ?? []).map((klass) => (
            <li
              key={klass.class_id}
              className="rounded-full border border-slate-300 px-3 py-1 text-sm"
            >
              {klass.name}
            </li>
          ))}
          {(classes ?? []).length === 0 ? (
            <li className="text-sm text-slate-500">No classes yet.</li>
          ) : null}
        </ul>
        <NewClassForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Subjects</h2>
        <ul className="flex flex-wrap gap-2">
          {(subjects ?? []).map((subject) => (
            <li
              key={subject.subject_id}
              className="rounded-full border border-slate-300 px-3 py-1 text-sm"
            >
              {subject.name}
            </li>
          ))}
          {(subjects ?? []).length === 0 ? (
            <li className="text-sm text-slate-500">No subjects yet.</li>
          ) : null}
        </ul>
        <NewSubjectForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Teacher assignments</h2>
        <ul className="flex flex-col gap-2">
          {(teacherAssignments ?? []).map((ta) => (
            <li key={ta.assignment_id} className="rounded-md border border-slate-200 p-3 text-sm">
              {ta.Teacher?.name} — {ta.Class?.name} — {ta.Subject?.name}{" "}
              <span className="text-slate-500">({ta.AcademicSession?.name})</span>
            </li>
          ))}
          {(teacherAssignments ?? []).length === 0 ? (
            <li className="text-sm text-slate-500">No teacher assignments yet.</li>
          ) : null}
        </ul>
        <AssignTeacherForm
          teachers={(teachers ?? []).map((t) => ({ id: t.teacher_id, name: t.name }))}
          classes={(classes ?? []).map((c) => ({ id: c.class_id, name: c.name }))}
          subjects={(subjects ?? []).map((s) => ({ id: s.subject_id, name: s.name }))}
          sessions={(sessions ?? []).map((s) => ({ id: s.session_id, name: s.name }))}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Assessments</h2>
        <ul className="flex flex-col gap-2">
          {(assessments ?? []).map((a) => (
            <li key={a.assessment_id} className="rounded-md border border-slate-200 p-3 text-sm">
              {a.name} — {a.Class?.name} — {a.Subject?.name}{" "}
              <span className="text-slate-500">({a.Term?.name})</span>
            </li>
          ))}
          {(assessments ?? []).length === 0 ? (
            <li className="text-sm text-slate-500">No assessments yet.</li>
          ) : null}
        </ul>
        <NewAssessmentForm
          classes={(classes ?? []).map((c) => ({ id: c.class_id, name: c.name }))}
          subjects={(subjects ?? []).map((s) => ({ id: s.subject_id, name: s.name }))}
          terms={terms}
        />
      </section>

      <Link
        href="/admins"
        className="self-start rounded-md bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
      >
        Save &amp; continue
      </Link>
    </main>
  );
}
