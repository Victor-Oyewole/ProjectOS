import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

// Doc 13 #4 Screen 4: "Tabs: Assignments / Attendance / Results / Daily
// Notes / Academic History." Academic History is transfer-record history
// (Doc 7/Milestone 5) -- not built yet, left off this nav rather than
// shown as a dead tab. Fees (Screen 6) is Milestone 4, now built.
//
// No explicit ownership check here beyond what each page's own query
// returns -- SchoolEnrollment/ClassMembership/etc. RLS already scopes every
// read to the caller's own linked children (FamilyStudentRelationship), so
// a family member can't reach another family's child's data by guessing an
// enrollment_id; the query just comes back empty and the page 404s.
export default async function ChildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "family" || !claims.membership_id) {
    redirect("/login");
  }

  const { data: enrollment } = await supabase
    .from("SchoolEnrollment")
    .select("platform_student_id, PlatformStudent(name)")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();

  if (!enrollment) {
    notFound();
  }

  const base = `/family/children/${enrollmentId}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{enrollment.PlatformStudent?.name}</h1>
      <nav className="flex gap-4 border-b border-border text-sm font-medium">
        <Link href={base} className="px-1 pb-3 hover:text-ink transition-colors duration-fast ease-standard">
          Overview
        </Link>
        <Link href={`${base}/assignments`} className="px-1 pb-3 hover:text-ink transition-colors duration-fast ease-standard">
          Assignments
        </Link>
        <Link href={`${base}/attendance`} className="px-1 pb-3 hover:text-ink transition-colors duration-fast ease-standard">
          Attendance
        </Link>
        <Link href={`${base}/results`} className="px-1 pb-3 hover:text-ink transition-colors duration-fast ease-standard">
          Results
        </Link>
        <Link href={`${base}/daily-notes`} className="px-1 pb-3 hover:text-ink transition-colors duration-fast ease-standard">
          Daily notes
        </Link>
        <Link href={`${base}/fees`} className="px-1 pb-3 hover:text-ink transition-colors duration-fast ease-standard">
          Fees
        </Link>
      </nav>
      {children}
    </div>
  );
}
