/**
 * Application-wide constants for LucidDreamers.
 * Import from here rather than hard-coding magic values across the codebase.
 */

/* ─── App identity ──────────────────────────────────────────── */

export const APP_NAME = "LucidDreamers" as const;
export const APP_TAGLINE =
  "AI-powered cosmic dream journal. Record, interpret, and understand your dreams.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ─── AI thresholds ─────────────────────────────────────────── */

/**
 * Minimum number of saved dreams before the pattern-analysis and
 * mind-state diagnosis features are unlocked for the user.
 */
export const MIN_DREAMS_FOR_INSIGHTS = 5;

/** Maximum characters accepted in a single dream text entry */
export const DREAM_MAX_LENGTH = 10_000;

/** Maximum characters for a dream title */
export const DREAM_TITLE_MAX_LENGTH = 120;

/* ─── Cosmic colour palette ─────────────────────────────────── */
/**
 * Exact hex values that match the Tailwind `cosmic-*` tokens defined in
 * globals.css.  Use these in JS contexts (canvas drawing, chart config, etc.)
 */
export const COLORS = {
  cosmicDeep: "#1a0f2e",
  cosmicMidnight: "#0f172a",
  cosmicDim: "#1e1433",
  cosmicSlate: "#2d1f4f",
  cosmicGold: "#d4af77",
  cosmicGoldLight: "#e8cb9a",
  cosmicGoldDark: "#b8935a",
  cosmicTeal: "#67e8f9",
  cosmicPurple: "#c084fc",
  cosmicNebula: "#7c3aed",
  cosmicStar: "#f8fafc",
} as const;

/* ─── Navigation ─────────────────────────────────────────────── */

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "My Dreams", href: "/dreams", icon: "Moon" },
  { label: "Insights", href: "/insights", icon: "Sparkles" },
  { label: "Library", href: "/library", icon: "BookOpen" },
  { label: "Settings", href: "/settings", icon: "Settings2" },
] as const;

/* ─── xAI / AI models ───────────────────────────────────────── */

export const XAI_API_BASE = "https://api.x.ai/v1";

export const XAI_MODELS = {
  /** Primary text completion model */
  text: "grok-3",
  /** Image generation (xAI Images API) */
  image: "grok-imagine-image",
  /** Video generation (xAI Videos API) */
  video: "grok-imagine-video",
} as const;

/* ─── Abuse prevention / quotas ───────────────────────────── */

export const FREE_TIER_LIMITS = {
  interpretationsPerMonth: 5,
  imagesPerMonth: 3,
  videosPerMonth: 2,
  insightsPerMonth: 2,
} as const;

export const RATE_LIMITS = {
  signupPerIpPerHour: 5,
  signupPerEmailPerDay: 3,
  loginPerIpPerHour: 30,
  magicLinkPerIpPerHour: 20,
  aiInterpretPerIpPerHour: 24,
  aiImagePerIpPerHour: 12,
  aiVideoPerIpPerHour: 8,
  dreamCreationPerUserPerHour: 30,
  insightsPerUserPerDay: 5,
} as const;

/* ─── Supabase storage buckets ──────────────────────────────── */

export const STORAGE_BUCKETS = {
  dreamImages: "dream-images",
  dreamVideos: "dream-videos",
  avatars: "avatars",
} as const;

/* ─── Dream moods ────────────────────────────────────────────── */

export const DREAM_MOODS = [
  { value: "peaceful", label: "Peaceful", emoji: "🌙" },
  { value: "mysterious", label: "Mysterious", emoji: "🌀" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
  { value: "joyful", label: "Joyful", emoji: "✨" },
  { value: "frightening", label: "Frightening", emoji: "👁️" },
  { value: "neutral", label: "Neutral", emoji: "💭" },
  { value: "surreal", label: "Surreal", emoji: "🔮" },
  { value: "romantic", label: "Romantic", emoji: "🌹" },
  { value: "adventurous", label: "Adventurous", emoji: "🗺️" },
] as const;

export type DreamMood = (typeof DREAM_MOODS)[number]["value"];
