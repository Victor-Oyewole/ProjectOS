import { createServerClient } from "@schoolos/db";
import { FamilyForm } from "./family-form";
import { FamilyCsvImport } from "./family-csv-import";

export default async function FamiliesPage() {
  const supabase = await createServerClient();
  const [{ data: memberships }, { data: enrollments }] = await Promise.all([
    supabase
      .from("FamilyMembership")
      .select("membership_id, status, Guardian(name, relationship)")
      .order("created_at", { ascending: false }),
    supabase.from("SchoolEnrollment").select("PlatformStudent(platform_student_id, name)"),
  ]);

  const students = (enrollments ?? [])
    .map((e) => e.PlatformStudent)
    .filter((s): s is { platform_student_id: string; name: string } => Boolean(s));

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {(memberships ?? []).map((membership) => (
          <li
            key={membership.membership_id}
            className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"
          >
            <span>
              {membership.Guardian.map((g) => g.name).join(", ") || "(unnamed guardian)"}
            </span>
            <span className="text-xs text-slate-500">{membership.status}</span>
          </li>
        ))}
        {(memberships ?? []).length === 0 ? (
          <li className="text-sm text-slate-500">No families yet.</li>
        ) : null}
      </ul>
      <FamilyForm students={students} />
      <FamilyCsvImport />
    </div>
  );
}
