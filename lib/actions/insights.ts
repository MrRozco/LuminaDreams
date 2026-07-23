"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FREE_TIER_LIMITS, MIN_DREAMS_FOR_INSIGHTS, RATE_LIMITS } from "@/lib/constants";
import { assertAccountAllowedForAi, enforceRateLimit } from "@/lib/security/abuse";
import { xaiChat } from "@/lib/ai/xai";
import { createClient } from "@/lib/supabase/server";

interface InsightResult {
  patterns: string[];
  recurring_symbols: string[];
  themes: string[];
  mind_state_diagnosis: string;
  actionable_advice: string[];
}

function toStringArray(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim()).slice(0, max);
}

function parseInsightResponse(raw: string): InsightResult {
  const cleaned = raw.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const diagnosis =
      typeof parsed.mind_state_diagnosis === "string" && parsed.mind_state_diagnosis.trim().length > 0
        ? parsed.mind_state_diagnosis.trim()
        : "A clear diagnosis could not be generated.";

    return {
      patterns: toStringArray(parsed.patterns, 12),
      recurring_symbols: toStringArray(parsed.recurring_symbols, 12),
      themes: toStringArray(parsed.themes, 10),
      mind_state_diagnosis: diagnosis,
      actionable_advice: toStringArray(parsed.actionable_advice, 10),
    };
  } catch {
    return {
      patterns: [],
      recurring_symbols: [],
      themes: [],
      mind_state_diagnosis: cleaned || "A clear diagnosis could not be generated.",
      actionable_advice: [],
    };
  }
}

function startOfCurrentMonthIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

export async function generateInsightsAction() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Check account standing (banned / limited users cannot generate insights)
  let profile: { membership_tier: string };
  try {
    profile = await assertAccountAllowedForAi(user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Account not allowed.";
    redirect(`/insights?error=${encodeURIComponent(msg)}`);
  }

  // Per-user rate limit — insights sends up to 25 dreams to the AI per call
  try {
    await enforceRateLimit({
      eventType: "insights_generation",
      scopeType: "user",
      scopeKey: user.id,
      maxEvents: RATE_LIMITS.insightsPerUserPerDay,
      windowMinutes: 60 * 24,
      userId: user.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Too many insight requests today.";
    redirect(`/insights?error=${encodeURIComponent(msg)}`);
  }

  // Free-tier monthly quota for insights
  if (profile.membership_tier === "free") {
    const since = startOfCurrentMonthIso();
    const { count, error: countError } = await supabase
      .from("dream_insights")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);

    if (!countError && (count ?? 0) >= FREE_TIER_LIMITS.insightsPerMonth) {
      redirect(
        `/insights?error=${encodeURIComponent(
          `Free tier limit: ${FREE_TIER_LIMITS.insightsPerMonth} insight analyses per month. Upgrade to continue.`
        )}`
      );
    }
  }

  const { count: dreamCount } = await supabase
    .from("dreams")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const totalDreams = dreamCount ?? 0;
  if (totalDreams < MIN_DREAMS_FOR_INSIGHTS) {
    redirect(`/insights?error=${encodeURIComponent(`You need at least ${MIN_DREAMS_FOR_INSIGHTS} dreams to generate insights.`)}`);
  }

  const { data: dreams, error: dreamsError } = await supabase
    .from("dreams")
    .select("title, content, dream_date, mood, tags, is_lucid, symbols")
    .eq("user_id", user.id)
    .order("dream_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(25);

  if (dreamsError || !dreams || dreams.length === 0) {
    redirect(`/insights?error=${encodeURIComponent("Could not load dreams for analysis.")}`);
  }

  const dreamDump = dreams
    .map(
      (d, i) =>
        `Dream #${i + 1}\nDate: ${d.dream_date}\nTitle: ${d.title}\nMood: ${d.mood ?? "unknown"}\nLucid: ${d.is_lucid ? "yes" : "no"}\nTags: ${d.tags.join(", ") || "none"}\nSymbols: ${d.symbols.join(", ") || "none"}\nContent:\n${d.content}`
    )
    .join("\n\n---\n\n");

  let result: InsightResult;

  try {
    const raw = await xaiChat(
      [
        {
          role: "system",
          content:
            "You are an expert dream psychologist. Analyze the user's dream journal as a whole. Return ONLY JSON with keys: patterns (string[]), recurring_symbols (string[]), themes (string[]), mind_state_diagnosis (string), actionable_advice (string[]). Keep arrays concise and meaningful.",
        },
        {
          role: "user",
          content: `Analyze the following ${dreams.length} dreams and extract cross-dream insights:\n\n${dreamDump}`,
        },
      ],
      { temperature: 0.4, max_tokens: 1400 }
    );

    result = parseInsightResponse(raw);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI analysis failed.";
    redirect(`/insights?error=${encodeURIComponent(msg)}`);
  }

  const { error: insertError } = await supabase.from("dream_insights").insert({
    user_id: user.id,
    dream_count: totalDreams,
    patterns: result.patterns,
    recurring_symbols: result.recurring_symbols,
    themes: result.themes,
    mind_state_diagnosis: result.mind_state_diagnosis,
    actionable_advice: result.actionable_advice,
  });

  if (insertError) {
    redirect(`/insights?error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath("/insights");
  redirect("/insights?success=Insights generated");
}
