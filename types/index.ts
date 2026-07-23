/**
 * Shared TypeScript types & interfaces for Lumina Dreams.
 *
 * App-level types are defined here.  Raw database row types live in
 * @/types/database — this file imports and re-exports the ones that are
 * useful across the UI layer.
 */

import type { DreamMood } from "@/lib/constants";

// Re-export convenience aliases from the DB type file so consumers
// can import from a single location.
export type {
  ProfileRow,
  DreamRow,
  DreamImageRow,
  DreamVideoRow,
  DreamInsightRow,
  DreamInsert,
  DreamUpdate,
  ProfileUpdate,
  DreamImageInsert,
  DreamVideoInsert,
  DreamInsightInsert,
} from "@/types/database";

/* ─── User ──────────────────────────────────────────────────── */

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  membership_tier: "free" | "essential" | "pro";
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  membership_updated_at: string | null;
  abuse_score: number;
  is_limited: boolean;
  is_banned: boolean;
  last_sign_in_ip: string | null;
  created_at: string;
  updated_at: string;
}

/* ─── Dream ─────────────────────────────────────────────────── */

export interface Dream {
  id: string;
  user_id: string;
  title: string;
  content: string;
  /** ISO date string (YYYY-MM-DD) of when the dream occurred */
  dream_date: string;
  mood: DreamMood | null;
  tags: string[];
  is_lucid: boolean;
  /** xAI Grok-generated interpretation text */
  interpretation: string | null;
  /** Key symbols extracted from the interpretation */
  symbols: string[];
  created_at: string;
  updated_at: string;
}

/* ─── Dream media ────────────────────────────────────────────── */

export interface DreamImage {
  id: string;
  dream_id: string;
  user_id: string;
  /** Public URL from Supabase Storage */
  url: string;
  /** Prompt sent to the image generation API */
  prompt: string;
  model: string;
  created_at: string;
}

export interface DreamVideo {
  id: string;
  dream_id: string;
  user_id: string;
  url: string;
  prompt: string;
  model: string;
  /** Duration in seconds */
  duration: number | null;
  created_at: string;
}

/* ─── Insights ───────────────────────────────────────────────── */

export interface DreamInsight {
  id: string;
  user_id: string;
  /** How many dreams were analysed */
  dream_count: number;
  /** Array of recurring pattern descriptions */
  patterns: string[];
  /** Symbols that appear across multiple dreams */
  recurring_symbols: string[];
  /** High-level themes identified by the AI */
  themes: string[];
  /** Gentle mental/emotional state summary */
  mind_state_diagnosis: string;
  /** Actionable recommendations from the AI */
  actionable_advice: string[];
  generated_at: string;
}

/* ─── UI helpers ─────────────────────────────────────────────── */

/** Generic API response wrapper */
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Dream with its associated images and videos joined */
export interface DreamWithMedia extends Dream {
  images: DreamImage[];
  videos: DreamVideo[];
}

/** Dream card display data (subset for list views) */
export type DreamCard = Pick<
  Dream,
  | "id"
  | "title"
  | "dream_date"
  | "mood"
  | "tags"
  | "is_lucid"
  | "created_at"
> & {
  thumbnail_url: string | null;
  has_interpretation: boolean;
};
