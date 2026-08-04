import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { InputField } from "@/components/auth/InputField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { signInWithMagicLink, signInWithPassword } from "@/lib/actions/auth";

function pick(v?: string | string[]) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = pick(params.error);
  const success = pick(params.success);
  const redirectTo = pick(params.redirectTo) || "/dashboard";

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Continue your dream journey. Sign in with password or magic link."
      footer={
        <>
          New here?{" "}
          <Link href="/auth/signup" className="text-cosmic-purple hover:text-cosmic-teal">
            Create an account
          </Link>
        </>
      }
    >
      <AuthMessage message={error} tone="error" />
      <AuthMessage message={success} tone="success" />

      <form action={signInWithPassword} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <InputField id="login-email" name="email" type="email" required label="Email" autoComplete="email" />
        <InputField
          id="login-password"
          name="password"
          type="password"
          required
          label="Password"
          autoComplete="current-password"
        />
        <TurnstileField />
        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-xs text-cosmic-teal hover:text-cosmic-gold">
            Forgot password?
          </Link>
        </div>
        <SubmitButton pendingText="Signing in...">Sign in with password</SubmitButton>
      </form>

      <div className="my-4 divider-cosmic" />

      <form action={signInWithMagicLink} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <InputField id="magic-email" name="email" type="email" required label="Email for magic link" autoComplete="email" />
        <TurnstileField />
        <SubmitButton pendingText="Sending link...">Send magic link</SubmitButton>
      </form>
    </AuthCard>
  );
}
