-- ============================================================
-- LUMINA DREAMS — Complete PostgreSQL Database Schema
-- ============================================================
-- Run this entire file in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
--
-- Order of execution matters:
--   1. Extensions
--   2. Tables
--   3. Indexes
--   4. Functions & Triggers
--   5. Row Level Security
--   6. Storage Buckets + Storage RLS
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ────────────────────────────────────────────────────────────

-- UUID generation (gen_random_uuid is built-in on PG 14+, but uuid-ossp is kept
-- for the uuid_generate_v4() fallback in older environments)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigram index support for fast LIKE/ILIKE dream text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ────────────────────────────────────────────────────────────
-- 2. TABLES
-- ────────────────────────────────────────────────────────────

-- ── 2a. profiles ──────────────────────────────────────────────
-- One row per auth.users record, auto-created by trigger (see §4).
-- Stores display information and user preferences.
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary key mirrors auth.users.id exactly (UUID)
  id              UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username        TEXT        UNIQUE CHECK (username IS NULL OR (length(username) BETWEEN 3 AND 30 AND username ~ '^[a-zA-Z0-9_]+$')),
  display_name    TEXT        CHECK (display_name IS NULL OR length(display_name) <= 80),
  avatar_url      TEXT,
  timezone        TEXT        NOT NULL DEFAULT 'UTC',

  -- Billing / membership state (synced from Stripe webhooks)
  membership_tier     TEXT        NOT NULL DEFAULT 'free' CHECK (membership_tier IN ('free','essential','pro')),
  subscription_status TEXT        NOT NULL DEFAULT 'inactive',
  stripe_customer_id  TEXT        UNIQUE,
  stripe_subscription_id TEXT,
  stripe_price_id     TEXT,
  membership_updated_at TIMESTAMPTZ,

  -- Abuse & fraud controls
  abuse_score      INTEGER     NOT NULL DEFAULT 0,
  is_limited       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_banned        BOOLEAN     NOT NULL DEFAULT FALSE,
  last_sign_in_ip  TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles IS 'Extended user profile — one row per auth.users entry, auto-created on signup.';
COMMENT ON COLUMN public.profiles.username IS 'Optional unique handle, 3–30 chars, alphanumeric + underscore.';
COMMENT ON COLUMN public.profiles.membership_tier IS 'Current app tier: free, essential, or pro.';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Stripe subscription status mirror (active, trialing, canceled, etc.).';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for this user.';
COMMENT ON COLUMN public.profiles.abuse_score IS 'Heuristic risk score used by abuse controls.';
COMMENT ON COLUMN public.profiles.is_limited IS 'Temporary traffic throttling flag set by abuse systems.';
COMMENT ON COLUMN public.profiles.is_banned IS 'Hard lock flag for abusive accounts.';


