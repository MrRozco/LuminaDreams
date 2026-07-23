"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

interface MediaGenerateWithDisclaimerProps {
  action: () => Promise<void>;
  label: string;
  pendingLabel: string;
  tone: "purple" | "teal";
}

function ConfirmButton({ label, pendingLabel, tone }: { label: string; pendingLabel: string; tone: "purple" | "teal" }) {
  const { pending } = useFormStatus();

  const className =
    tone === "purple"
      ? "inline-flex h-9 items-center rounded-lg border border-cosmic-purple/40 bg-cosmic-purple/15 px-3 text-sm text-cosmic-purple transition hover:bg-cosmic-purple/25 disabled:opacity-60"
      : "inline-flex h-9 items-center rounded-lg border border-cosmic-teal/40 bg-cosmic-teal/15 px-3 text-sm text-cosmic-teal transition hover:bg-cosmic-teal/25 disabled:opacity-60";

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function MediaGenerateWithDisclaimer({
  action,
  label,
  pendingLabel,
  tone,
}: MediaGenerateWithDisclaimerProps) {
  const [open, setOpen] = useState(false);

  const buttonClass =
    tone === "purple"
      ? "inline-flex h-9 items-center rounded-lg border border-cosmic-purple/40 bg-cosmic-purple/10 px-3 text-sm text-cosmic-purple transition hover:bg-cosmic-purple/20"
      : "inline-flex h-9 items-center rounded-lg border border-cosmic-teal/40 bg-cosmic-teal/10 px-3 text-sm text-cosmic-teal transition hover:bg-cosmic-teal/20";

  return (
    <div className="space-y-2">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
          {label}
        </button>
      ) : (
        <div className="rounded-xl border border-white/15 bg-white/5 p-3">
          <p className="text-xs leading-relaxed text-foreground/75">
            For best results, include as much detail as possible in your dream entry: setting, people, objects,
            lighting, colors, mood, actions, and sequence. More detail produces more accurate image/video output.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form action={action}>
              <ConfirmButton label={label} pendingLabel={pendingLabel} tone={tone} />
            </form>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-lg border border-white/20 px-3 text-sm text-foreground/70 transition hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
