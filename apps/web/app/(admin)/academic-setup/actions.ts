"use server";

import { requireAdminSchoolId } from "@schoolos/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logged } from "@/lib/action-log";

// Doc 12 Step 2: Academic Setup. All four creates are ordinary RLS-scoped
// inserts (academicsession_all_admin / term_all_admin / class_all_admin /
// subject_all_admin in 020_school_structure.sql already permit
// auth_app_role() = 'admin' AND school_id = auth_school_id()) -- unlike
// registration, no SECURITY DEFINER bootstrap function is needed here, the
// admin already has a real session by this point.

const SessionSchema = z.object({
  name: z.string().trim().min(1, "Session name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export async function createAcademicSession(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.createAcademicSession", async () => {
    const parsed = SessionSchema.safeParse({
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { error } = await supabase.from("AcademicSession").insert({
      school_id: schoolId,
      name: parsed.data.name,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    });
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

const TermSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().trim().min(1, "Term name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export async function createTerm(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.createTerm", async () => {
    const parsed = TermSchema.safeParse({
      sessionId: formData.get("sessionId"),
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();
    const { error } = await supabase.from("Term").insert({
      session_id: parsed.data.sessionId,
      name: parsed.data.name,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    });
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

const NameOnlySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export async function createClass(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.createClass", async () => {
    const parsed = NameOnlySchema.safeParse({ name: formData.get("name") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { error } = await supabase.from("Class").insert({ school_id: schoolId, name: parsed.data.name });
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

const SubjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  creditWeight: z.coerce.number().int().min(1).optional(),
});

export async function createSubject(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.createSubject", async () => {
    const parsed = SubjectSchema.safeParse({
      name: formData.get("name"),
      creditWeight: formData.get("creditWeight") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { error } = await supabase.from("Subject").insert({
      school_id: schoolId,
      name: parsed.data.name,
      ...(parsed.data.creditWeight ? { credit_weight: parsed.data.creditWeight } : {}),
    });
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

// Doc 27 Section 3: credit_weight is set per subject "during Academic
// Setup, when the school's assessment_model is credit_weighted" -- admin
// needs to be able to revise it after a subject already exists too, not
// just at creation, since subjects are usually added before the model is
// locked in.
const SubjectCreditWeightSchema = z.object({
  subjectId: z.string().uuid(),
  creditWeight: z.coerce.number().int().min(1, "Credit weight must be at least 1"),
});

export async function setSubjectCreditWeight(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.setSubjectCreditWeight", async () => {
    const parsed = SubjectCreditWeightSchema.safeParse({
      subjectId: formData.get("subjectId"),
      creditWeight: formData.get("creditWeight"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { error } = await supabase
      .from("Subject")
      .update({ credit_weight: parsed.data.creditWeight })
      .eq("subject_id", parsed.data.subjectId)
      .eq("school_id", schoolId);
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

// Doc 27 Section 1: "a school locks in one assessment model." Doc 27
// Section 8 explicitly leaves "changing assessment_model mid-session"
// unspecified and flags it as a follow-up -- rather than silently allowing
// a switch that would leave existing TermResult/TermReportCard rows
// computed under a now-wrong formula, this blocks the change once any
// results exist for the school at all. Before that point (fresh school,
// no results computed yet), switching freely is safe and necessary, since
// admin picks this during setup before data exists.
const AssessmentModelSchema = z.object({
  assessmentModel: z.enum(["equal_weight", "credit_weighted", "narrative_milestone"]),
});

export async function updateAssessmentModel(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.updateAssessmentModel", async () => {
    const parsed = AssessmentModelSchema.safeParse({ assessmentModel: formData.get("assessmentModel") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();

    const [{ count: resultCount }, { count: reportCount }] = await Promise.all([
      supabase.from("TermResult").select("result_id", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("TermReportCard").select("report_id", { count: "exact", head: true }).eq("school_id", schoolId),
    ]);
    if ((resultCount ?? 0) > 0 || (reportCount ?? 0) > 0) {
      return {
        error:
          "Cannot change the assessment model after results have been computed for this school. Contact support if a genuine switch is needed.",
      };
    }

    const { error } = await supabase
      .from("School")
      .update({ assessment_model: parsed.data.assessmentModel })
      .eq("school_id", schoolId);
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

// Doc 27 Section 5: GradeScale.bands is one jsonb array per school (unique
// school_id) -- "add a band" means read-modify-write the whole array, same
// shape as the MilestoneScale.levels functions below. Used by Option 1/2
// only; Option 3 (narrative) never looks at GradeScale.
const GradeBandSchema = z.object({
  min: z.coerce.number(),
  max: z.coerce.number(),
  grade: z.string().trim().min(1, "Grade label is required"),
  remark: z.string().trim().optional(),
});

export async function addGradeBand(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.addGradeBand", async () => {
    const parsed = GradeBandSchema.safeParse({
      min: formData.get("min"),
      max: formData.get("max"),
      grade: formData.get("grade"),
      remark: formData.get("remark") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    if (parsed.data.max < parsed.data.min) return { error: "Max must be greater than or equal to min" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { data: existing } = await supabase.from("GradeScale").select("bands").eq("school_id", schoolId).maybeSingle();
    const bands = Array.isArray(existing?.bands) ? existing.bands : [];
    bands.push({
      min: parsed.data.min,
      max: parsed.data.max,
      grade: parsed.data.grade,
      ...(parsed.data.remark ? { remark: parsed.data.remark } : {}),
    });

    const { error } = await supabase
      .from("GradeScale")
      .upsert({ school_id: schoolId, bands }, { onConflict: "school_id" });
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

const RemoveGradeBandSchema = z.object({ index: z.coerce.number().int().min(0) });

export async function removeGradeBand(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.removeGradeBand", async () => {
    const parsed = RemoveGradeBandSchema.safeParse({ index: formData.get("index") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { data: existing } = await supabase.from("GradeScale").select("bands").eq("school_id", schoolId).maybeSingle();
    const bands = Array.isArray(existing?.bands) ? existing.bands : [];
    bands.splice(parsed.data.index, 1);

    const { error } = await supabase.from("GradeScale").update({ bands }).eq("school_id", schoolId);
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

// Doc 27 Section 4: MilestoneScale.levels is an ordered array of
// school-defined labels, one row per school (unique school_id) -- same
// read-modify-write shape as GradeBand above.
const MilestoneLevelSchema = z.object({ level: z.string().trim().min(1, "Level name is required") });

export async function addMilestoneLevel(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.addMilestoneLevel", async () => {
    const parsed = MilestoneLevelSchema.safeParse({ level: formData.get("level") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { data: existing } = await supabase.from("MilestoneScale").select("levels").eq("school_id", schoolId).maybeSingle();
    const levels = (Array.isArray(existing?.levels) ? existing.levels : []) as string[];
    if (levels.includes(parsed.data.level)) return { error: "That level already exists" };
    levels.push(parsed.data.level);

    const { error } = await supabase
      .from("MilestoneScale")
      .upsert({ school_id: schoolId, levels }, { onConflict: "school_id" });
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

export async function removeMilestoneLevel(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.removeMilestoneLevel", async () => {
    const parsed = RemoveGradeBandSchema.safeParse({ index: formData.get("index") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { data: existing } = await supabase.from("MilestoneScale").select("levels").eq("school_id", schoolId).maybeSingle();
    const levels = (Array.isArray(existing?.levels) ? existing.levels : []) as string[];
    levels.splice(parsed.data.index, 1);

    const { error } = await supabase.from("MilestoneScale").update({ levels }).eq("school_id", schoolId);
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

// Doc 16 Milestone 2 needs two more admin-side building blocks the teacher
// workflow depends on, neither explicitly called out as its own Doc 12 step
// but both required before "Select Class (only classes assigned to this
// teacher)" (Doc 13 #1) or "Student Grid: Student | Test 1 | Test 2 | Exam"
// (Doc 13 #3) can have anything to show: which teacher teaches which
// class/subject (teacherclassassignment_all_admin, 040_people.sql), and
// assessment definitions ("grading rules/weighting controlled by admin, not
// teacher," Doc 13 #3 / assessment_all_admin, 060_academic_activity.sql).
// Both are plain RLS-scoped inserts, same reasoning as the four above.
const AssignTeacherSchema = z.object({
  teacherId: z.string().uuid("Select a teacher"),
  classId: z.string().uuid("Select a class"),
  subjectId: z.string().uuid("Select a subject"),
  sessionId: z.string().uuid("Select a session"),
});

export async function assignTeacherToClass(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.assignTeacherToClass", async () => {
    const parsed = AssignTeacherSchema.safeParse({
      teacherId: formData.get("teacherId"),
      classId: formData.get("classId"),
      subjectId: formData.get("subjectId"),
      sessionId: formData.get("sessionId"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase } = await requireAdminSchoolId();
    const { error } = await supabase.from("TeacherClassAssignment").insert({
      teacher_id: parsed.data.teacherId,
      class_id: parsed.data.classId,
      subject_id: parsed.data.subjectId,
      session_id: parsed.data.sessionId,
    });
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

// Doc 27's admin_compute_term_results blocks the whole compute call unless
// a subject's assessment weights sum to exactly 100 -- surfacing the field
// here (rather than leaving it at its 0 default) is what lets an admin
// actually reach that state instead of discovering the block at compute
// time with no way to have avoided it.
const AssessmentSchema = z.object({
  classId: z.string().uuid("Select a class"),
  subjectId: z.string().uuid("Select a subject"),
  termId: z.string().uuid("Select a term"),
  name: z.string().trim().min(1, "Assessment name is required"),
  weight: z.coerce.number().min(0).max(100).optional(),
});

export async function createAssessment(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.createAssessment", async () => {
    const parsed = AssessmentSchema.safeParse({
      classId: formData.get("classId"),
      subjectId: formData.get("subjectId"),
      termId: formData.get("termId"),
      name: formData.get("name"),
      weight: formData.get("weight") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { error } = await supabase.from("Assessment").insert({
      school_id: schoolId,
      class_id: parsed.data.classId,
      subject_id: parsed.data.subjectId,
      term_id: parsed.data.termId,
      name: parsed.data.name,
      weight: parsed.data.weight ?? 0,
    });
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}

const AssessmentWeightSchema = z.object({
  assessmentId: z.string().uuid(),
  weight: z.coerce.number().min(0, "Weight must be 0-100").max(100, "Weight must be 0-100"),
});

export async function setAssessmentWeight(formData: FormData): Promise<{ error?: string }> {
  return logged("academicSetup.setAssessmentWeight", async () => {
    const parsed = AssessmentWeightSchema.safeParse({
      assessmentId: formData.get("assessmentId"),
      weight: formData.get("weight"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const { supabase, schoolId } = await requireAdminSchoolId();
    const { error } = await supabase
      .from("Assessment")
      .update({ weight: parsed.data.weight })
      .eq("assessment_id", parsed.data.assessmentId)
      .eq("school_id", schoolId);
    if (error) return { error: error.message };

    revalidatePath("/academic-setup");
    return {};
  });
}