-- ── 2b. dreams ────────────────────────────────────────────────
-- The core entity: a single dream journal entry.
CREATE TABLE IF NOT EXISTS public.dreams (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  -- Content
  title           TEXT        NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  content         TEXT        NOT NULL CHECK (length(content) BETWEEN 1 AND 10000),
  dream_date      DATE        NOT NULL DEFAULT CURRENT_DATE,

  -- Metadata
  mood            TEXT        CHECK (mood IS NULL OR mood IN (
                                'peaceful','mysterious','anxious','joyful',
                                'frightening','neutral','surreal','romantic','adventurous'
                              )),
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  is_lucid        BOOLEAN     NOT NULL DEFAULT FALSE,

  -- AI-generated fields (populated after AI analysis)
  interpretation  TEXT,
  symbols         TEXT[]      NOT NULL DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.dreams           IS 'Core dream journal entries — one row per recorded dream.';
COMMENT ON COLUMN public.dreams.symbols   IS 'Key symbols extracted by AI interpretation (e.g. "water", "flight", "shadow").';
COMMENT ON COLUMN public.dreams.is_lucid  IS 'True when the user was aware they were dreaming.';


-- ── 2c. dream_images ──────────────────────────────────────────
-- AI-generated images created via xAI Imagine / Flux API.
-- Files are stored in Supabase Storage bucket "dream-images".
CREATE TABLE IF NOT EXISTS public.dream_images (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dream_id        UUID        NOT NULL REFERENCES public.dreams (id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users  (id) ON DELETE CASCADE,

  -- The public/signed URL to serve the image
  url             TEXT        NOT NULL,
  -- The relative path within the storage bucket: {user_id}/{dream_id}/{filename}
  storage_path    TEXT,

  prompt          TEXT        NOT NULL,
  model           TEXT        NOT NULL DEFAULT 'grok-2-image-1212',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.dream_images            IS 'AI-generated images (Flux via xAI Imagine API), one or more per dream.';
COMMENT ON COLUMN public.dream_images.storage_path IS 'Relative path in the "dream-images" bucket, e.g. {user_id}/{dream_id}/image.webp';


-- ── 2d. dream_videos ──────────────────────────────────────────
-- AI-generated short video visualizations.
-- Primary: xAI video model; fallback: Replicate Stable Video Diffusion.
CREATE TABLE IF NOT EXISTS public.dream_videos (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  dream_id        UUID          NOT NULL REFERENCES public.dreams (id) ON DELETE CASCADE,
  user_id         UUID          NOT NULL REFERENCES auth.users  (id) ON DELETE CASCADE,

  url             TEXT          NOT NULL,
  storage_path    TEXT,

  prompt          TEXT          NOT NULL,
  model           TEXT          NOT NULL,   -- e.g. 'replicate/svd' or xAI model id
  duration        NUMERIC(6,2),             -- seconds, nullable until rendered

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.dream_videos IS 'AI-generated video visualizations (xAI or Replicate fallback), one or more per dream.';


-- ── 2e. dream_insights ────────────────────────────────────────
-- AI-generated pattern analysis and mind-state diagnosis.
-- Generated automatically after a user has logged ≥5 dreams.
-- Multiple rows allowed (one per analysis run), ordered by generated_at DESC.
CREATE TABLE IF NOT EXISTS public.dream_insights (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  -- How many dreams were included in this analysis
  dream_count           INTEGER     NOT NULL CHECK (dream_count > 0),

  -- AI-identified patterns as an array of plain-text sentences
  patterns              TEXT[]      NOT NULL DEFAULT '{}',

  -- Symbols that recur across multiple dreams
  recurring_symbols     TEXT[]      NOT NULL DEFAULT '{}',

  -- High-level themes (e.g. "transformation", "pursuit", "loss")
  themes                TEXT[]      NOT NULL DEFAULT '{}',

  -- Paragraph-length mind-state summary
  mind_state_diagnosis  TEXT        NOT NULL,

  -- Array of actionable advice items
  actionable_advice     TEXT[]      NOT NULL DEFAULT '{}',

  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.dream_insights                  IS 'AI pattern analysis and mind-state diagnosis (generated after ≥5 dreams).';
COMMENT ON COLUMN public.dream_insights.dream_count      IS 'Number of dreams analysed in this insight batch.';
COMMENT ON COLUMN public.dream_insights.generated_at     IS 'When the AI analysis was run (may differ from DB insert time).';


-- ── 2f. ai_usage_events ─────────────────────────────────────
-- Tracks paid-cost AI actions for quota and billing controls.
CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  dream_id      UUID        REFERENCES public.dreams (id) ON DELETE SET NULL,
  usage_type    TEXT        NOT NULL CHECK (usage_type IN ('interpretation','image_generation','video_generation')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ai_usage_events IS 'Append-only log of AI actions for quota/risk/billing checks.';


-- ── 2g. abuse_events ────────────────────────────────────────
-- Generic anti-abuse event stream for rate limiting and detection.
CREATE TABLE IF NOT EXISTS public.abuse_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  event_type    TEXT        NOT NULL,
  scope_type    TEXT        NOT NULL CHECK (scope_type IN ('ip','email','user')),
  scope_key     TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.abuse_events IS 'Rate-limit and abuse signal records by IP/email/user scope.';


-- ────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ────────────────────────────────────────────────────────────

-- profiles: (usually just PK lookups — no extra index needed)
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier
  ON public.profiles (membership_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON public.profiles (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_profiles_is_banned
  ON public.profiles (is_banned);

CREATE INDEX IF NOT EXISTS idx_profiles_is_limited
  ON public.profiles (is_limited);

-- dreams: primary lookup patterns
CREATE INDEX IF NOT EXISTS idx_dreams_user_id
  ON public.dreams (user_id);

CREATE INDEX IF NOT EXISTS idx_dreams_user_date
  ON public.dreams (user_id, dream_date DESC);

CREATE INDEX IF NOT EXISTS idx_dreams_created_at
  ON public.dreams (user_id, created_at DESC);

-- dreams: full-text search on title + content (GIN for tsvector)
CREATE INDEX IF NOT EXISTS idx_dreams_fts
  ON public.dreams
  USING GIN (
    to_tsvector('english',
      COALESCE(title, '') || ' ' || COALESCE(content, '')
    )
  );

-- dreams: trigram similarity index for fast ILIKE / fuzzy search on title
CREATE INDEX IF NOT EXISTS idx_dreams_title_trgm
  ON public.dreams
  USING GIN (title gin_trgm_ops);

-- dream_images
CREATE INDEX IF NOT EXISTS idx_dream_images_dream_id  ON public.dream_images (dream_id);
CREATE INDEX IF NOT EXISTS idx_dream_images_user_id   ON public.dream_images (user_id);

-- dream_videos
CREATE INDEX IF NOT EXISTS idx_dream_videos_dream_id  ON public.dream_videos (dream_id);
CREATE INDEX IF NOT EXISTS idx_dream_videos_user_id   ON public.dream_videos (user_id);

-- dream_insights
CREATE INDEX IF NOT EXISTS idx_dream_insights_user_id
  ON public.dream_insights (user_id);

CREATE INDEX IF NOT EXISTS idx_dream_insights_user_generated
  ON public.dream_insights (user_id, generated_at DESC);

-- ai_usage_events
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_created
  ON public.ai_usage_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_type_created
  ON public.ai_usage_events (user_id, usage_type, created_at DESC);

-- abuse_events
CREATE INDEX IF NOT EXISTS idx_abuse_events_scope_created
  ON public.abuse_events (event_type, scope_type, scope_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_abuse_events_user_created
  ON public.abuse_events (user_id, created_at DESC);


-- ────────────────────────────────────────────────────────────
-- 4. FUNCTIONS & TRIGGERS
-- ────────────────────────────────────────────────────────────

-- ── 4a. Auto-update updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_dreams_updated_at
  BEFORE UPDATE ON public.dreams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── 4b. Auto-create profile on new user signup ────────────────
-- Fires on INSERT into auth.users (i.e. every time a user signs up).
-- Derives display_name from user metadata or the email prefix.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1)          -- fallback: email prefix
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'  -- null is fine
  )
  ON CONFLICT (id) DO NOTHING;              -- idempotent: safe to re-run

  RETURN NEW;
END;
$$;

-- Bind to auth schema (Supabase owns auth.users — we can still add a trigger)
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 4c. Helper: get dream count for a user ────────────────────
-- Used by server actions to decide whether to trigger insight generation.
CREATE OR REPLACE FUNCTION public.get_user_dream_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER FROM public.dreams WHERE user_id = p_user_id;
$$;


-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
-- All tables are private by default.  Every policy uses auth.uid() so only
-- the authenticated owner can access their own rows.

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dreams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_videos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_insights  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_events    ENABLE ROW LEVEL SECURITY;


-- ── profiles ──────────────────────────────────────────────────
CREATE POLICY "profiles: owner select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT is handled exclusively by the trigger — no client INSERT policy needed.


-- ── dreams ────────────────────────────────────────────────────
CREATE POLICY "dreams: owner select"
  ON public.dreams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dreams: owner insert"
  ON public.dreams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dreams: owner update"
  ON public.dreams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dreams: owner delete"
  ON public.dreams FOR DELETE
  USING (auth.uid() = user_id);


-- ── dream_images ──────────────────────────────────────────────
CREATE POLICY "dream_images: owner select"
  ON public.dream_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dream_images: owner insert"
  ON public.dream_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dream_images: owner delete"
  ON public.dream_images FOR DELETE
  USING (auth.uid() = user_id);


-- ── dream_videos ──────────────────────────────────────────────
CREATE POLICY "dream_videos: owner select"
  ON public.dream_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dream_videos: owner insert"
  ON public.dream_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dream_videos: owner delete"
  ON public.dream_videos FOR DELETE
  USING (auth.uid() = user_id);


-- ── dream_insights ────────────────────────────────────────────
CREATE POLICY "dream_insights: owner select"
  ON public.dream_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dream_insights: owner insert"
  ON public.dream_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dream_insights: owner update"
  ON public.dream_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── ai_usage_events ─────────────────────────────────────────
CREATE POLICY "ai_usage_events: owner select"
  ON public.ai_usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_usage_events: owner insert"
  ON public.ai_usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKETS + STORAGE RLS
-- ────────────────────────────────────────────────────────────
-- Files are stored under the path pattern: {user_id}/{dream_id}/{filename}
-- The first folder segment IS the user_id, so RLS can verify ownership.

-- Create buckets (idempotent via ON CONFLICT DO NOTHING)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'dream-images',
    'dream-images',
    FALSE,                          -- private: use signed URLs
    10485760,                       -- 10 MB per file
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
  ),
  (
    'dream-videos',
    'dream-videos',
    FALSE,                          -- private
    104857600,                      -- 100 MB per file
    ARRAY['video/mp4','video/webm','video/quicktime']
  ),
  (
    'avatars',
    'avatars',
    TRUE,                           -- public read (avatars are shown to others)
    5242880,                        -- 5 MB per file
    ARRAY['image/jpeg','image/png','image/webp']
  )
ON CONFLICT (id) DO NOTHING;


-- dream-images storage policies
CREATE POLICY "storage dream-images: owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dream-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "storage dream-images: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dream-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "storage dream-images: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'dream-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "storage dream-images: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dream-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );


-- dream-videos storage policies
CREATE POLICY "storage dream-videos: owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dream-videos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "storage dream-videos: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dream-videos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "storage dream-videos: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'dream-videos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "storage dream-videos: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dream-videos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );


-- avatars storage policies (public read, owner write)
CREATE POLICY "storage avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "storage avatars: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "storage avatars: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "storage avatars: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
