"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DREAM_MOODS } from "@/lib/constants";

interface MoodDropdownProps {
  name: string;
  id?: string;
  defaultValue?: string;
}

export function MoodDropdown({ name, id = "mood", defaultValue = "" }: MoodDropdownProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectedMood = useMemo(
    () => DREAM_MOODS.find((mood) => mood.value === value),
    [value]
  );

  return (
    <div ref={wrapperRef} className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="input-cosmic flex h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm text-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedMood ? "text-foreground" : "text-foreground/60"}>
          {selectedMood ? `${selectedMood.emoji} ${selectedMood.label}` : "Select a mood"}
        </span>
        <ChevronDown className={`h-4 w-4 text-cosmic-gold transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute z-40 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/15 bg-cosmic-deep/95 p-1 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-foreground/70 transition hover:bg-white/10 hover:text-foreground"
          >
            Select a mood
          </button>

          {DREAM_MOODS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => {
                setValue(mood.value);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                value === mood.value ? "bg-cosmic-purple/20 text-cosmic-gold" : "text-foreground/90"
              }`}
              role="option"
              aria-selected={value === mood.value}
            >
              {mood.emoji} {mood.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
