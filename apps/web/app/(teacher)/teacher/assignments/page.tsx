import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { AssignmentForm } from "./assignment-form";
import { RetractButton } from "./retract-button";

export default async function TeacherAssignmentsPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "teacher" || !claims.teacher_id) {
    redirect("/login");
  }

  const [{ data: classAssignments }, { data: assignments }] = await Promise.all([
    supabase
      .from("TeacherClassAssignment")
      .select("class_id, subject_id, Class(name), Subject(name)")
      .eq("teacher_id", claims.teacher_id),
    supabase
      .from("Assignment")
      .select("assignment_id, title, status, available_at, due_at, Class(name), Subject(name)")
      .eq("teacher_id", claims.teacher_id)
      .order("created_at", { ascending: false }),
  ]);

  const classSubjects = (classAssignments ?? [])
    .filter((ca) => ca.Class && ca.Subject)
    .map((ca) => ({
      classId: ca.class_id,
      className: ca.Class!.name,
      subjectId: ca.subject_id,
      subjectName: ca.Subject!.name,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Scheduling one notifies every enrolled family automatically.
        </p>
      </div>

      <AssignmentForm classSubjects={classSubjects} />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">My assignments</h2>
        <ul className="flex flex-col gap-2">
          {(assignments ?? []).map((a) => (
            <li
              key={a.assignment_id}
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
            >
              <span>
                {a.title}{" "}
                <span className="text-ink-secondary">
                  ({a.Class?.name} — {a.Subject?.name})
                </span>
                <span className="ml-2 text-xs text-ink-secondary">{a.status}</span>
              </span>
              {a.status === "Published" ? <RetractButton assignmentId={a.assignment_id} /> : null}
            </li>
          ))}
          {(assignments ?? []).length === 0 ? (
            <li className="text-sm text-ink-secondary">No assignments yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
