import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { InputField } from "@/components/auth/InputField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { updatePasswordFromRecoveryAction } from "@/lib/actions/auth";

function pick(v?: string | string[]) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = pick(params.error);

  return (
    <AuthCard
      title="Reset password"
      subtitle="Create a new password for your account."
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

      <form action={updatePasswordFromRecoveryAction} className="space-y-4">
        <input type="hidden" name="next" value="/auth/reset-password" />
        <InputField
          id="new-password"
          name="password"
          type="password"
          required
          label="New password"
          autoComplete="new-password"
        />
        <InputField
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          label="Confirm new password"
          autoComplete="new-password"
        />
        <SubmitButton pendingText="Updating password...">Save new password</SubmitButton>
      </form>

      <p className="mt-3 text-xs text-foreground/55">
        If this page says your reset session expired, request a new reset email from the login page.
      </p>
    </AuthCard>
  );
}
