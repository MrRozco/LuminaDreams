import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";

function pick(v?: string | string[]) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = pick(params.email);
  const mode = pick(params.mode);

  return (
    <AuthCard
      title="Check your inbox"
      subtitle={
        mode === "magic"
          ? "We sent a secure magic link. Open your email and click the sign-in link."
          : "We sent a verification link. Confirm your email to activate your account."
      }
      footer={
        <Link href="/auth/login" className="text-cosmic-purple hover:text-cosmic-teal">
          Back to login
        </Link>
      }
    >
      <div className="rounded-xl border border-cosmic-purple/25 bg-cosmic-purple/10 p-4 text-sm text-foreground/90">
        <p className="inline-flex items-center gap-2 font-medium text-cosmic-gold">
          <MailCheck className="h-4 w-4" aria-hidden="true" />
          Email sent
        </p>
        <p className="mt-2">{email ? <>Destination: <span className="font-semibold">{email}</span></> : "Your verification email is on the way."}</p>
      </div>
    </AuthCard>
  );
}
