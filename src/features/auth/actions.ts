"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  resetPasswordSchema,
  registerSchema,
} from "@/features/auth/schemas";
import { getCurrentUser } from "@/features/auth/queries";
import {
  actionError,
  actionSuccess,
  validationError,
  type ActionResult,
} from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/config/env";
import { isDemoMode } from "@/config/demo";

export async function registerAction(
  input: unknown,
): Promise<ActionResult<{ signedIn: boolean }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  if (isDemoMode())
    return actionError(
      "Use a sample demo account. Switch accounts from the demo bar, or sign in with a sample email and Starter123!.",
    );
  const supabase = await createClient();
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=/select-salon`,
    },
  });
  if (error)
    return actionError(
      "Account could not be created. Try again or sign in if you already registered.",
    );
  return actionSuccess(
    "Check your email to confirm your account, then sign in.",
    { signedIn: !!data.session },
  );
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return actionError("Email or password is incorrect.");
  return actionSuccess("Signed in.", undefined);
}

export async function forgotPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  if (isDemoMode())
    return actionSuccess(
      "Demo accounts use the password Starter123!. Email delivery is disabled for the local demo.",
      undefined,
    );

  const supabase = await createClient();
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  return actionSuccess(
    "If an account exists for that email, a reset link is on its way.",
    undefined,
  );
}

export async function resetPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  if (isDemoMode())
    return actionError(
      "Demo accounts use the fixed sample password Starter123!.",
    );

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error?.code === "same_password") {
    return actionError(
      "Choose a password different from your current password.",
    );
  }
  if (error) return actionError("The reset link is invalid or has expired.");
  return actionSuccess(
    "Password updated. You can continue to the dashboard.",
    undefined,
  );
}

export async function updateProfileAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) return actionError("Your session has expired. Sign in again.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) return actionError("Profile changes could not be saved.");
  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  return actionSuccess("Profile updated.", undefined);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
