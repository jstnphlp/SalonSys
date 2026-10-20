import { AuthFrame } from "@/features/auth/components/auth-frame";
import { RegisterForm } from "@/features/auth/components/register-form";
export default function RegisterPage() {
  return (
    <AuthFrame
      title="Start with your account"
      description="Create your salon workspace or join your team after confirming your email."
    >
      <RegisterForm />
    </AuthFrame>
  );
}
