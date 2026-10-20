import type { Metadata } from "next";

import { AuthFrame } from "@/features/auth/components/auth-frame";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { isDemoMode } from "@/config/demo";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <AuthFrame
      title="Welcome back"
      description={
        isDemoMode()
          ? "Demo accounts: admin@example.test or staff@example.test. Password: Starter123!"
          : "Your salon, team and working day, all in one place."
      }
    >
      <LoginForm nextPath={safeRedirectPath(params.next ?? null)} />
    </AuthFrame>
  );
}
