import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Clapperboard, ImageIcon, Pencil, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DREAM_MOODS } from "@/lib/constants";
import { InterpretButton } from "@/components/dreams/InterpretButton";
import { generateDreamImageAction, generateDreamVideoAction } from "@/lib/actions/media";
import type { DreamMoodValue } from "@/types/database";

interface JournalPageProps {
  searchParams: Promise<{
    q?: string;
    mood?: string;
    lucid?: "yes" | "no";
    tag?: string;
    from?: string;
    to?: string;
    view?: "grid" | "list";
  }>;
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

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tag = (params.tag ?? "").trim().toLowerCase();
  const mood = (params.mood ?? "").trim();
  const moodValue = DREAM_MOODS.some((item) => item.value === mood) ? (mood as DreamMoodValue) : null;
  const lucid = params.lucid;
  const from = (params.from ?? "").trim();
  const to = (params.to ?? "").trim();
  const view = params.view === "list" ? "list" : "grid";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dbQuery = supabase
    .from("dreams")
    .select("id, title, content, dream_date, mood, tags, is_lucid, interpretation, created_at")
    .eq("user_id", user!.id)
    .order("dream_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (q) {
    const safe = q.replace(/,/g, " ");
    dbQuery = dbQuery.or(`title.ilike.%${safe}%,content.ilike.%${safe}%`);
  }

  if (moodValue) {
    dbQuery = dbQuery.eq("mood", moodValue);
  }

  if (lucid === "yes") {
    dbQuery = dbQuery.eq("is_lucid", true);
  } else if (lucid === "no") {
    dbQuery = dbQuery.eq("is_lucid", false);
  }

  if (from) {
    dbQuery = dbQuery.gte("dream_date", from);
  }

  if (to) {
    dbQuery = dbQuery.lte("dream_date", to);
  }

  if (tag) {
    dbQuery = dbQuery.contains("tags", [tag]);
  }

  const { data: dreams, error } = await dbQuery;

  const dreamIds = (dreams ?? []).map((d) => d.id);
  const { data: imageRows } = await supabase
    .from("dream_images")
    .select("dream_id, url, storage_path, created_at")
    .eq("user_id", user!.id)
    .in("dream_id", dreamIds)
    .order("created_at", { ascending: false });

  const imageByDreamId = new Map<string, { url: string; storage_path: string | null }>();
  for (const row of imageRows ?? []) {
    if (!imageByDreamId.has(row.dream_id)) {
      imageByDreamId.set(row.dream_id, { url: row.url, storage_path: row.storage_path });
    }
  }

  const thumbnailByDreamId = new Map<string, string>();
  for (const dreamId of dreamIds) {
    const image = imageByDreamId.get(dreamId);
    if (!image) continue;

    const storagePath = image.storage_path ?? inferStoragePathFromLegacyUrl(image.url, "dream-images");
    if (!storagePath) {
      thumbnailByDreamId.set(dreamId, image.url);
      continue;
    }

    const { data, error: signedError } = await supabase.storage
      .from("dream-images")
      .createSignedUrl(storagePath, 60 * 60);

    if (signedError || !data?.signedUrl) {
      thumbnailByDreamId.set(dreamId, image.url);
      continue;
    }

    thumbnailByDreamId.set(dreamId, data.signedUrl);
  }

