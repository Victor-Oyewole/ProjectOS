import { createServerClient } from "@schoolos/db";
import { TeacherForm } from "./teacher-form";
import { TeacherCsvImport } from "./teacher-csv-import";

export default async function TeachersPage() {
  const supabase = await createServerClient();
  const { data: teachers } = await supabase
    .from("Teacher")
    .select("teacher_id, name, staff_id, activation_status")
    .order("name");

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {(teachers ?? []).map((teacher) => (
          <li
            key={teacher.teacher_id}
            className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
          >
            <span>
              {teacher.name}
              {teacher.staff_id ? <span className="text-ink-secondary"> ({teacher.staff_id})</span> : null}
            </span>
            <span className="text-xs text-ink-secondary">{teacher.activation_status}</span>
          </li>
        ))}
        {(teachers ?? []).length === 0 ? (
          <li className="text-sm text-ink-secondary">No teachers yet.</li>
        ) : null}
      </ul>
      <TeacherForm />
      <TeacherCsvImport />
    </div>
  );
}
