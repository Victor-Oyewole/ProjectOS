import { createServerClient } from "@schoolos/db";
import { StudentForm } from "./student-form";
import { StudentCsvImport } from "./student-csv-import";

export default async function StudentsPage() {
  const supabase = await createServerClient();
  const [{ data: enrollments }, { data: classes }] = await Promise.all([
    supabase
      .from("SchoolEnrollment")
      .select("enrollment_id, status, PlatformStudent(platform_student_id, name, dob)")
      .order("start_date", { ascending: false }),
    supabase.from("Class").select("class_id, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {(enrollments ?? []).map((enrollment) => (
          <li
            key={enrollment.enrollment_id}
            className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
          >
            <span>
              {enrollment.PlatformStudent?.name}{" "}
              <span className="text-ink-secondary">({enrollment.PlatformStudent?.dob})</span>
            </span>
            <span className="text-xs text-ink-secondary">{enrollment.status}</span>
          </li>
        ))}
        {(enrollments ?? []).length === 0 ? (
          <li className="text-sm text-ink-secondary">No students yet.</li>
        ) : null}
      </ul>
      <StudentForm classes={classes ?? []} />
      <StudentCsvImport />
    </div>
  );
}
