import { createServerClient, getSessionClaims } from "@schoolos/db";
import { NextResponse } from "next/server";

// Doc 13 #5 Screen 1: "[Export CSV]." Reuses the same filter/row logic as
// the Fee Overview page -- a Route Handler rather than a Server Action
// since this needs to return a downloadable file with real HTTP headers,
// not a form-submission result.
function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const claims = await getSessionClaims(supabase);
  if (claims?.app_role !== "admin") {
    return NextResponse.json({ error: "Not signed in as a school admin." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const termId = searchParams.get("termId");
  const classId = searchParams.get("classId");
  const status = searchParams.get("status");
  if (!termId) {
    return NextResponse.json({ error: "termId is required" }, { status: 400 });
  }

  const { data: enrollments } = await supabase
    .from("SchoolEnrollment")
    .select("enrollment_id, PlatformStudent(name), ClassMembership(class_id, end_date, Class(name))")
    .eq("status", "Active");

  const { data: feeRecords } = await supabase
    .from("FeeRecord")
    .select("enrollment_id, amount_expected, amount_paid, status")
    .eq("term_id", termId);
  const feeByEnrollment = new Map((feeRecords ?? []).map((f) => [f.enrollment_id, f]));

  const rows = (enrollments ?? [])
    .map((e) => {
      const currentMembership = e.ClassMembership.find((cm) => cm.end_date === null);
      if (classId && currentMembership?.class_id !== classId) return null;
      const fee = feeByEnrollment.get(e.enrollment_id);
      const rowStatus = fee?.status ?? "Owing";
      if (status && rowStatus !== status) return null;
      return {
        name: e.PlatformStudent?.name ?? "—",
        className: currentMembership?.Class?.name ?? "—",
        amountExpected: fee?.amount_expected ?? 0,
        amountPaid: fee?.amount_paid ?? 0,
        status: rowStatus,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const header = ["Student", "Class", "Expected", "Paid", "Status"];
  const lines = [
    header.join(","),
    ...rows.map((r) => [r.name, r.className, r.amountExpected, r.amountPaid, r.status].map(csvEscape).join(",")),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fee-status-${termId}.csv"`,
    },
  });
}
