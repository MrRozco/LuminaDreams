"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateDreamImage, generateDreamVideoFromImage } from "@/lib/ai/media";
import { RATE_LIMITS, XAI_MODELS } from "@/lib/constants";
import {
  assertAndTrackFreeTierQuota,
  enforceRateLimit,
  getClientIpAddress,
  trackAiUsage,
} from "@/lib/security/abuse";
import { assertPromptAllowed } from "@/lib/security/moderation";
import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "dream-images";
const VIDEO_BUCKET = "dream-videos";

type MediaKind = "image" | "video";

function extensionFromContentType(contentType: string, fallback: MediaKind): string {
  const normalized = contentType.toLowerCase();

  if (normalized.includes("image/webp")) return "webp";
  if (normalized.includes("image/png")) return "png";
  if (normalized.includes("image/jpeg") || normalized.includes("image/jpg")) return "jpg";
  if (normalized.includes("image/gif")) return "gif";
  if (normalized.includes("video/webm")) return "webm";
  if (normalized.includes("video/mp4")) return "mp4";
  if (normalized.includes("video/quicktime")) return "mov";

  return fallback === "image" ? "png" : "mp4";
}

function extensionFromUrl(url: string, fallback: MediaKind): string {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split("/").pop() ?? "";
    const ext = lastSegment.split(".").pop()?.toLowerCase();
    if (ext && /^[a-z0-9]+$/.test(ext)) {
      return ext;
    }
  } catch {
    // Ignore malformed URL and use fallback.
  }

  return fallback === "image" ? "png" : "mp4";
}

