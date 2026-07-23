import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, MoonStar, Pencil, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteDreamAction } from "@/lib/actions/dreams";
import { generateDreamImageAction, generateDreamVideoAction } from "@/lib/actions/media";
import { DeleteDreamButton } from "@/components/dreams/DeleteDreamButton";
import { InterpretButton } from "@/components/dreams/InterpretButton";
import { MediaGenerateWithDisclaimer } from "@/components/dreams/MediaGenerateWithDisclaimer";
import { DREAM_MOODS } from "@/lib/constants";

interface DreamDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
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

export default async function DreamDetailPage({ params, searchParams }: DreamDetailPageProps) {
  const { id } = await params;
  const { success, error: errorMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: dream } = await supabase
    .from("dreams")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!dream) notFound();

  const { data: images } = await supabase
    .from("dream_images")
    .select("id, url, storage_path, created_at")
    .eq("dream_id", dream.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: videos } = await supabase
    .from("dream_videos")
    .select("id, url, storage_path, created_at")
    .eq("dream_id", dream.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const resolvedImages = await Promise.all(
    (images ?? []).map(async (image) => {
      const storagePath = image.storage_path ?? inferStoragePathFromLegacyUrl(image.url, "dream-images");

      if (!storagePath) {
        return { id: image.id, url: image.url };
      }

      const { data, error: signedError } = await supabase.storage
        .from("dream-images")
        .createSignedUrl(storagePath, 60 * 60);

      if (signedError || !data?.signedUrl) {
        return { id: image.id, url: image.url };
      }

      return { id: image.id, url: data.signedUrl };
    }),
  );

  const resolvedVideos = await Promise.all(
    (videos ?? []).map(async (video) => {
      const storagePath = video.storage_path ?? inferStoragePathFromLegacyUrl(video.url, "dream-videos");

      if (!storagePath) {
        return { id: video.id, url: video.url };
      }

      const { data, error: signedError } = await supabase.storage
        .from("dream-videos")
        .createSignedUrl(storagePath, 60 * 60);

      if (signedError || !data?.signedUrl) {
        return { id: video.id, url: video.url };
      }

      return { id: video.id, url: data.signedUrl };
    }),
  );

  const readableDate = format(new Date(dream.dream_date), "MMMM d, yyyy");
  const moodEntry = DREAM_MOODS.find((m) => m.value === dream.mood);
  const boundDelete = deleteDreamAction.bind(null, dream.id);
  const boundGenerateImage = generateDreamImageAction.bind(null, dream.id);
  const boundGenerateVideo = generateDreamVideoAction.bind(null, dream.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dreams"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/65 transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All dreams
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/dreams/${dream.id}/edit`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 px-3 text-sm text-foreground/80 transition hover:bg-white/5 hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>

          <form action={boundDelete}>
            <DeleteDreamButton />
          </form>
        </div>
      </div>

      {success ? (
        <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}

      {errorMsg ? (
        <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMsg}
        </p>
      ) : null}

      <section className="glass-card rounded-2xl border border-white/10 p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <InterpretButton dreamId={dream.id} alreadyInterpreted={!!dream.interpretation} />

          <MediaGenerateWithDisclaimer
            action={boundGenerateImage}
            label="Generate image"
            pendingLabel="Generating image..."
            tone="teal"
          />
          <MediaGenerateWithDisclaimer
            action={boundGenerateVideo}
            label="Generate video"
            pendingLabel="Generating video..."
            tone="purple"
          />
        </div>

        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-script text-4xl italic text-cosmic-gold">{dream.title}</h1>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-foreground/50">{readableDate}</p>
          </div>

          {dream.is_lucid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cosmic-purple/40 bg-cosmic-purple/15 px-3 py-1 text-sm text-cosmic-teal">
              <MoonStar className="h-4 w-4" /> Lucid dream
            </span>
          ) : null}
        </div>

        {moodEntry ? (
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-sm text-foreground/70">
            {moodEntry.emoji} {moodEntry.label}
          </p>
        ) : null}

        <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{dream.content}</p>

        {dream.tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {dream.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/5 px-3 py-1 text-xs text-foreground/65">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {dream.interpretation ? (
          <div className="mt-6 space-y-4 rounded-xl border border-cosmic-purple/25 bg-cosmic-purple/10 p-5">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-cosmic-purple">
              <Sparkles className="h-3.5 w-3.5" /> AI Interpretation
            </p>
            <p className="text-sm leading-relaxed text-foreground/80">{dream.interpretation}</p>

            {dream.symbols.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground/45">Symbols detected</p>
                <div className="flex flex-wrap gap-2">
                  {dream.symbols.map((sym) => (
                    <span
                      key={sym}
                      className="rounded-full border border-cosmic-teal/30 bg-cosmic-teal/10 px-2.5 py-1 text-xs text-cosmic-teal"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {(resolvedImages.length > 0 || resolvedVideos.length > 0) ? (
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {resolvedImages.length > 0 ? (
              <div>
                <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-foreground/45">Generated images</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {resolvedImages.map((image) => (
                    <a
                      key={image.id}
                      href={image.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative block min-w-85 overflow-hidden rounded-xl border border-white/10 bg-white/3 sm:min-w-105"
                    >
                      <Image
                        src={image.url}
                        alt="AI-generated dream visual"
                        width={1200}
                        height={864}
                        className="h-72 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {resolvedVideos.length > 0 ? (
              <div>
                <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-foreground/45">Generated videos</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {resolvedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="min-w-85 overflow-hidden rounded-xl border border-white/10 bg-black/20 sm:min-w-115"
                    >
                      <video src={video.url} controls className="h-72 w-full object-cover" preload="metadata" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
