import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripeServerClient() {
  if (stripeSingleton) return stripeSingleton;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("[stripe] Missing STRIPE_SECRET_KEY.");
  }

  stripeSingleton = new Stripe(secretKey);
  return stripeSingleton;
}
