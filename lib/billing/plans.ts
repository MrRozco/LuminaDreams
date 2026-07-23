export type MembershipTier = "free" | "essential" | "pro";
export type BillingInterval = "monthly" | "yearly";

type PriceMap = Record<BillingInterval, string | undefined>;

const PRICE_IDS: Record<Exclude<MembershipTier, "free">, PriceMap> = {
  essential: {
    monthly: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY,
    yearly: process.env.STRIPE_PRICE_ESSENTIAL_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
};

export function getPriceId(
  tier: Exclude<MembershipTier, "free">,
  interval: BillingInterval
) {
  const value = PRICE_IDS[tier][interval];
  if (!value) {
    throw new Error(
      `[billing] Missing Stripe price ID for ${tier}/${interval}. ` +
        "Set STRIPE_PRICE_* environment variables."
    );
  }
  return value;
}

export function inferTierFromPriceId(priceId: string | null | undefined): MembershipTier {
  if (!priceId) return "free";

  if (
    priceId === process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_ESSENTIAL_YEARLY
  ) {
    return "essential";
  }

  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_YEARLY
  ) {
    return "pro";
  }

  return "free";
}

export function normalizeTier(value: string | null | undefined): MembershipTier {
  if (value === "essential" || value === "pro") return value;
  return "free";
}
