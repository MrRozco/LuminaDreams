import Link from "next/link";
import { Check } from "lucide-react";
import { startCheckoutAction, switchMembershipTierAction } from "@/lib/actions/billing";

type MembershipTier = "free" | "essential" | "pro";

interface PricingCardsProps {
  mode?: "landing" | "settings";
  currentTier?: MembershipTier;
}

const PRICING_TIERS = [
  {
    name: "Free Tier",
    key: "free" as const,
    price: "$0",
    cadence: "forever",
    annual: null,
    badge: "Best way to start",
    featured: false,
    summary: "Built to drive habit formation, organic growth, and consistent dream journaling from day one.",
    bullets: [
      "Unlimited dream logging and storage.",
      "3 AI interpretations and 3 standard images per month.",
      "No video generation on the free tier.",
      "Basic pattern insights unlock after 10 dreams.",
    ],
  },
  {
    name: "Essential Plan",
    key: "essential" as const,
    price: "$9.99",
    cadence: "/month",
    annual: "$99/year · save ~17%",
    badge: "Most balanced",
    featured: true,
    summary: "Designed for moderate users and priced to convert well from free while keeping strong margins.",
    bullets: [
      "Unlimited interpretations and pattern analysis after 5 dreams.",
      "20 standard images per month.",
      "5 short videos per month.",
      "Core dashboard, export tools, and celestial theme access.",
    ],
  },
  {
    name: "Pro Plan",
    key: "pro" as const,
    price: "$19.99",
    cadence: "/month",
    annual: "$199/year · save ~17%",
    badge: "Power users",
    featured: false,
    summary: "Made for heavy visual dreamers who want premium output, faster queues, and full archival control.",
    bullets: [
      "Everything in Essential included.",
      "Unlimited standard images and short videos, with one of each per dream.",
      "Advanced visualizations and full media export.",
    ],
  },
] as const;

export function PricingCards({ mode = "landing", currentTier }: PricingCardsProps) {
  const isSettingsMode = mode === "settings";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {PRICING_TIERS.map((tier) => {
        const isCurrentTier = isSettingsMode && currentTier === tier.key;

        return (
          <article
            key={tier.key}
            className={[
              "glass-card rounded-2xl border p-7",
              tier.featured
                ? "border-cosmic-gold/35 bg-linear-to-b from-cosmic-purple/16 to-cosmic-midnight/70 shadow-[0_0_40px_rgba(245,158,11,0.12)]"
                : "border-white/10",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.28em] uppercase text-cosmic-purple/90">{tier.badge}</p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">{tier.name}</h3>
              </div>
              {tier.featured ? (
                <span className="rounded-full border border-cosmic-gold/30 bg-cosmic-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cosmic-gold">
                  Popular
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="font-script text-5xl italic text-gradient-gold">{tier.price}</span>
              <span className="pb-2 text-sm text-foreground/55">{tier.cadence}</span>
            </div>

            {tier.annual ? (
              <p className="mt-2 text-sm text-cosmic-gold/80">{tier.annual}</p>
            ) : (
              <p className="mt-2 text-sm text-cosmic-gold/80">No credit card required</p>
            )}

            <p className="mt-5 text-sm leading-relaxed text-foreground/65">{tier.summary}</p>

            <ul className="mt-6 space-y-3">
              {tier.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/72">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cosmic-purple/28 bg-linear-to-br from-cosmic-purple/22 to-cosmic-teal/12 shadow-[0_0_22px_rgba(139,92,246,0.16)]">
                    <Check className="h-4 w-4 text-cosmic-purple" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 space-y-2.5">
              {isCurrentTier ? (
                <div className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-cosmic-gold/40 bg-cosmic-gold/10 text-sm font-semibold text-cosmic-gold">
                  Current plan
                </div>
              ) : tier.key === "free" ? (
                isSettingsMode ? (
                  <form action={switchMembershipTierAction}>
                    <input type="hidden" name="tier" value="free" />
                    <button
                      type="submit"
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-cosmic-purple/35 bg-cosmic-purple/12 text-sm font-semibold text-cosmic-gold transition hover:bg-cosmic-purple/20"
                    >
                      Switch to Free
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/auth/signup"
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-cosmic-purple/35 bg-cosmic-purple/12 text-sm font-semibold text-cosmic-gold transition hover:bg-cosmic-purple/20"
                  >
                    Start free
                  </Link>
                )
              ) : (
                <>
                  <form action={isSettingsMode ? switchMembershipTierAction : startCheckoutAction}>
                    <input type="hidden" name="tier" value={tier.key} />
                    <input type="hidden" name="interval" value="monthly" />
                    <button
                      type="submit"
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-linear-to-r from-cosmic-purple via-cosmic-nebula to-cosmic-teal/80 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      {isSettingsMode
                        ? `Switch to ${tier.name.replace(" Plan", "")}`
                        : `Choose ${tier.name.replace(" Plan", "")} monthly`}
                    </button>
                  </form>

                  <form action={isSettingsMode ? switchMembershipTierAction : startCheckoutAction}>
                    <input type="hidden" name="tier" value={tier.key} />
                    <input type="hidden" name="interval" value="yearly" />
                    <button
                      type="submit"
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 text-sm font-semibold text-foreground/85 transition hover:bg-white/10"
                    >
                      {isSettingsMode
                        ? `Switch to ${tier.name.replace(" Plan", "")} yearly`
                        : `Choose ${tier.name.replace(" Plan", "")} yearly`}
                    </button>
                  </form>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}