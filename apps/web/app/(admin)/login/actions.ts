"use server";

import { createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function login(formData: FormData): Promise<{ error: string }> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Incorrect email or password." };
  }

  const claims = await getSessionClaims(supabase);
  if (claims?.app_role === "admin") {
    redirect("/academic-setup");
  }
  if (claims?.app_role === "teacher") {
    redirect("/teacher");
  }
  // Family dashboard isn't built yet (Milestone 3).
  redirect("/");
}
