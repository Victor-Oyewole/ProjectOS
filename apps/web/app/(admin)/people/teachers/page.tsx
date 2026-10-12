import { createServerClient } from "@schoolos/db";
import { TeacherForm } from "./teacher-form";

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
            className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"
          >
            <span>
              {teacher.name}
              {teacher.staff_id ? <span className="text-slate-500"> ({teacher.staff_id})</span> : null}
            </span>
            <span className="text-xs text-slate-500">{teacher.activation_status}</span>
          </li>
        ))}
        {(teachers ?? []).length === 0 ? (
          <li className="text-sm text-slate-500">No teachers yet.</li>
        ) : null}
      </ul>
      <TeacherForm />
    </div>
  );
}
