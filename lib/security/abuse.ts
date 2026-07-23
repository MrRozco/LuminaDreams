import { headers } from "next/headers";
import { FREE_TIER_LIMITS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export type AbuseEventType =
  | "signup_attempt"
  | "signin_attempt"
  | "magic_link_attempt"
  | "interpretation"
  | "image_generation"
  | "video_generation"
  | "dream_creation"
  | "insights_generation";

export type AbuseScopeType = "ip" | "email" | "user";

function startOfCurrentMonthIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

export async function getClientIpAddress() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return h.get("x-real-ip") || "unknown";
}

export async function enforceRateLimit(args: {
  eventType: AbuseEventType;
  scopeType: AbuseScopeType;
  scopeKey: string;
  maxEvents: number;
  windowMinutes: number;
  userId?: string;
}) {
  const { eventType, scopeType, scopeKey, maxEvents, windowMinutes, userId } = args;
  const admin = createAdminClient();

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count, error } = await admin
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", eventType)
    .eq("scope_type", scopeType)
    .eq("scope_key", scopeKey)
    .gte("created_at", since);

  if (error) {
    throw new Error(`Rate limiter query failed: ${error.message}`);
  }

  if ((count ?? 0) >= maxEvents) {
    throw new Error("Too many requests. Please wait and try again.");
  }

  const { error: insertError } = await admin.from("abuse_events").insert({
    event_type: eventType,
    scope_type: scopeType,
    scope_key: scopeKey,
    user_id: userId ?? null,
  });

  if (insertError) {
    throw new Error(`Rate limiter write failed: ${insertError.message}`);
  }
}

export async function assertAccountAllowedForAi(userId: string) {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("membership_tier, is_limited, is_banned")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Could not load your account status.");
  }

  if (profile.is_banned) {
    throw new Error("This account has been blocked due to abuse detection.");
  }

  if (profile.is_limited) {
    throw new Error("This account is temporarily rate-limited. Please contact support.");
  }

  return profile;
}

/**
 * Atomically checks and records free-tier quota usage.
 *
 * Uses an insert-first approach: the usage record is written BEFORE returning,
 * so concurrent requests cannot both pass the same quota boundary. If the count
 * after insertion exceeds the limit the record is removed and an error thrown.
 *
 * Returns true if usage was recorded here (free tier) so callers can skip a
 * redundant trackAiUsage call. Returns false for paid-tier users.
 */
export async function assertAndTrackFreeTierQuota(args: {
  userId: string;
  usageType: "interpretation" | "image_generation" | "video_generation";
  dreamId?: string;
}): Promise<boolean> {
  const { userId, usageType, dreamId } = args;
  const admin = createAdminClient();

  const profile = await assertAccountAllowedForAi(userId);

  if (profile.membership_tier !== "free") {
    return false;
  }

  // Insert the usage record first to atomically claim a quota slot.
  // This prevents concurrent requests from both passing the same quota boundary.
  const { data: inserted, error: insertError } = await admin
    .from("ai_usage_events")
    .insert({
      user_id: userId,
      usage_type: usageType,
      dream_id: dreamId ?? null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(`Quota reservation failed: ${insertError?.message ?? "unknown error"}`);
  }

  // Count all usage records for this month INCLUDING the one we just inserted.
  const start = startOfCurrentMonthIso();
  const { count, error: countError } = await admin
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("usage_type", usageType)
    .gte("created_at", start);

  if (countError) {
    // Roll back the slot we claimed, then surface the error.
    await admin.from("ai_usage_events").delete().eq("id", inserted.id);
    throw new Error(`Quota check failed: ${countError.message}`);
  }

  const limit =
    usageType === "interpretation"
      ? FREE_TIER_LIMITS.interpretationsPerMonth
      : usageType === "image_generation"
        ? FREE_TIER_LIMITS.imagesPerMonth
        : FREE_TIER_LIMITS.videosPerMonth;

  if ((count ?? 0) > limit) {
    // Over limit — remove the slot we just claimed and reject the request.
    await admin.from("ai_usage_events").delete().eq("id", inserted.id);
    const readable =
      usageType === "interpretation"
        ? "AI interpretations"
        : usageType === "image_generation"
          ? "AI images"
          : "AI videos";
    throw new Error(`Free tier limit reached: ${limit} ${readable} per month. Upgrade to continue.`);
  }

  return true;
}

export async function trackAiUsage(args: {
  userId: string;
  usageType: "interpretation" | "image_generation" | "video_generation";
  dreamId?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("ai_usage_events").insert({
    user_id: args.userId,
    usage_type: args.usageType,
    dream_id: args.dreamId ?? null,
  });

  if (error) {
    throw new Error(`Usage tracking failed: ${error.message}`);
  }
}
