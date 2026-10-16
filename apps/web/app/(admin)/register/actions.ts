"use server";

import { createAdminClient, createServerClient } from "@schoolos/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Doc 23 Section 1 step 3: "Server Action validates input (zod schema)
// BEFORE touching the database."
const RegisterSchoolSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required"),
  country: z.string().trim().min(2, "Country is required"),
  adminName: z.string().trim().min(2, "Your name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerSchool(formData: FormData): Promise<{ error: string }> {
  const parsed = RegisterSchoolSchema.safeParse({
    schoolName: formData.get("schoolName"),
    country: formData.get("country"),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { schoolName, country, adminName, email, password } = parsed.data;

  // Doc 3 Section 6: rate limiting on auth endpoints. Keyed by IP, not
  // email -- there's no account yet at this point, so IP is the only
  // identifier available, same tradeoff noted in lib/rate-limit.ts.
  const allowed = await checkRateLimit(createAdminClient(), `register:${await getClientIp()}`, 5, 3600);
  if (!allowed) {
    return { error: "Too many registration attempts from this network. Please wait and try again." };
  }

  // The admin's auth user is created via the service-role client with
  // email_confirm skipped, not the ordinary signUp() flow -- Doc 24 Section
  // 2 step 7 expects the owner to "proceed directly" into academic setup
  // right after the trial starts, not wait on an email confirmation link
  // first. The server client below (cookie-aware) handles the actual
  // sign-in that establishes the session Server Actions run with from here
  // on, same as every other authenticated request in this app.
  const adminClient = createAdminClient();
  const { data: created, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createUserError || !created.user) {
    if (createUserError?.message.toLowerCase().includes("already been registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: createUserError?.message ?? "Could not create your account." };
  }

  const supabase = await createServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: signInError.message };
  }

  const { error: registerError } = await supabase.rpc("register_school", {
    p_school_name: schoolName,
    p_country: country,
    p_admin_name: adminName,
    p_admin_contact: email,
  });
  if (registerError) {
    return { error: registerError.message };
  }

  // The session minted at sign-in above has no app_role/school_id claim --
  // custom_access_token_hook only assigns one from an EXISTING SchoolAdmin
  // row, and that row didn't exist until register_school just created it.
  // Signing in again mints a fresh JWT that reflects it (same fix as
  // tests/fixtures.ts's freshSignIn pattern); without this,
  // /academic-setup's auth guard sees no app_role and bounces to /login.
  const { error: refreshError } = await supabase.auth.signInWithPassword({ email, password });
  if (refreshError) {
    return { error: refreshError.message };
  }

  // Doc 24 Section 2 step 7: "Proceeds directly into existing Doc 12 flow:
  // academic setup -> people setup..." -- straight into Step 2, not a
  // separate confirmation screen.
  redirect("/academic-setup");
}
