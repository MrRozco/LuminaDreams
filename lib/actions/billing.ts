"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type Stripe from "stripe";
import { APP_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPriceId,
  normalizeTier,
  type BillingInterval,
  type MembershipTier,
} from "@/lib/billing/plans";
import { getStripeServerClient } from "@/lib/stripe/server";

function isStripeMissingResourceError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "resource_missing"
  );
}

const checkoutSchema = z.object({
  tier: z.enum(["essential", "pro"]),
  interval: z.enum(["monthly", "yearly"]),
});

const switchSchema = z.object({
  tier: z.enum(["free", "essential", "pro"]),
  interval: z.enum(["monthly", "yearly"]).optional(),
});

function toSearch(value: string) {
  return encodeURIComponent(value);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login?redirectTo=/settings");
  }

  return { supabase, user };
}

async function ensureStripeCustomer(userId: string, email: string | null) {
  const admin = createAdminClient();
  const stripe = getStripeServerClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  const { error: updateError } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return customer.id;
}

async function createCheckoutAndRedirect(
  userId: string,
  email: string | null,
  tier: Exclude<MembershipTier, "free">,
  interval: BillingInterval,
  returnPath: string
) {
  const stripe = getStripeServerClient();
  const customerId = await ensureStripeCustomer(userId, email);
  const priceId = getPriceId(tier, interval);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${APP_URL}${returnPath}?success=${toSearch("Membership updated successfully")}`,
    cancel_url: `${APP_URL}${returnPath}?error=${toSearch("Checkout was canceled")}`,
    metadata: {
      supabase_user_id: userId,
      tier,
      interval,
    },
  });

  if (!session.url) {
    redirect(`${returnPath}?error=${toSearch("Could not start checkout")}`);
  }

  redirect(session.url);
}

export async function startCheckoutAction(formData: FormData) {
  const parsed = checkoutSchema.safeParse({
    tier: getString(formData, "tier"),
    interval: getString(formData, "interval"),
  });

  if (!parsed.success) {
    redirect(`/settings?error=${toSearch("Invalid billing option")}`);
  }

  const { user } = await getAuthContext();
  await createCheckoutAndRedirect(
    user.id,
    user.email ?? null,
    parsed.data.tier,
    parsed.data.interval,
    "/settings"
  );
}

export async function switchMembershipTierAction(formData: FormData) {
  const parsed = switchSchema.safeParse({
    tier: getString(formData, "tier"),
    interval: getString(formData, "interval") || undefined,
  });

  if (!parsed.success) {
    redirect(`/settings?error=${toSearch("Invalid membership switch request")}`);
  }

  const { user } = await getAuthContext();
  const admin = createAdminClient();
  const stripe = getStripeServerClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, membership_tier")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect(`/settings?error=${toSearch(profileError?.message ?? "Profile not found")}`);
  }

  const targetTier = parsed.data.tier;
  const currentTier = normalizeTier(profile.membership_tier);

  if (targetTier === currentTier) {
    redirect(`/settings?success=${toSearch("You are already on this tier")}`);
  }

  if (targetTier === "free") {
    if (profile.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      } catch (err) {
        // Subscription may already be gone in Stripe; proceed to clear it locally either way.
        if (!isStripeMissingResourceError(err)) {
          redirect(`/settings?error=${toSearch(err instanceof Error ? err.message : "Could not cancel subscription")}`);
        }
      }
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        membership_tier: "free",
        subscription_status: "inactive",
        stripe_subscription_id: null,
        stripe_price_id: null,
        membership_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      redirect(`/settings?error=${toSearch(updateError.message)}`);
    }

    redirect(`/settings?success=${toSearch("Switched to Free tier")}`);
  }

  const interval = parsed.data.interval ?? "monthly";
  const newPriceId = getPriceId(targetTier, interval);

  if (!profile.stripe_subscription_id) {
    await createCheckoutAndRedirect(user.id, user.email ?? null, targetTier, interval, "/settings");
  }

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id!);
  } catch (err) {
    if (!isStripeMissingResourceError(err)) {
      redirect(`/settings?error=${toSearch(err instanceof Error ? err.message : "Could not load subscription")}`);
    }

    // Stale subscription id — clear it and start a fresh checkout instead.
    await admin
      .from("profiles")
      .update({ stripe_subscription_id: null, stripe_price_id: null })
      .eq("id", user.id);

    await createCheckoutAndRedirect(user.id, user.email ?? null, targetTier, interval, "/settings");
    return;
  }

  const firstItem = subscription.items.data[0];


  if (!firstItem?.id) {
    redirect(`/settings?error=${toSearch("Could not locate current subscription item")}`);
  }

  const updated = await stripe.subscriptions.update(profile.stripe_subscription_id!, {
    items: [{ id: firstItem.id, price: newPriceId }],
    proration_behavior: "create_prorations",
  });

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      membership_tier: targetTier,
      subscription_status: updated.status,
      stripe_price_id: newPriceId,
      membership_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    redirect(`/settings?error=${toSearch(updateError.message)}`);
  }

  redirect(`/settings?success=${toSearch("Membership switched successfully")}`);
}

export async function openBillingPortalAction() {
  const { user } = await getAuthContext();
  const admin = createAdminClient();
  const stripe = getStripeServerClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (error || !profile?.stripe_customer_id) {
    redirect(`/settings?error=${toSearch("No Stripe customer found for this account")}`);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${APP_URL}/settings`,
  });

  redirect(session.url);
}
