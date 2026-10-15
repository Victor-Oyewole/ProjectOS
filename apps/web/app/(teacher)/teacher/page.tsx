import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherDashboardPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "teacher" || !claims.teacher_id) {
    redirect("/login");
  }

  const [{ data: teacher }, { data: classAssignments }] = await Promise.all([
    supabase.from("Teacher").select("name").eq("teacher_id", claims.teacher_id).single(),
    supabase
      .from("TeacherClassAssignment")
      .select("assignment_id, Class(name), Subject(name)")
      .eq("teacher_id", claims.teacher_id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">
        {teacher?.name ? `Welcome, ${teacher.name}` : "Welcome"}
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">My classes</h2>
        <ul className="flex flex-col gap-2">
          {(classAssignments ?? []).map((ca) => (
            <li
              key={ca.assignment_id}
              className="rounded-md border border-border p-3 text-sm"
            >
              {ca.Class?.name} — {ca.Subject?.name}
            </li>
          ))}
          {(classAssignments ?? []).length === 0 ? (
            <li className="text-sm text-ink-secondary">
              No classes assigned yet -- ask your school admin to set this up.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/teacher/assignments"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            New assignment
          </Link>
          <Link
            href="/teacher/attendance"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Take attendance
          </Link>
          <Link
            href="/teacher/scores"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Enter scores
          </Link>
        </div>
      </section>
    </div>
  );
}
