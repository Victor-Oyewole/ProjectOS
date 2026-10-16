"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logged } from "@/lib/action-log";

// Doc 13 #5 Screen 2: "Record Payment (per student): Term, amount
// received, method, date, notes -> writes to FeeRecord, triggers status
// recompute." FeeRecord already has complete admin RLS (050_fees.sql,
// "all" scoped via SchoolEnrollment join) and a DB trigger that recomputes
// status/last_updated_at/version on every write (migration 007) -- this is
// a plain client upsert, same reasoning as attendance/scores. amount_paid
// is CUMULATIVE (each call adds the newly received amount to whatever was
// already paid, matching "amount received" as a single payment event, not
// a running total the admin re-types each time); amount_expected is set
// directly, since nothing else in this codebase sets it.
const RecordPaymentSchema = z.object({
  enrollmentId: z.string().uuid(),
  termId: z.string().uuid(),
  amountExpected: z.coerce.number().min(0),
  amountReceived: z.coerce.number().min(0),
  paymentMethod: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function recordPayment(formData: FormData): Promise<{ error?: string }> {
  return logged("fees.recordPayment", async () => {
    const parsed = RecordPaymentSchema.safeParse({
      enrollmentId: formData.get("enrollmentId"),
      termId: formData.get("termId"),
      amountExpected: formData.get("amountExpected"),
      amountReceived: formData.get("amountReceived"),
      paymentMethod: formData.get("paymentMethod") || undefined,
      notes: formData.get("notes") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, adminId } = await requireAdminSchoolId();

    const { data: existing } = await supabase
      .from("FeeRecord")
      .select("amount_paid")
      .eq("enrollment_id", parsed.data.enrollmentId)
      .eq("term_id", parsed.data.termId)
      .maybeSingle();

    const newAmountPaid = (existing?.amount_paid ?? 0) + parsed.data.amountReceived;

    const { error } = await supabase.from("FeeRecord").upsert(
      {
        enrollment_id: parsed.data.enrollmentId,
        term_id: parsed.data.termId,
        amount_expected: parsed.data.amountExpected,
        amount_paid: newAmountPaid,
        payment_method: parsed.data.paymentMethod ?? null,
        notes: parsed.data.notes ?? null,
        payment_date: parsed.data.amountReceived > 0 ? new Date().toISOString().slice(0, 10) : null,
        last_updated_by: adminId ?? null,
      },
      { onConflict: "enrollment_id,term_id" },
    );
    if (error) return { error: error.message };

    revalidatePath("/fees");
    return {};
  });
}

// Doc 13 #5 Screen 3 / Doc 9: "Send Reminder: Generates in-app Notification
// Box entries for Owing/Partial families for the selected term." Notification
// already has an admin insert policy covering exactly this shape
// (source_type='admin', category='fee', scoped to the caller's own
// school), so this is a plain client insert -- one row per distinct family
// membership linked to each Owing/Partial student for that term, same
// fan-out/dedup reasoning as the assignment-notification fan-out
// (migration 043), just done client-side here since there's no
// cross-table atomicity requirement RLS alone can't express.
const SendRemindersSchema = z.object({
  termId: z.string().uuid(),
});

export async function sendFeeReminders(formData: FormData): Promise<{ error?: string; count?: number }> {
  return logged("fees.sendFeeReminders", async () => {
    const parsed = SendRemindersSchema.safeParse({ termId: formData.get("termId") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();

    // No explicit school filter here -- feerecord_all_admin's RLS policy
    // already scopes every row to the caller's own school via the same
    // SchoolEnrollment join; `!inner` just guarantees the join is non-null
    // so it's safe to read without an extra null check below.
    const { data: records, error: fetchError } = await supabase
      .from("FeeRecord")
      .select("amount_expected, amount_paid, status, SchoolEnrollment!inner(platform_student_id, PlatformStudent(name))")
      .eq("term_id", parsed.data.termId)
      .in("status", ["Owing", "Partial"]);
    if (fetchError) return { error: fetchError.message };

    const rows = records ?? [];
    if (rows.length === 0) return { count: 0 };

    const platformStudentIds = [...new Set(rows.map((r) => r.SchoolEnrollment.platform_student_id))];
    const { data: relationships, error: relError } = await supabase
      .from("FamilyStudentRelationship")
      .select("membership_id, platform_student_id")
      .in("platform_student_id", platformStudentIds);
    if (relError) return { error: relError.message };

    const notifications = rows.flatMap((r) => {
      const matches = (relationships ?? []).filter((rel) => rel.platform_student_id === r.SchoolEnrollment.platform_student_id);
      return matches.map((rel) => ({
        membership_id: rel.membership_id,
        platform_student_id: r.SchoolEnrollment.platform_student_id,
        source_type: "admin" as const,
        category: "fee" as const,
        message_text: `Fee reminder: ${r.SchoolEnrollment.PlatformStudent?.name ?? "your child"} has an outstanding balance (${r.status}) -- expected ${r.amount_expected}, paid ${r.amount_paid}.`,
      }));
    });

    // Dedup key is (membership_id, platform_student_id), not membership_id
    // alone -- a family with two owing children must get two reminders, one
    // per child, not one swallowing the other.
    const seen = new Set<string>();
    const deduped = notifications
      .filter((n) => {
        const key = `${n.membership_id}:${n.platform_student_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(({ platform_student_id, ...rest }) => rest);

    const { error: insertError } = await supabase.from("Notification").insert(deduped);
    if (insertError) return { error: insertError.message };

    return { count: deduped.length };
  });
}
