"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { interpretDreamAction } from "@/lib/actions/interpret";

interface InterpretButtonProps {
  dreamId: string;
  alreadyInterpreted: boolean;
}

export function InterpretButton({ dreamId, alreadyInterpreted }: InterpretButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (alreadyInterpreted) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cosmic-purple/30 bg-cosmic-purple/10 px-3 py-1 text-xs text-cosmic-purple">
        <Sparkles className="h-3.5 w-3.5" /> Interpreted
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await interpretDreamAction(dreamId);
        })
      }
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cosmic-purple/40 bg-cosmic-purple/10 px-3 text-sm text-cosmic-purple transition hover:bg-cosmic-purple/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Sparkles className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Interpreting..." : "Interpret dream"}
    </button>
  );
}
