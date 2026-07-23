import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { BookOpen, Clapperboard, ImageIcon, Plus, Sparkles } from "lucide-react";
import { generateDreamImageAction, generateDreamVideoAction } from "@/lib/actions/media";
import { createClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/auth/getDisplayName";

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

function computeStreak(days: string[]): number {
  if (days.length === 0) return 0;

  const unique = [...new Set(days)].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const cursor = new Date(unique[0]);

  for (const day of unique) {
    const current = new Date(day);
    const currentIso = current.toISOString().slice(0, 10);
    const cursorIso = cursor.toISOString().slice(0, 10);

    if (currentIso === cursorIso) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return streak;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = getDisplayName({
    email: user?.email,
    userMetadata: user?.user_metadata,
  });

  const { data: dreams } = await supabase
    .from("dreams")
    .select("id, title, content, dream_date, mood, is_lucid, interpretation, tags, created_at")
    .eq("user_id", user!.id)
    .order("dream_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: totalDreamCount } = await supabase
    .from("dreams")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: totalInterpretationCount } = await supabase
    .from("dreams")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .not("interpretation", "is", null);

  const { data: imageRows } = await supabase
    .from("dream_images")
    .select("dream_id, url, storage_path, created_at")
    .eq("user_id", user!.id);

  const { data: videoRows } = await supabase
    .from("dream_videos")
    .select("dream_id")
    .eq("user_id", user!.id);

  const imageDreamIds = new Set((imageRows ?? []).map((row) => row.dream_id));
  const videoDreamIds = new Set((videoRows ?? []).map((row) => row.dream_id));

  const totalDreams = totalDreamCount ?? 0;
  const interpretedCount = totalInterpretationCount ?? 0;
  const lucidCount = dreams?.filter((d) => d.is_lucid).length ?? 0;

  const dayKeys = (dreams ?? []).map((d) => d.dream_date);
  const streak = computeStreak(dayKeys);

  const currentMonth = new Date().getMonth();
  const monthTagCounts = new Map<string, number>();
  for (const dream of dreams ?? []) {
    if (new Date(dream.dream_date).getMonth() !== currentMonth) continue;
    for (const tag of dream.tags ?? []) {
      monthTagCounts.set(tag, (monthTagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topThemes = [...monthTagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const latestImageByDreamId = new Map<string, { url: string; storage_path: string | null }>();
  for (const row of imageRows ?? []) {
    if (!latestImageByDreamId.has(row.dream_id)) {
      latestImageByDreamId.set(row.dream_id, { url: row.url, storage_path: row.storage_path });
    }
  }

  const thumbnailByDreamId = new Map<string, string>();
  for (const dream of dreams ?? []) {
    const media = latestImageByDreamId.get(dream.id);
    if (!media) continue;

    const storagePath = media.storage_path ?? inferStoragePathFromLegacyUrl(media.url, "dream-images");
    if (!storagePath) {
      thumbnailByDreamId.set(dream.id, media.url);
      continue;
    }

    const { data, error } = await supabase.storage.from("dream-images").createSignedUrl(storagePath, 60 * 60);
    thumbnailByDreamId.set(dream.id, error || !data?.signedUrl ? media.url : data.signedUrl);
  }

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <h1 className="font-script text-4xl italic text-cosmic-gold">Welcome back</h1>
        <p className="mt-2 text-foreground/70">
          Your dream sanctuary is ready, <span className="font-medium text-foreground">{displayName}</span>.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dreams/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-linear-to-r from-cosmic-nebula via-cosmic-purple to-cosmic-teal/80 px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> + New Dream
          </Link>
          <Link
            href="/journal"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm text-foreground/80 transition hover:bg-white/5 hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" /> Browse Journal
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href="/dreams/new?mode=text" className="rounded-full border border-white/20 px-3 py-1 text-foreground/70 hover:text-foreground">
            Text entry
          </Link>
          <Link href="/dreams/new?mode=voice" className="rounded-full border border-white/20 px-3 py-1 text-foreground/70 hover:text-foreground">
            Voice entry
          </Link>
          <Link href="/dreams/new?mode=ai" className="rounded-full border border-white/20 px-3 py-1 text-foreground/70 hover:text-foreground">
            AI-assisted entry
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <article className="glass-card rounded-2xl border border-white/10 p-5">
          <p className="text-xs uppercase tracking-widest text-foreground/45">Dreams logged</p>
          <p className="mt-2 text-3xl font-semibold text-cosmic-gold">{totalDreams}</p>
        </article>
        <article className="glass-card rounded-2xl border border-white/10 p-5">
          <p className="text-xs uppercase tracking-widest text-foreground/45">Interpreted</p>
          <p className="mt-2 text-3xl font-semibold text-cosmic-purple">{interpretedCount}</p>
        </article>
        <article className="glass-card rounded-2xl border border-white/10 p-5">
          <p className="text-xs uppercase tracking-widest text-foreground/45">Lucid entries</p>
          <p className="mt-2 text-3xl font-semibold text-cosmic-teal">{lucidCount}</p>
        </article>
        <article className="glass-card rounded-2xl border border-white/10 p-5">
          <p className="text-xs uppercase tracking-widest text-foreground/45">Streak</p>
          <p className="mt-2 text-3xl font-semibold text-cosmic-gold-light">{streak} day{streak === 1 ? "" : "s"}</p>
        </article>
      </section>

      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <h2 className="mb-3 text-sm uppercase tracking-[0.2em] text-foreground/45">Most common themes this month</h2>
        {topThemes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {topThemes.map(([theme, count]) => (
              <span key={theme} className="rounded-full border border-cosmic-purple/30 bg-cosmic-purple/10 px-3 py-1 text-xs text-cosmic-purple">
                #{theme} · {count}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/65">Log a few tagged dreams this month to see pattern highlights.</p>
        )}
      </section>

      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-script text-3xl italic text-cosmic-gold">Recent Dreams</h2>
          <Link href="/journal" className="text-sm text-cosmic-purple hover:text-cosmic-gold">
            View all
          </Link>
        </div>

        {dreams && dreams.length > 0 ? (
          <div className="space-y-3">
            {dreams.map((dream) => {
              const imageAction = generateDreamImageAction.bind(null, dream.id);
              const videoAction = generateDreamVideoAction.bind(null, dream.id);
              const thumb = thumbnailByDreamId.get(dream.id);

              return (
              <article
                key={dream.id}
                className="rounded-xl border border-white/10 bg-white/3 p-4 transition hover:border-cosmic-purple/30 hover:bg-white/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/dreams/${dream.id}`} className="text-base font-medium text-foreground hover:text-cosmic-gold">
                      {dream.title}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-[0.15em] text-foreground/45">
                      {format(new Date(dream.dream_date), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {dream.is_lucid ? (
                      <span className="rounded-full border border-cosmic-teal/30 bg-cosmic-teal/10 px-2 py-0.5 text-xs text-cosmic-teal">
                        Lucid
                      </span>
                    ) : null}
                    {dream.interpretation ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cosmic-purple/30 bg-cosmic-purple/10 px-2 py-0.5 text-xs text-cosmic-purple">
                        <Sparkles className="h-3 w-3" /> Interpreted
                      </span>
                    ) : null}
                    {imageDreamIds.has(dream.id) ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cosmic-gold/30 bg-cosmic-gold/10 px-2 py-0.5 text-xs text-cosmic-gold-light">
                        <ImageIcon className="h-3 w-3" /> Image
                      </span>
                    ) : null}
                    {videoDreamIds.has(dream.id) ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cosmic-teal/30 bg-cosmic-teal/10 px-2 py-0.5 text-xs text-cosmic-teal">
                        <Clapperboard className="h-3 w-3" /> Video
                      </span>
                    ) : null}
                    {dream.mood ? (
                      <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-foreground/65">
                        {dream.mood}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[120px,1fr]">
                  {thumb ? (
                    <Link href={`/dreams/${dream.id}`} className="overflow-hidden rounded-lg border border-white/10">
                      <Image src={thumb} alt="Dream thumbnail" width={420} height={280} className="h-24 w-full object-cover" />
                    </Link>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={imageAction}>
                      <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-cosmic-gold/35 bg-cosmic-gold/10 px-2.5 text-xs text-cosmic-gold-light transition hover:bg-cosmic-gold/20">
                        <ImageIcon className="h-3 w-3" /> Generate image
                      </button>
                    </form>
                    <form action={videoAction}>
                      <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-cosmic-teal/35 bg-cosmic-teal/10 px-2.5 text-xs text-cosmic-teal transition hover:bg-cosmic-teal/20">
                        <Clapperboard className="h-3 w-3" /> Generate video
                      </button>
                    </form>
                    <Link href="/creations" className="inline-flex h-8 items-center rounded-lg border border-white/20 px-2.5 text-xs text-foreground/75 transition hover:bg-white/5 hover:text-foreground">
                      Open creations
                    </Link>
                  </div>
                </div>
              </article>
            );})}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/3 p-6 text-center">
            <p className="text-sm text-foreground/70">No dreams yet. Begin your journal now.</p>
            <Link
              href="/dreams/new"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-cosmic-purple px-4 text-sm font-medium text-white transition hover:brightness-110"
            >
              Log first dream
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
