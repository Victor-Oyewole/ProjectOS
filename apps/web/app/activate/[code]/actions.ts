"use server";

import { createAdminClient, createServerClient } from "@schoolos/db";
import { redirect } from "next/navigation";
import { z } from "zod";

// Doc 12 "Teacher Activation"/"Family Activation" step 3: "Creates
// password/PIN" -> step 4: lands on their dashboard. Same auth-user
// bootstrap pattern as school registration (create via service role with
// email_confirm skipped, sign in, then an RPC links the row and mints a
// fresh JWT) -- see conversation notes / memory on the sign-in-before-role-
// row-exists bug that pattern exists specifically to avoid.
const ActivateSchema = z.object({
  code: z.string().min(1),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function activate(formData: FormData): Promise<{ error: string }> {
  const parsed = ActivateSchema.safeParse({
    code: formData.get("code"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { code, email, password } = parsed.data;

  // Re-validate before creating an account -- the code could have expired
  // or been used in the time between the page loading and this submit.
  const precheck = await createAdminClient().rpc("validate_activation_code", { p_code: code });
  if (precheck.error) {
    return { error: precheck.error.message };
  }

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

  const { data: consumeResult, error: consumeError } = await supabase.rpc("consume_activation_code", {
    p_code: code,
    p_auth_user_id: created.user.id,
  });
  if (consumeError) {
    return { error: consumeError.message };
  }

  // Same reason as registration: the session minted at sign-in above has
  // no app_role claim yet (the row it comes from didn't exist until
  // consume_activation_code just ran), so sign in again to mint a fresh
  // JWT that reflects it.
  const { error: refreshError } = await supabase.auth.signInWithPassword({ email, password });
  if (refreshError) {
    return { error: refreshError.message };
  }

  const targetEntity = (consumeResult as { target_entity: string } | null)?.target_entity;
  if (targetEntity === "SchoolAdmin") {
    redirect("/academic-setup");
  }
  if (targetEntity === "Teacher") {
    redirect("/teacher");
  }
  // Family dashboard isn't built yet (Milestone 3).
  redirect("/activate/success");
}
