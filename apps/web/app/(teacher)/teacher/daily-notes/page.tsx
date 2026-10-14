import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { DailyNoteForm } from "./daily-note-form";

export default async function TeacherDailyNotesPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "teacher" || !claims.teacher_id) {
    redirect("/login");
  }

  const [{ data: classAssignments }, { data: notes }] = await Promise.all([
    supabase.from("TeacherClassAssignment").select("class_id, Class(name)").eq("teacher_id", claims.teacher_id),
    supabase
      .from("DailyNote")
      .select("note_id, category, note_text, date, SchoolEnrollment(PlatformStudent(name))")
      .eq("teacher_id", claims.teacher_id)
      .order("created_at", { ascending: false }),
  ]);

  const classIds = Array.from(
    new Map((classAssignments ?? []).filter((ca) => ca.Class).map((ca) => [ca.class_id, ca.Class!.name])),
  );

  let students: { enrollmentId: string; classId: string; name: string }[] = [];
  if (classIds.length > 0) {
    const { data: memberships } = await supabase
      .from("ClassMembership")
      .select("enrollment_id, class_id, SchoolEnrollment(PlatformStudent(name))")
      .in(
        "class_id",
        classIds.map(([id]) => id),
      )
      .is("end_date", null);
    students = (memberships ?? [])
      .filter((m) => m.SchoolEnrollment?.PlatformStudent)
      .map((m) => ({ enrollmentId: m.enrollment_id, classId: m.class_id, name: m.SchoolEnrollment!.PlatformStudent!.name }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Daily notes</h1>
        <p className="mt-1 text-sm text-slate-600">
          One-way notes to a family about a specific student. Sent notes can&rsquo;t be edited --
          send a new note to correct one.
        </p>
      </div>

      <DailyNoteForm
        classes={classIds.map(([id, name]) => ({ classId: id, className: name }))}
        students={students}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Sent notes</h2>
        <ul className="flex flex-col gap-2">
          {(notes ?? []).map((n) => (
            <li key={n.note_id} className="rounded-md border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{n.SchoolEnrollment?.PlatformStudent?.name}</span>
                <span className="text-xs text-slate-500">
                  {n.category} — {n.date}
                </span>
              </div>
              <p className="mt-1 text-slate-700">{n.note_text}</p>
            </li>
          ))}
          {(notes ?? []).length === 0 ? <li className="text-sm text-slate-500">No notes sent yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
