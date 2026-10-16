import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AddGradeBandForm,
  AddMilestoneLevelForm,
  ASSESSMENT_MODEL_LABELS,
  AssessmentModelForm,
  AssessmentWeightForm,
  AssignTeacherForm,
  NewAssessmentForm,
  NewClassForm,
  NewSessionForm,
  NewSubjectForm,
  NewTermForm,
  RemoveGradeBandButton,
  RemoveMilestoneLevelButton,
  SubjectCreditWeightForm,
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

  const [
    { data: school },
    { data: sessions },
    { data: classes },
    { data: subjects },
    { data: teachers },
    { data: teacherAssignments },
    { data: assessments },
    { data: gradeScale },
    { data: milestoneScale },
  ] = await Promise.all([
    supabase.from("School").select("assessment_model").single(),
    supabase
      .from("AcademicSession")
      .select("session_id, name, start_date, end_date, Term(term_id, name, start_date, end_date)")
      .order("start_date", { ascending: false }),
    supabase.from("Class").select("class_id, name").order("name"),
    supabase.from("Subject").select("subject_id, name, credit_weight").order("name"),
    supabase.from("Teacher").select("teacher_id, name").order("name"),
    supabase
      .from("TeacherClassAssignment")
      .select("assignment_id, Teacher(name), Class(name), Subject(name), AcademicSession(name)"),
    supabase.from("Assessment").select("assessment_id, name, weight, Class(name), Subject(name), Term(name)"),
    supabase.from("GradeScale").select("bands").maybeSingle(),
    supabase.from("MilestoneScale").select("levels").maybeSingle(),
  ]);

  const assessmentModel = school?.assessment_model ?? "equal_weight";
  const isNarrative = assessmentModel === "narrative_milestone";
  const gradeBands = (Array.isArray(gradeScale?.bands) ? gradeScale.bands : []) as {
    min: number;
    max: number;
    grade: string;
    remark?: string;
  }[];
  const milestoneLevels = (Array.isArray(milestoneScale?.levels) ? milestoneScale.levels : []) as string[];

  const terms = (sessions ?? []).flatMap((s) => s.Term.map((t) => ({ id: t.term_id, name: `${s.name} — ${t.name}` })));

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Academic setup</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Create at least one session, term, class, and subject before adding teachers, students,
          or families.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Academic sessions</h2>
        <ul className="flex flex-col gap-3">
          {(sessions ?? []).map((session) => (
            <li key={session.session_id} className="rounded-md border border-border p-3">
              <p className="font-medium">
                {session.name}{" "}
                <span className="font-normal text-ink-secondary">
                  ({session.start_date} – {session.end_date})
                </span>
              </p>
              {session.Term.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 pl-4 text-sm text-ink-secondary">
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
            <li className="text-sm text-ink-secondary">No sessions yet.</li>
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
              className="rounded-full border border-border px-3 py-1 text-sm"
            >
              {klass.name}
            </li>
          ))}
          {(classes ?? []).length === 0 ? (
            <li className="text-sm text-ink-secondary">No classes yet.</li>
          ) : null}
        </ul>
        <NewClassForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Assessment model</h2>
        <p className="text-sm text-ink-secondary">
          Chosen once during setup — equal-weight and credit-weighted both produce numeric grades;
          narrative/milestone is for developmental-assessment schools (no scores, no grades).
          Changing this is blocked once results have been computed.
        </p>
        <p className="text-sm">
          Current: <span className="font-medium">{ASSESSMENT_MODEL_LABELS[assessmentModel] ?? assessmentModel}</span>
        </p>
        <AssessmentModelForm current={assessmentModel} />
      </section>

      {isNarrative ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Milestone levels</h2>
          <p className="text-sm text-ink-secondary">
            Ordered developmental levels teachers will pick from (e.g. Emerging, Expected, Exceeding).
          </p>
          <ul className="flex flex-col gap-2">
            {milestoneLevels.map((level, i) => (
              <li key={`${level}-${i}`} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span>
                  {i + 1}. {level}
                </span>
                <RemoveMilestoneLevelButton index={i} />
              </li>
            ))}
            {milestoneLevels.length === 0 ? (
              <li className="text-sm text-ink-secondary">No milestone levels yet.</li>
            ) : null}
          </ul>
          <AddMilestoneLevelForm />
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Grade scale</h2>
          <p className="text-sm text-ink-secondary">
            Score bands used to look up a letter grade when results are computed.
          </p>
          <ul className="flex flex-col gap-2">
            {gradeBands.map((band, i) => (
              <li key={i} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span>
                  {band.min}–{band.max}: <span className="font-medium">{band.grade}</span>
                  {band.remark ? <span className="text-ink-secondary"> ({band.remark})</span> : null}
                </span>
                <RemoveGradeBandButton index={i} />
              </li>
            ))}
            {gradeBands.length === 0 ? <li className="text-sm text-ink-secondary">No grade bands yet.</li> : null}
          </ul>
          <AddGradeBandForm />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{isNarrative ? "Developmental areas" : "Subjects"}</h2>
        <ul className="flex flex-col gap-2">
          {(subjects ?? []).map((subject) => (
            <li
              key={subject.subject_id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>{subject.name}</span>
              {assessmentModel === "credit_weighted" ? (
                <SubjectCreditWeightForm subjectId={subject.subject_id} current={subject.credit_weight} />
              ) : null}
            </li>
          ))}
          {(subjects ?? []).length === 0 ? (
            <li className="text-sm text-ink-secondary">
              No {isNarrative ? "developmental areas" : "subjects"} yet.
            </li>
          ) : null}
        </ul>
        <NewSubjectForm
          showCreditWeight={assessmentModel === "credit_weighted"}
          label={isNarrative ? "Developmental area name" : undefined}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Teacher assignments</h2>
        <ul className="flex flex-col gap-2">
          {(teacherAssignments ?? []).map((ta) => (
            <li key={ta.assignment_id} className="rounded-md border border-border p-3 text-sm">
              {ta.Teacher?.name} — {ta.Class?.name} — {ta.Subject?.name}{" "}
              <span className="text-ink-secondary">({ta.AcademicSession?.name})</span>
            </li>
          ))}
          {(teacherAssignments ?? []).length === 0 ? (
            <li className="text-sm text-ink-secondary">No teacher assignments yet.</li>
          ) : null}
        </ul>
        <AssignTeacherForm
          teachers={(teachers ?? []).map((t) => ({ id: t.teacher_id, name: t.name }))}
          classes={(classes ?? []).map((c) => ({ id: c.class_id, name: c.name }))}
          subjects={(subjects ?? []).map((s) => ({ id: s.subject_id, name: s.name }))}
          sessions={(sessions ?? []).map((s) => ({ id: s.session_id, name: s.name }))}
        />
      </section>

      {isNarrative ? null : (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Assessments</h2>
          <p className="text-sm text-ink-secondary">
            Each subject&apos;s assessment weights (within a class/term) must sum to 100% before
            results can be computed for that subject.
          </p>
          <ul className="flex flex-col gap-2">
            {(assessments ?? []).map((a) => (
              <li
                key={a.assessment_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
              >
                <span>
                  {a.name} — {a.Class?.name} — {a.Subject?.name}{" "}
                  <span className="text-ink-secondary">({a.Term?.name})</span>
                </span>
                <AssessmentWeightForm assessmentId={a.assessment_id} current={a.weight} />
              </li>
            ))}
            {(assessments ?? []).length === 0 ? (
              <li className="text-sm text-ink-secondary">No assessments yet.</li>
            ) : null}
          </ul>
          <NewAssessmentForm
            classes={(classes ?? []).map((c) => ({ id: c.class_id, name: c.name }))}
            subjects={(subjects ?? []).map((s) => ({ id: s.subject_id, name: s.name }))}
            terms={terms}
          />
        </section>
      )}

      <Link
        href="/admins"
        className="self-start rounded-md bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark transition-colors duration-fast ease-standard"
      >
        Save &amp; continue
      </Link>
    </main>
  );
}
