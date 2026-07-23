"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DREAM_MAX_LENGTH, DREAM_TITLE_MAX_LENGTH, RATE_LIMITS } from "@/lib/constants";
import { enforceRateLimit } from "@/lib/security/abuse";
import { createClient } from "@/lib/supabase/server";

const dreamMoodSchema = z.enum([
  "peaceful",
  "mysterious",
  "anxious",
  "joyful",
  "frightening",
  "neutral",
  "surreal",
  "romantic",
  "adventurous",
]);

const createDreamSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(DREAM_TITLE_MAX_LENGTH),
  dreamDate: z.string().min(1, "Date is required"),
  content: z.string().trim().min(1, "Dream text is required").max(DREAM_MAX_LENGTH),
  mood: z.union([z.literal(""), dreamMoodSchema]).optional(),
  tags: z.string().optional(),
  isLucid: z.boolean().optional().default(false),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
}

export async function createDreamAction(formData: FormData) {
  const parsed = createDreamSchema.safeParse({
    title: getString(formData, "title"),
    dreamDate: getString(formData, "dreamDate"),
    content: getString(formData, "content"),
    mood: getString(formData, "mood"),
    tags: getString(formData, "tags"),
    isLucid: formData.get("isLucid") === "on",
  });

  if (!parsed.success) {
    redirect(`/dreams/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form input")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login?error=Please sign in to save your dream");
  }

  try {
    await enforceRateLimit({
      eventType: "dream_creation",
      scopeType: "user",
      scopeKey: user.id,
      maxEvents: RATE_LIMITS.dreamCreationPerUserPerHour,
      windowMinutes: 60,
      userId: user.id,
    });
  } catch {
    redirect(`/dreams/new?error=${encodeURIComponent("Too many dreams created. Please wait before adding more.")}`);
  }

  const { title, dreamDate, content, mood, tags, isLucid } = parsed.data;
  const normalizedMood = mood === "" ? null : mood;

  const { error } = await supabase.from("dreams").insert({
    user_id: user.id,
    title,
    dream_date: dreamDate,
    content,
    mood: normalizedMood,
    tags: parseTags(tags ?? ""),
    is_lucid: isLucid,
  });

  if (error) {
    redirect(`/dreams/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dreams");
  redirect("/dreams?success=Dream saved successfully");
}

/* ─── Update dream ──────────────────────────────────────────── */

export async function updateDreamAction(dreamId: string, formData: FormData) {
  const parsed = createDreamSchema.safeParse({
    title: getString(formData, "title"),
    dreamDate: getString(formData, "dreamDate"),
    content: getString(formData, "content"),
    mood: getString(formData, "mood"),
    tags: getString(formData, "tags"),
    isLucid: formData.get("isLucid") === "on",
  });

  if (!parsed.success) {
    redirect(
      `/dreams/${dreamId}/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form input")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { title, dreamDate, content, mood, tags, isLucid } = parsed.data;
  const normalizedMood = mood === "" ? null : mood;

  const { error } = await supabase
    .from("dreams")
    .update({
      title,
      dream_date: dreamDate,
      content,
      mood: normalizedMood,
      tags: parseTags(tags ?? ""),
      is_lucid: isLucid,
    })
    .eq("id", dreamId)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/dreams/${dreamId}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dreams");
  revalidatePath(`/dreams/${dreamId}`);
  redirect(`/dreams/${dreamId}?success=Dream updated`);
}

/* ─── Delete dream ──────────────────────────────────────────── */

export async function deleteDreamAction(dreamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("dreams")
    .delete()
    .eq("id", dreamId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dreams");
  redirect("/dreams?success=Dream deleted");
}
