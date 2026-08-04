import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { InputField } from "@/components/auth/InputField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { requestPasswordResetAction } from "@/lib/actions/auth";

function pick(v?: string | string[]) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = pick(params.error);
  const success = pick(params.success);

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we will send you a secure reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/auth/login" className="text-cosmic-purple hover:text-cosmic-teal">
            Back to sign in
          </Link>
        </>
      }
    >
      <AuthMessage message={error} tone="error" />
      <AuthMessage message={success} tone="success" />

      <form action={requestPasswordResetAction} className="space-y-4">
        <InputField id="reset-email" name="email" type="email" required label="Email" autoComplete="email" />
        <TurnstileField />
        <SubmitButton pendingText="Sending reset link...">Email password reset link</SubmitButton>
      </form>
    </AuthCard>
  );
}
