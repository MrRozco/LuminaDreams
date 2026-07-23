import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { InputField } from "@/components/auth/InputField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { signUpWithPassword } from "@/lib/actions/auth";

function pick(v?: string | string[]) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = pick(params.error);

  return (
    <AuthCard
      title="Create account"
      subtitle="Start recording your dreams and unlock AI interpretation."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-cosmic-purple hover:text-cosmic-teal">
            Sign in
          </Link>
        </>
      }
    >
      <AuthMessage message={error} tone="error" />

      <form action={signUpWithPassword} className="space-y-4">
        <InputField id="display-name" name="displayName" type="text" label="Display name" placeholder="Moonwalker" />
        <InputField id="signup-email" name="email" type="email" required label="Email" autoComplete="email" />
        <InputField
          id="signup-password"
          name="password"
          type="password"
          required
          label="Password"
          autoComplete="new-password"
        />
        <TurnstileField />
        <p className="text-xs text-foreground/55">Use 6+ characters. You can also use magic link on the sign-in page.</p>
        <SubmitButton pendingText="Creating account...">Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