  return (
    <div className="space-y-5">
      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-script text-4xl italic text-cosmic-gold">Journal</h1>
            <p className="mt-2 text-sm text-foreground/70">Your complete dream archive with search, filters, and inline actions.</p>
          </div>
          <Link
            href="/dreams/new"
            className="inline-flex h-10 items-center rounded-lg bg-cosmic-purple px-4 text-sm font-medium text-white transition hover:brightness-110"
          >
            + New Dream
          </Link>
        </div>

        <form action="/journal" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search title/content"
            className="input-cosmic h-10 rounded-lg px-3 text-sm xl:col-span-2"
          />

          <select name="mood" defaultValue={mood} className="input-cosmic h-10 rounded-lg px-3 text-sm">
            <option value="">All moods</option>
            {DREAM_MOODS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>

          <select name="lucid" defaultValue={lucid ?? ""} className="input-cosmic h-10 rounded-lg px-3 text-sm">
            <option value="">Lucid + non-lucid</option>
            <option value="yes">Lucid only</option>
            <option value="no">Non-lucid only</option>
          </select>

          <input
            type="text"
            name="tag"
            defaultValue={tag}
            placeholder="Tag (e.g. water)"
            className="input-cosmic h-10 rounded-lg px-3 text-sm"
          />

          <div className="flex items-center gap-2">
            <button className="inline-flex h-10 items-center rounded-lg border border-white/20 px-3 text-sm text-foreground/80 transition hover:bg-white/5 hover:text-foreground">
              Apply
            </button>
            <Link href="/journal" className="text-xs text-foreground/60 hover:text-foreground">
              Reset
            </Link>
          </div>

          <input type="date" name="from" defaultValue={from} className="input-cosmic h-10 rounded-lg px-3 text-sm" />
          <input type="date" name="to" defaultValue={to} className="input-cosmic h-10 rounded-lg px-3 text-sm" />
          <input type="hidden" name="view" value={view} />
        </form>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <Link
            href={`/journal?${new URLSearchParams({ q, mood, lucid: lucid ?? "", tag, from, to, view: "grid" }).toString()}`}
            className={`rounded-full border px-2.5 py-1 ${view === "grid" ? "border-cosmic-purple/40 text-cosmic-purple" : "border-white/20 text-foreground/65"}`}
          >
            Grid
          </Link>
          <Link
            href={`/journal?${new URLSearchParams({ q, mood, lucid: lucid ?? "", tag, from, to, view: "list" }).toString()}`}
            className={`rounded-full border px-2.5 py-1 ${view === "list" ? "border-cosmic-purple/40 text-cosmic-purple" : "border-white/20 text-foreground/65"}`}
          >
            List
          </Link>
        </div>
      </section>

      {error ? (
        <section className="glass-card rounded-2xl border border-rose-300/30 p-6">
          <p className="text-sm text-rose-100">Could not load journal: {error.message}</p>
        </section>
      ) : dreams && dreams.length > 0 ? (
        <section className={view === "grid" ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : "space-y-3"}>
          {dreams.map((dream) => {
            const thumb = thumbnailByDreamId.get(dream.id);
            const imageAction = generateDreamImageAction.bind(null, dream.id);
            const videoAction = generateDreamVideoAction.bind(null, dream.id);

            return (
              <article
                key={dream.id}
                className="glass-card rounded-2xl border border-white/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-script text-2xl italic text-cosmic-gold">{dream.title}</h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.15em] text-foreground/45">
                      {format(new Date(dream.dream_date), "MMM d, yyyy")}
                    </p>
                  </div>

                  {dream.mood ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-foreground/65">{dream.mood}</span>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[140px,1fr]">
                  {thumb ? (
                    <Link href={`/dreams/${dream.id}`} className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                      <Image src={thumb} alt="Dream thumbnail" width={420} height={280} className="h-28 w-full object-cover" />
                    </Link>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-white/15 text-xs text-foreground/45">
                      No image yet
                    </div>
                  )}

                  <div>
                    <p className="line-clamp-4 text-sm leading-relaxed text-foreground/75">{dream.content}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {dream.is_lucid ? (
                        <span className="rounded-full border border-cosmic-teal/30 bg-cosmic-teal/10 px-2 py-0.5 text-[11px] text-cosmic-teal">Lucid</span>
                      ) : null}
                      {dream.tags.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-foreground/65">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dreams/${dream.id}`}
                    className="inline-flex h-8 items-center rounded-lg border border-white/20 px-2.5 text-xs text-foreground/75 transition hover:bg-white/5 hover:text-foreground"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/dreams/${dream.id}/edit`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/20 px-2.5 text-xs text-foreground/75 transition hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>

                  <InterpretButton dreamId={dream.id} alreadyInterpreted={!!dream.interpretation} />

                  <form action={imageAction}>
                    <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-cosmic-gold/35 bg-cosmic-gold/10 px-2.5 text-xs text-cosmic-gold-light transition hover:bg-cosmic-gold/20">
                      <ImageIcon className="h-3.5 w-3.5" /> Generate Image
                    </button>
                  </form>

                  <form action={videoAction}>
                    <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-cosmic-teal/35 bg-cosmic-teal/10 px-2.5 text-xs text-cosmic-teal transition hover:bg-cosmic-teal/20">
                      <Clapperboard className="h-3.5 w-3.5" /> Generate Video
                    </button>
                  </form>

                  <a
                    href={`/dreams/${dream.id}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/20 px-2.5 text-xs text-foreground/75 transition hover:bg-white/5 hover:text-foreground"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="glass-card rounded-2xl border border-white/10 p-8 text-center">
          <p className="text-sm text-foreground/70">No dreams matched your filters.</p>
          <Link
            href="/dreams/new"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-cosmic-purple px-4 text-sm font-medium text-white transition hover:brightness-110"
          >
            + New Dream
          </Link>
        </section>
      )}
    </div>
  );
}
