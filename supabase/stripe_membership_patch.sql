-- Stripe membership patch for existing LucidDreamers databases
-- Run once in Supabase SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (membership_tier IN ('free','essential','pro')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS membership_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier
  ON public.profiles (membership_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON public.profiles (stripe_subscription_id);

COMMENT ON COLUMN public.profiles.membership_tier
  IS 'Current app tier: free, essential, or pro.';

COMMENT ON COLUMN public.profiles.subscription_status
  IS 'Stripe subscription status mirror (active, trialing, canceled, etc.).';

COMMENT ON COLUMN public.profiles.stripe_customer_id
  IS 'Stripe customer ID for this user.';
