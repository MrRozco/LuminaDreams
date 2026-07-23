import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inferTierFromPriceId } from "@/lib/billing/plans";
import { getStripeServerClient } from "@/lib/stripe/server";

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("[stripe] Missing STRIPE_WEBHOOK_SECRET");
  }
  return secret;
}

async function updateProfileByCustomerId(
  customerId: string,
  updates: {
    membership_tier?: "free" | "essential" | "pro";
    subscription_status?: string;
    stripe_subscription_id?: string | null;
    stripe_price_id?: string | null;
  }
) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      ...updates,
      membership_updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (customerId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? null;

        await updateProfileByCustomerId(customerId, {
          membership_tier: inferTierFromPriceId(priceId),
          subscription_status: subscription.status,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : null;
      const priceId = subscription.items.data[0]?.price.id ?? null;

      if (customerId) {
        await updateProfileByCustomerId(customerId, {
          membership_tier: inferTierFromPriceId(priceId),
          subscription_status: subscription.status,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : null;

      if (customerId) {
        await updateProfileByCustomerId(customerId, {
          membership_tier: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
          stripe_price_id: null,
        });
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook handling failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
