import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// Doc 13 #4 Screen 2 / Doc 14 wireframe: "Your Children -- card per child:
// name, class, quick status." The wireframe's "Attendance: Good" / "1 new
// announcement" phrasing implies qualitative judgment calls no doc actually
// defines thresholds for -- this shows concrete counts/latest status
// instead rather than inventing an unspecified "Good/Needs attention" scale.
export default async function FamilyDashboardPage() {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "family" || !claims.membership_id) {
    redirect("/login");
  }

  const { data: relationships } = await supabase
    .from("FamilyStudentRelationship")
    .select("platform_student_id, PlatformStudent(name)")
    .eq("membership_id", claims.membership_id);

  const children = await Promise.all(
    (relationships ?? []).map(async (rel) => {
      const { data: enrollment } = await supabase
        .from("SchoolEnrollment")
        .select("enrollment_id")
        .eq("platform_student_id", rel.platform_student_id)
        .eq("status", "Active")
        .maybeSingle();

      if (!enrollment) {
        return { platformStudentId: rel.platform_student_id, name: rel.PlatformStudent?.name ?? "—", className: null, enrollmentId: null, assignmentCount: 0, latestAttendance: null };
      }

      const { data: membership } = await supabase
        .from("ClassMembership")
        .select("class_id, Class(name)")
        .eq("enrollment_id", enrollment.enrollment_id)
        .is("end_date", null)
        .maybeSingle();

      let assignmentCount = 0;
      if (membership) {
        const { count } = await supabase
          .from("Assignment")
          .select("assignment_id", { count: "exact", head: true })
          .eq("class_id", membership.class_id)
          .eq("status", "Published")
          .lte("available_at", new Date().toISOString());
        assignmentCount = count ?? 0;
      }

      const { data: latestAttendance } = await supabase
        .from("Attendance")
        .select("status, date")
        .eq("enrollment_id", enrollment.enrollment_id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        platformStudentId: rel.platform_student_id,
        name: rel.PlatformStudent?.name ?? "—",
        className: membership?.Class?.name ?? null,
        enrollmentId: enrollment.enrollment_id,
        assignmentCount,
        latestAttendance: latestAttendance ?? null,
      };
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Your children</h1>
      <ul className="flex flex-col gap-3">
        {children.map((child) => (
          <li key={child.platformStudentId} className="rounded-md border border-border p-4">
            {child.enrollmentId ? (
              <Link href={`/family/children/${child.enrollmentId}`} className="font-medium hover:underline">
                {child.name}
              </Link>
            ) : (
              <span className="font-medium">{child.name}</span>
            )}
            <p className="mt-1 text-sm text-ink-secondary">
              {child.className ?? "No current class"}
              {" — "}
              {child.assignmentCount} assignment{child.assignmentCount === 1 ? "" : "s"} available
              {child.latestAttendance ? ` — last marked ${child.latestAttendance.status} (${child.latestAttendance.date})` : ""}
            </p>
          </li>
        ))}
        {children.length === 0 ? <li className="text-sm text-ink-secondary">No children linked to this account.</li> : null}
      </ul>
    </div>
  );
}
