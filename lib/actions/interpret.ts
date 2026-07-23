"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RATE_LIMITS } from "@/lib/constants";
import {
  assertAndTrackFreeTierQuota,
  enforceRateLimit,
  getClientIpAddress,
  trackAiUsage,
} from "@/lib/security/abuse";
import { assertPromptAllowed } from "@/lib/security/moderation";
import { xaiChat } from "@/lib/ai/xai";
import { createClient } from "@/lib/supabase/server";

/* ─── Prompt builder ────────────────────────────────────────── */

function buildInterpretPrompt(
  title: string,
  content: string,
  mood: string | null,
  tags: string[],
  isLucid: boolean
): string {
  const parts: string[] = [
    `Dream title: ${title}`,
    `Dream content:\n${content}`,
  ];
  if (mood) parts.push(`Reported mood: ${mood}`);
  if (isLucid) parts.push("This was a lucid dream (the dreamer was aware they were dreaming).");
  if (tags.length > 0) parts.push(`Tags: ${tags.join(", ")}`);
  return parts.join("\n\n");
}

/* ─── JSON response shape expected from the model ───────────── */

interface InterpretResult {
  interpretation: string;
  symbols: string[];
}

function parseModelResponse(raw: string): InterpretResult {
  // Model is instructed to return JSON; strip any markdown fences first.
  const cleaned = raw.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as Partial<InterpretResult>;
    const interpretation =
      typeof parsed.interpretation === "string" && parsed.interpretation.trim()
        ? parsed.interpretation.trim()
        : "Unable to produce an interpretation at this time.";
    const symbols = Array.isArray(parsed.symbols)
      ? (parsed.symbols as unknown[])
          .filter((s): s is string => typeof s === "string")
          .slice(0, 12)
      : [];
    return { interpretation, symbols };
  } catch {
    // If JSON parsing fails, treat the whole response as interpretation text
    return { interpretation: cleaned, symbols: [] };
  }
}

/* ─── Server action ──────────────────────────────────────────── */

export async function interpretDreamAction(dreamId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const ip = await getClientIpAddress();

  // usageRecorded = true means assertAndTrackFreeTierQuota already persisted
  // the usage row atomically (free tier). For paid tier it returns false and
  // we call trackAiUsage separately below.
  let usageRecorded = false;
  try {
    await enforceRateLimit({
      eventType: "interpretation",
      scopeType: "ip",
      scopeKey: ip,
      maxEvents: RATE_LIMITS.aiInterpretPerIpPerHour,
      windowMinutes: 60,
      userId: user.id,
    });
    usageRecorded = await assertAndTrackFreeTierQuota({
      userId: user.id,
      usageType: "interpretation",
      dreamId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Interpretation is temporarily unavailable.";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  // Fetch dream, verify ownership
  const { data: dream, error: fetchError } = await supabase
    .from("dreams")
    .select("id, title, content, mood, tags, is_lucid, interpretation")
    .eq("id", dreamId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !dream) {
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent("Dream not found.")}`);
  }

  // Skip if already interpreted
  if (dream.interpretation) {
    redirect(`/dreams/${dreamId}`);
  }

  let result: InterpretResult;
  try {
    const userPrompt = buildInterpretPrompt(
      dream.title,
      dream.content,
      dream.mood,
      dream.tags,
      dream.is_lucid
    );

    assertPromptAllowed(`${dream.title}\n${dream.content}`);

    const raw = await xaiChat([
      {
        role: "system",
        content: `You are a professional dream analyst and Jungian psychologist with deep knowledge of symbolism, archetypes, and the subconscious. 

Analyse the dream the user provides and return a JSON object with exactly two fields:
1. "interpretation" — a rich, thoughtful 2-4 paragraph psychological interpretation of the dream. Be insightful and cosmic in tone.
2. "symbols" — an array of 3-10 key symbols or archetypes you identified (short strings, e.g. "water", "shadow figure", "ascending staircase").

Return ONLY the raw JSON object, no markdown fences, no preamble.`,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ]);

    result = parseModelResponse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI service unavailable.";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  const { error: updateError } = await supabase
    .from("dreams")
    .update({
      interpretation: result.interpretation,
      symbols: result.symbols,
    })
    .eq("id", dreamId)
    .eq("user_id", user.id);

  if (updateError) {
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(updateError.message)}`);
  }

  // Free-tier usage was already recorded atomically in assertAndTrackFreeTierQuota.
  // Track separately only for paid-tier users so all tiers have usage history.
  if (!usageRecorded) {
    try {
      await trackAiUsage({ userId: user.id, usageType: "interpretation", dreamId });
    } catch {
      // Non-blocking for paid tier analytics.
    }
  }

  revalidatePath(`/dreams/${dreamId}`);
  redirect(`/dreams/${dreamId}?success=Interpretation complete`);
}
