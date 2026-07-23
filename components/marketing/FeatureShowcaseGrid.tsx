"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const SHOTS = [
  {
    src: "/dream_library.png",
    alt: "Dream library screen",
    wide: true,
  },
  {
    src: "/dream-card.png",
    alt: "Dream detail card",
    wide: false,
  },
  {
    src: "/insights_screenshot.png",
    alt: "Insights dashboard screenshot",
    wide: false,
  },
] as const;

export function FeatureShowcaseGrid() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);

  const preview = useMemo(() => (hovered === null ? null : SHOTS[hovered]), [hovered]);
  const expanded = active === null ? null : SHOTS[active];

  return (
    <>
      <div className="relative h-full">
        <div className="grid h-full grid-cols-2 gap-4 lg:grid-rows-[1.15fr_1fr]">
          {SHOTS.map((shot, idx) => (
            <button
              key={shot.src}
              type="button"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered((current) => (current === idx ? null : current))}
              onFocus={() => setHovered(idx)}
              onBlur={() => setHovered((current) => (current === idx ? null : current))}
              onClick={() => setActive(idx)}
              className={[
                "group glass-card overflow-hidden rounded-2xl border border-white/10 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-purple focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                shot.wide ? "col-span-2" : "",
              ].join(" ")}
              aria-label={`Open ${shot.alt}`}
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                width={1400}
                height={900}
                className={[
                  "h-full min-h-52 w-full object-cover transition-transform duration-300 ease-out",
                  hovered === idx ? "scale-[1.12]" : "scale-100",
                ].join(" ")}
                priority={idx === 0}
              />
            </button>
          ))}
        </div>

        <div
          className={[
            "pointer-events-none absolute -right-4 top-1/2 z-20 hidden w-[min(38vw,26rem)] -translate-y-1/2 translate-x-6 overflow-hidden rounded-2xl border border-cosmic-purple/35 bg-cosmic-night/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:block",
            preview ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-hidden="true"
        >
          {preview ? (
            <Image
              src={preview.src}
              alt={preview.alt}
              width={1600}
              height={1000}
              className="h-auto w-full object-cover"
            />
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm sm:px-8" role="dialog" aria-modal="true" aria-label={expanded.alt}>
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close image preview"
            onClick={() => setActive(null)}
          />

          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-cosmic-night/80">
            <Image
              src={expanded.src}
              alt={expanded.alt}
              width={1800}
              height={1100}
              className="h-auto max-h-[82vh] w-full object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-5 top-5 z-20 rounded-full border border-white/30 bg-black/45 px-3 py-1.5 text-sm text-white/90"
          >
            Close
          </button>
        </div>
      ) : null}
    </>
  );
}
