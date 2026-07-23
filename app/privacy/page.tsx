import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Lumina Dreams collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-cosmic-midnight px-6 py-14 text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm text-cosmic-teal hover:underline">
          Back to home
        </Link>

        <h1 className="mt-4 font-script text-4xl italic text-cosmic-gold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-foreground/60">Last updated: July 23, 2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. What we collect</h2>
            <p className="mt-2">
              We collect account information you provide, dream entries you create, and generated media or insights
              produced by the service. We also collect technical events needed for security, abuse prevention, and
              service reliability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How we use data</h2>
            <p className="mt-2">
              Your data is used to provide core features such as authentication, dream storage, AI interpretation,
              image and video generation, and insights. Operational logs are used for monitoring, fraud detection,
              quota enforcement, and troubleshooting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Third-party processors</h2>
            <p className="mt-2">
              Lumina Dreams uses third-party infrastructure and API providers to operate the product, including
              Supabase for database, storage, and authentication, Stripe for billing, and AI providers for model
              responses and media generation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data retention and deletion</h2>
            <p className="mt-2">
              We retain data while your account is active or as required for legitimate business and legal reasons.
              You can request account deletion, after which personal data is removed or anonymized subject to
              compliance obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Security</h2>
            <p className="mt-2">
              We apply technical safeguards such as encrypted transport, access controls, and abuse protections.
              No internet service is completely risk free, so you should avoid storing highly sensitive personal
              secrets in dream content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
            <p className="mt-2">
              For privacy requests, contact: privacy@luminadreams.app
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