function inferStoragePathFromLegacyUrl(url: string, bucket: "dream-images" | "dream-videos"): string | null {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;

    const path = parsed.pathname.slice(idx + marker.length);
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

async function fetchMediaBytes(
  sourceUrl: string,
  fallbackKind: MediaKind,
): Promise<{ bytes: Uint8Array; contentType: string; extension: string }> {
  if (sourceUrl.startsWith("data:")) {
    const match = sourceUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Generated media data URL is invalid.");
    }

    const contentType = match[1] || (fallbackKind === "image" ? "image/png" : "video/mp4");
    const raw = Buffer.from(match[2], "base64");
    return {
      bytes: new Uint8Array(raw),
      contentType,
      extension: extensionFromContentType(contentType, fallbackKind),
    };
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Could not download generated media (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType =
    response.headers.get("content-type") ||
    (fallbackKind === "image" ? "image/png" : "video/mp4");

  return {
    bytes: new Uint8Array(arrayBuffer),
    contentType,
    extension:
      extensionFromContentType(contentType, fallbackKind) ||
      extensionFromUrl(sourceUrl, fallbackKind),
  };
}

async function persistGeneratedMediaToStorage(args: {
  sourceUrl: string;
  userId: string;
  dreamId: string;
  kind: MediaKind;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const { sourceUrl, userId, dreamId, kind, supabase } = args;
  const bucket = kind === "image" ? IMAGE_BUCKET : VIDEO_BUCKET;
  const media = await fetchMediaBytes(sourceUrl, kind);
  const fileName = `${kind}-${Date.now()}-${crypto.randomUUID()}.${media.extension}`;
  const storagePath = `${userId}/${dreamId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, media.bytes, {
    contentType: media.contentType,
    upsert: false,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  return storagePath;
}

function buildMediaPrompt(title: string, content: string, interpretation: string | null) {
  const clipped = content.length > 800 ? `${content.slice(0, 800)}...` : content;
  return [
    `Dream title: ${title}`,
    `Dream narrative: ${clipped}`,
    interpretation ? `Interpretation context: ${interpretation}` : null,
    "Create a surreal, cinematic, cosmic visual scene that reflects this dream.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function generateDreamImageAction(dreamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const ip = await getClientIpAddress();
  try {
    await enforceRateLimit({
      eventType: "image_generation",
      scopeType: "ip",
      scopeKey: ip,
      maxEvents: RATE_LIMITS.aiImagePerIpPerHour,
      windowMinutes: 60,
      userId: user.id,
    });

    // assertAndTrackFreeTierQuota calls assertAccountAllowedForAi internally
    // and atomically records usage for free-tier users to prevent quota bypass.
    await assertAndTrackFreeTierQuota({
      userId: user.id,
      usageType: "image_generation",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Image generation unavailable right now.";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  const { data: dream, error: dreamError } = await supabase
    .from("dreams")
    .select("id, title, content, interpretation")
    .eq("id", dreamId)
    .eq("user_id", user.id)
    .single();

  if (dreamError || !dream) {
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent("Dream not found")}`);
  }

  const prompt = buildMediaPrompt(dream.title, dream.content, dream.interpretation);
  try {
    assertPromptAllowed(`${dream.title}\n${dream.content}\n${prompt}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request blocked by safety checks.";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  let imageUrl: string;
  try {
    imageUrl = await generateDreamImage(prompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Image generation failed";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  let imageStoragePath: string;
  try {
    imageStoragePath = await persistGeneratedMediaToStorage({
      sourceUrl: imageUrl,
      userId: user.id,
      dreamId: dream.id,
      kind: "image",
      supabase,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Saving image failed";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  const { error: insertError } = await supabase.from("dream_images").insert({
    dream_id: dream.id,
    user_id: user.id,
    url: imageUrl,
    storage_path: imageStoragePath,
    prompt,
    model: XAI_MODELS.image,
  });

  if (insertError) {
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(insertError.message)}`);
  }

  // Free-tier usage was already recorded atomically in assertAndTrackFreeTierQuota.
  // Track for paid-tier users so all tiers have consistent usage history.
  const { data: tier } = await supabase.from("profiles").select("membership_tier").eq("id", user.id).single();
  if (tier?.membership_tier !== "free") {
    try {
      await trackAiUsage({ userId: user.id, usageType: "image_generation", dreamId: dream.id });
    } catch {
      // Non-blocking for paid tier analytics.
    }
  }

  revalidatePath(`/dreams/${dreamId}`);
  redirect(`/dreams/${dreamId}?success=${encodeURIComponent("Image generated")}`);
}

export async function generateDreamVideoAction(dreamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const ip = await getClientIpAddress();
  try {
    await enforceRateLimit({
      eventType: "video_generation",
      scopeType: "ip",
      scopeKey: ip,
      maxEvents: RATE_LIMITS.aiVideoPerIpPerHour,
      windowMinutes: 60,
      userId: user.id,
    });

    // assertAndTrackFreeTierQuota calls assertAccountAllowedForAi internally
    // and enforces the monthly video quota for free-tier users.
    await assertAndTrackFreeTierQuota({
      userId: user.id,
      usageType: "video_generation",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Video generation unavailable right now.";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  const { data: dream, error: dreamError } = await supabase
    .from("dreams")
    .select("id, title, content, interpretation")
    .eq("id", dreamId)
    .eq("user_id", user.id)
    .single();

  if (dreamError || !dream) {
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent("Dream not found")}`);
  }

  const { data: latestImage } = await supabase
    .from("dream_images")
    .select("url, storage_path")
    .eq("dream_id", dream.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestImage?.url) {
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent("Generate an image first before creating a video")}`);
  }

  let sourceImageUrl = latestImage.url;
  const sourceImageStoragePath =
    latestImage.storage_path ?? inferStoragePathFromLegacyUrl(latestImage.url, IMAGE_BUCKET);

  if (sourceImageStoragePath) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUrl(sourceImageStoragePath, 60 * 30);

    if (signedError || !signedData?.signedUrl) {
      redirect(`/dreams/${dreamId}?error=${encodeURIComponent("Could not access stored image")}`);
    }

    sourceImageUrl = signedData.signedUrl;
  }

  const prompt = buildMediaPrompt(dream.title, dream.content, dream.interpretation);
  try {
    assertPromptAllowed(`${dream.title}\n${dream.content}\n${prompt}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request blocked by safety checks.";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  let videoUrl: string;
  try {
    videoUrl = await generateDreamVideoFromImage(sourceImageUrl, prompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Video generation failed";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  let videoStoragePath: string;
  try {
    videoStoragePath = await persistGeneratedMediaToStorage({
      sourceUrl: videoUrl,
      userId: user.id,
      dreamId: dream.id,
      kind: "video",
      supabase,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Saving video failed";
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(msg)}`);
  }

  const { error: insertError } = await supabase.from("dream_videos").insert({
    dream_id: dream.id,
    user_id: user.id,
    url: videoUrl,
    storage_path: videoStoragePath,
    prompt,
    model: XAI_MODELS.video,
    duration: null,
  });

  if (insertError) {
    redirect(`/dreams/${dreamId}?error=${encodeURIComponent(insertError.message)}`);
  }

  // Free-tier usage was already recorded atomically in assertAndTrackFreeTierQuota.
  const { data: videoTier } = await supabase.from("profiles").select("membership_tier").eq("id", user.id).single();
  if (videoTier?.membership_tier !== "free") {
    try {
      await trackAiUsage({ userId: user.id, usageType: "video_generation", dreamId: dream.id });
    } catch {
      // Non-blocking for paid tier analytics.
    }
  }

  revalidatePath(`/dreams/${dreamId}`);
  redirect(`/dreams/${dreamId}?success=${encodeURIComponent("Video generated")}`);
}
