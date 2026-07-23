import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = {
  STRIPE_PRICE_ESSENTIAL_MONTHLY: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY,
  STRIPE_PRICE_ESSENTIAL_YEARLY: process.env.STRIPE_PRICE_ESSENTIAL_YEARLY,
  STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
};

afterEach(() => {
  process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY = originalEnv.STRIPE_PRICE_ESSENTIAL_MONTHLY;
  process.env.STRIPE_PRICE_ESSENTIAL_YEARLY = originalEnv.STRIPE_PRICE_ESSENTIAL_YEARLY;
  process.env.STRIPE_PRICE_PRO_MONTHLY = originalEnv.STRIPE_PRICE_PRO_MONTHLY;
  process.env.STRIPE_PRICE_PRO_YEARLY = originalEnv.STRIPE_PRICE_PRO_YEARLY;
  vi.resetModules();
});

describe("billing plans", () => {
  it("returns the configured price id for each tier/interval", async () => {
    process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY = "price_essential_m";
    process.env.STRIPE_PRICE_ESSENTIAL_YEARLY = "price_essential_y";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_m";
    process.env.STRIPE_PRICE_PRO_YEARLY = "price_pro_y";

    vi.resetModules();
    const { getPriceId } = await import("@/lib/billing/plans");

    expect(getPriceId("essential", "monthly")).toBe("price_essential_m");
    expect(getPriceId("essential", "yearly")).toBe("price_essential_y");
    expect(getPriceId("pro", "monthly")).toBe("price_pro_m");
    expect(getPriceId("pro", "yearly")).toBe("price_pro_y");
  });

  it("infers tier from known price ids and defaults unknown to free", async () => {
    process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY = "price_essential_m";
    process.env.STRIPE_PRICE_ESSENTIAL_YEARLY = "price_essential_y";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_m";
    process.env.STRIPE_PRICE_PRO_YEARLY = "price_pro_y";

    vi.resetModules();
    const { inferTierFromPriceId, normalizeTier } = await import("@/lib/billing/plans");

    expect(inferTierFromPriceId("price_essential_m")).toBe("essential");
    expect(inferTierFromPriceId("price_pro_y")).toBe("pro");
    expect(inferTierFromPriceId("price_unknown")).toBe("free");
    expect(inferTierFromPriceId(null)).toBe("free");

    expect(normalizeTier("essential")).toBe("essential");
    expect(normalizeTier("pro")).toBe("pro");
    expect(normalizeTier("enterprise")).toBe("free");
  });
});
