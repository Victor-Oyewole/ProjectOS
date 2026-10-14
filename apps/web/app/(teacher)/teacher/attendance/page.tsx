import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { AttendanceForm } from "./attendance-form";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { classId } = await searchParams;
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "teacher" || !claims.teacher_id) {
    redirect("/login");
  }

  const { data: classAssignments } = await supabase
    .from("TeacherClassAssignment")
    .select("class_id, Class(name)")
    .eq("teacher_id", claims.teacher_id);

  const classes = new Map<string, string>();
  for (const ca of classAssignments ?? []) {
    if (ca.Class) classes.set(ca.class_id, ca.Class.name);
  }

  let students: { enrollmentId: string; name: string; status: "Present" | "Absent" | "Late" | null }[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (classId && classes.has(classId)) {
    const [{ data: memberships }, { data: todayAttendance }] = await Promise.all([
      supabase
        .from("ClassMembership")
        .select("enrollment_id, SchoolEnrollment(platform_student_id, PlatformStudent(name))")
        .eq("class_id", classId)
        .is("end_date", null),
      supabase.from("Attendance").select("enrollment_id, status").eq("class_id", classId).eq("date", today),
    ]);

    const statusByEnrollment = new Map((todayAttendance ?? []).map((a) => [a.enrollment_id, a.status]));

    students = (memberships ?? [])
      .filter((m) => m.SchoolEnrollment?.PlatformStudent)
      .map((m) => ({
        enrollmentId: m.enrollment_id,
        name: m.SchoolEnrollment!.PlatformStudent!.name,
        status: (statusByEnrollment.get(m.enrollment_id) as "Present" | "Absent" | "Late" | undefined) ?? null,
      }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="mt-1 text-sm text-slate-600">Editable same-day only; locked after midnight.</p>
      </div>

      <form method="get" className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Class</label>
          <select
            name="classId"
            defaultValue={classId ?? ""}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {Array.from(classes, ([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-100"
        >
          Load class
        </button>
      </form>

      {classId && classes.has(classId) ? (
        <AttendanceForm classId={classId} date={today} students={students} />
      ) : null}
    </div>
  );
}
