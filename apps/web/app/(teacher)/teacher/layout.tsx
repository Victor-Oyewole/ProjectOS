import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// Doc 14's Teacher Dashboard wireframe nav: "Dashboard | My Classes |
// Assignments | Attendance | Assessments | Timetable | Notifications | My
// Profile." Timetable/Notifications/My Profile aren't in Doc 16 Milestone
// 2's scope (no Timetable schema exists yet, Notifications is the family-
// facing Notification Box which is Milestone 3) -- this nav only links what
// this milestone actually builds.
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "teacher") {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <nav className="flex gap-4 border-b border-slate-200 text-sm font-medium">
        <Link href="/teacher" className="px-1 pb-3 hover:text-slate-900">
          Dashboard
        </Link>
        <Link href="/teacher/assignments" className="px-1 pb-3 hover:text-slate-900">
          Assignments
        </Link>
        <Link href="/teacher/attendance" className="px-1 pb-3 hover:text-slate-900">
          Attendance
        </Link>
        <Link href="/teacher/scores" className="px-1 pb-3 hover:text-slate-900">
          Scores
        </Link>
      </nav>
      {children}
    </main>
  );
}
