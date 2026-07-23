-- Abuse protection patch for existing LucidDreamers databases
-- Run once in Supabase SQL Editor after schema upgrade.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS abuse_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_limited BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_sign_in_ip TEXT;

COMMENT ON COLUMN public.profiles.abuse_score
  IS 'Heuristic risk score used by abuse controls.';

COMMENT ON COLUMN public.profiles.is_limited
  IS 'Temporary traffic throttling flag set by abuse systems.';

COMMENT ON COLUMN public.profiles.is_banned
  IS 'Hard lock flag for abusive accounts.';

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  dream_id      UUID        REFERENCES public.dreams (id) ON DELETE SET NULL,
  usage_type    TEXT        NOT NULL CHECK (usage_type IN ('interpretation','image_generation','video_generation')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.abuse_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  event_type    TEXT        NOT NULL,
  scope_type    TEXT        NOT NULL CHECK (scope_type IN ('ip','email','user')),
  scope_key     TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_is_banned
  ON public.profiles (is_banned);

CREATE INDEX IF NOT EXISTS idx_profiles_is_limited
  ON public.profiles (is_limited);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_created
  ON public.ai_usage_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_type_created
  ON public.ai_usage_events (user_id, usage_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_abuse_events_scope_created
  ON public.abuse_events (event_type, scope_type, scope_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_abuse_events_user_created
  ON public.abuse_events (user_id, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_usage_events'
      AND policyname = 'ai_usage_events: owner select'
  ) THEN
    CREATE POLICY "ai_usage_events: owner select"
      ON public.ai_usage_events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_usage_events'
      AND policyname = 'ai_usage_events: owner insert'
  ) THEN
    CREATE POLICY "ai_usage_events: owner insert"
      ON public.ai_usage_events FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
