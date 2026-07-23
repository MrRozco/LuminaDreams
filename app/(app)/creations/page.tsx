import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Clapperboard, Download, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface CreationsPageProps {
  searchParams: Promise<{ q?: string; type?: "all" | "images" | "videos" }>;
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

export default async function CreationsPage({ searchParams }: CreationsPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const type = params.type ?? "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: dreams }, { data: imageRows }, { data: videoRows }] = await Promise.all([
    supabase.from("dreams").select("id, title").eq("user_id", user!.id),
    supabase
      .from("dream_images")
      .select("id, dream_id, url, storage_path, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("dream_videos")
      .select("id, dream_id, url, storage_path, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  const dreamTitleById = new Map((dreams ?? []).map((d) => [d.id, d.title]));

  const resolvedImages = await Promise.all(
    (imageRows ?? []).map(async (image) => {
      const storagePath = image.storage_path ?? inferStoragePathFromLegacyUrl(image.url, "dream-images");
      if (!storagePath) {
        return {
          id: image.id,
          dreamId: image.dream_id,
          title: dreamTitleById.get(image.dream_id) ?? "Untitled Dream",
          url: image.url,
          createdAt: image.created_at,
        };
      }

      const { data, error } = await supabase.storage.from("dream-images").createSignedUrl(storagePath, 60 * 60);
      return {
        id: image.id,
        dreamId: image.dream_id,
        title: dreamTitleById.get(image.dream_id) ?? "Untitled Dream",
        url: error || !data?.signedUrl ? image.url : data.signedUrl,
        createdAt: image.created_at,
      };
    }),
  );

  const resolvedVideos = await Promise.all(
    (videoRows ?? []).map(async (video) => {
      const storagePath = video.storage_path ?? inferStoragePathFromLegacyUrl(video.url, "dream-videos");
      if (!storagePath) {
        return {
          id: video.id,
          dreamId: video.dream_id,
          title: dreamTitleById.get(video.dream_id) ?? "Untitled Dream",
          url: video.url,
          createdAt: video.created_at,
        };
      }

      const { data, error } = await supabase.storage.from("dream-videos").createSignedUrl(storagePath, 60 * 60);
      return {
        id: video.id,
        dreamId: video.dream_id,
        title: dreamTitleById.get(video.dream_id) ?? "Untitled Dream",
        url: error || !data?.signedUrl ? video.url : data.signedUrl,
        createdAt: video.created_at,
      };
    }),
  );

  const imageResults = resolvedImages.filter((item) => !q || item.title.toLowerCase().includes(q));
  const videoResults = resolvedVideos.filter((item) => !q || item.title.toLowerCase().includes(q));

  return (
    <div className="space-y-5">
      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <h1 className="font-script text-4xl italic text-cosmic-gold">Creations</h1>
        <p className="mt-2 text-sm text-foreground/70">Your image and video gallery generated from dream entries.</p>

        <form action="/creations" className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by dream title"
            className="input-cosmic h-10 min-w-72 rounded-lg px-3 text-sm"
          />
          <select name="type" defaultValue={type} className="input-cosmic h-10 rounded-lg px-3 text-sm">
            <option value="all">All media</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
          </select>
          <button className="inline-flex h-10 items-center rounded-lg border border-white/20 px-3 text-sm text-foreground/80 transition hover:bg-white/5 hover:text-foreground">
            Filter
          </button>
        </form>
      </section>

      {(type === "all" || type === "images") && (
        <section className="space-y-3">
          <h2 className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/45">
            <ImageIcon className="h-4 w-4" /> Images ({imageResults.length})
          </h2>

          {imageResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {imageResults.map((image) => (
                <article key={image.id} className="glass-card rounded-2xl border border-white/10 p-3">
                  <a href={image.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-white/10">
                    <Image src={image.url} alt={`Dream image for ${image.title}`} width={1200} height={864} className="h-52 w-full object-cover" />
                  </a>
                  <div className="mt-3">
                    <p className="line-clamp-1 text-sm text-foreground/85">{image.title}</p>
                    <p className="mt-1 text-xs text-foreground/50">{format(new Date(image.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/dreams/${image.dreamId}`} className="inline-flex h-8 items-center rounded-lg border border-white/20 px-2.5 text-xs text-foreground/75 transition hover:bg-white/5 hover:text-foreground">
                      Open Dream
                    </Link>
                    <a
                      href={image.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-cosmic-gold/30 bg-cosmic-gold/10 px-2.5 text-xs text-cosmic-gold-light transition hover:bg-cosmic-gold/20"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-white/10 p-6 text-center text-sm text-foreground/65">No images found.</div>
          )}
        </section>
      )}

      {(type === "all" || type === "videos") && (
        <section className="space-y-3">
          <h2 className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/45">
            <Clapperboard className="h-4 w-4" /> Videos ({videoResults.length})
          </h2>

          {videoResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {videoResults.map((video) => (
                <article key={video.id} className="glass-card rounded-2xl border border-white/10 p-3">
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    <video src={video.url} controls className="h-52 w-full object-cover" preload="metadata" />
                  </div>
                  <div className="mt-3">
                    <p className="line-clamp-1 text-sm text-foreground/85">{video.title}</p>
                    <p className="mt-1 text-xs text-foreground/50">{format(new Date(video.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/dreams/${video.dreamId}`} className="inline-flex h-8 items-center rounded-lg border border-white/20 px-2.5 text-xs text-foreground/75 transition hover:bg-white/5 hover:text-foreground">
                      Open Dream
                    </Link>
                    <a
                      href={video.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-cosmic-teal/30 bg-cosmic-teal/10 px-2.5 text-xs text-cosmic-teal transition hover:bg-cosmic-teal/20"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-white/10 p-6 text-center text-sm text-foreground/65">No videos found.</div>
          )}
        </section>
      )}
    </div>
  );
}
