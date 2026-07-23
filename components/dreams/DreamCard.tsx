import Link from "next/link";
import { format } from "date-fns";
import { Clapperboard, ImageIcon, MoonStar, Sparkles } from "lucide-react";
import type { DreamRow } from "@/types/database";

interface DreamCardProps {
  dream: DreamRow;
  hasImage?: boolean;
  hasVideo?: boolean;
}

export function DreamCard({ dream, hasImage = false, hasVideo = false }: DreamCardProps) {
  const readableDate = format(new Date(dream.dream_date), "MMM d, yyyy");

  return (
    <Link href={`/dreams/${dream.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-purple rounded-2xl">
      <article className="glass-card glass-card-hover rounded-2xl border border-white/10 p-5 h-full">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-script text-2xl italic text-cosmic-gold">{dream.title}</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-foreground/50">{readableDate}</p>
        </div>

        {dream.is_lucid ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-cosmic-purple/40 bg-cosmic-purple/15 px-2.5 py-1 text-xs text-cosmic-teal">
            <MoonStar className="h-3.5 w-3.5" /> Lucid
          </span>
        ) : null}
      </div>

      {dream.mood ? (
        <p className="mb-3 inline-flex items-center rounded-full border border-white/15 px-2.5 py-1 text-xs text-foreground/70">
          Mood: {dream.mood}
        </p>
      ) : null}

      <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">{dream.content}</p>

      {dream.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {dream.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-foreground/65">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {dream.interpretation ? (
          <p className="inline-flex items-center gap-1 text-xs text-cosmic-purple">
            <Sparkles className="h-3.5 w-3.5" /> Interpreted
          </p>
        ) : null}

        {hasImage ? (
          <p className="inline-flex items-center gap-1 text-xs text-cosmic-gold-light">
            <ImageIcon className="h-3.5 w-3.5" /> Image generated
          </p>
        ) : null}

        {hasVideo ? (
          <p className="inline-flex items-center gap-1 text-xs text-cosmic-teal">
            <Clapperboard className="h-3.5 w-3.5" /> Video generated
          </p>
        ) : null}
      </div>
    </article>
    </Link>
  );
}
