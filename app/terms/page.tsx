import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of Lumina Dreams.",
};

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-cosmic-midnight px-6 py-14 text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm text-cosmic-teal hover:underline">
          Back to home
        </Link>

        <h1 className="mt-4 font-script text-4xl italic text-cosmic-gold">Terms of Service</h1>
        <p className="mt-2 text-sm text-foreground/60">Last updated: July 23, 2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of terms</h2>
            <p className="mt-2">
              By accessing or using Lumina Dreams, you agree to these terms and our Privacy Policy. If you do not
              agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Service description</h2>
            <p className="mt-2">
              Lumina Dreams provides dream journaling, AI-generated interpretations, generated media, and pattern
              insights. Features may evolve, be modified, or be discontinued over time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Acceptable use</h2>
            <p className="mt-2">
              You may not misuse the platform, attempt unauthorized access, interfere with service integrity, or use
              the product for unlawful activity. Abuse controls, rate limits, and account restrictions may be applied
              when misuse is detected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Billing and subscriptions</h2>
            <p className="mt-2">
              Paid plans are billed through Stripe and are subject to the pricing and renewal terms shown at checkout.
              Taxes and refund handling follow applicable law and your configured billing settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. AI output disclaimer</h2>
            <p className="mt-2">
              AI-generated content can be inaccurate or incomplete and is provided for informational and reflective
              purposes only. It is not medical, psychological, or legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Limitation of liability</h2>
            <p className="mt-2">
              To the fullest extent permitted by law, Lumina Dreams is provided as is without warranties, and liability
              is limited for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p className="mt-2">Questions about these terms: legal@luminadreams.app</p>
          </section>
        </div>
      </div>
    </main>
  );
}
