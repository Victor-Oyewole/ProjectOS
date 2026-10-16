"use server";

import { createAdminClient, createServerClient, getSessionClaims } from "@schoolos/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Doc 3 Section 6: rate limiting on auth endpoints. Keyed by email, not
// IP -- a shared-network false positive (many teachers on one school
// WiFi) is a worse outcome for this product than a slightly looser
// brute-force guard; 10 attempts/15min is generous enough that no real
// user hits it, but blocks sustained credential stuffing against one
// account. See lib/rate-limit.ts for why this is an inferred default.
export async function login(formData: FormData): Promise<{ error: string }> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const allowed = await checkRateLimit(createAdminClient(), `login:${parsed.data.email.toLowerCase()}`, 10, 900);
  if (!allowed) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
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
  if (claims?.app_role === "family") {
    redirect("/family");
  }
  redirect("/");
}
