import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// Doc 14's Teacher Dashboard wireframe nav: "Dashboard | My Classes |
// Assignments | Attendance | Assessments | Timetable | Notifications | My
// Profile." Timetable/My Profile aren't in any Doc 16 milestone's scope yet
// (no Timetable schema exists, and no doc specifies a teacher profile
// screen) -- this nav only links what's actually built. Daily Notes is Doc
// 16 Milestone 3 scope ("Daily notes (teacher -> parent, one-way)") -- the
// family-facing read side lives in Milestone 3's /family app, but someone
// has to write them, and Doc 13 never gave that its own teacher screen, so
// it's added here alongside the rest of the teacher nav.
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
        <Link href="/teacher/daily-notes" className="px-1 pb-3 hover:text-slate-900">
          Daily notes
        </Link>
      </nav>
      {children}
    </main>
  );
}
