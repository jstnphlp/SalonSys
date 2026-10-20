"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecordForm } from "@/components/shared/record-form";
import { registerSchema } from "../schemas";
import { registerAction } from "../actions";
export function RegisterForm() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <RecordForm
        schema={registerSchema}
        defaults={{ fullName: "", email: "", password: "" }}
        fields={[
          { name: "fullName", label: "Full name" },
          { name: "email", label: "Email", kind: "email" },
          { name: "password", label: "Password", kind: "password" },
        ]}
        action={registerAction}
        submitLabel="Create account"
        onSuccess={(v) => {
          if ((v as { signedIn: boolean }).signedIn) {
            router.push("/select-salon");
            router.refresh();
          }
        }}
      />
      <p className="text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-primary underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
