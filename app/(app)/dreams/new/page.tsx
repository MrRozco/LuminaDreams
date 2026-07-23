import Link from "next/link";
import { createDreamAction } from "@/lib/actions/dreams";
import { DreamForm } from "@/components/dreams/DreamForm";

interface NewDreamPageProps {
  searchParams: Promise<{
    error?: string;
    mode?: "text" | "voice" | "ai";
  }>;
}

export default async function NewDreamPage({ searchParams }: NewDreamPageProps) {
  const params = await searchParams;
  const modeLabel = params.mode === "voice" ? "Voice entry" : params.mode === "ai" ? "AI-assisted entry" : "Text entry";

  return (
    <div className="space-y-5">
      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <h1 className="font-script text-4xl italic text-cosmic-gold">Log Dream</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Capture everything you remember while the details are still glowing.
        </p>
        <p className="mt-2 inline-flex rounded-full border border-white/15 px-2.5 py-1 text-xs text-foreground/60">
          Entry mode: {modeLabel}
        </p>
      </section>

      {params.error ? (
        <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {params.error}
        </p>
      ) : null}

      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <DreamForm action={createDreamAction} />
      </section>

      <p className="text-sm text-foreground/60">
        Prefer browsing first? View your entries in <Link href="/journal" className="text-cosmic-purple hover:text-cosmic-gold">Journal</Link>.
      </p>
    </div>
  );
}
