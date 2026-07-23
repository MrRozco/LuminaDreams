"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

function ConfirmSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center rounded-lg bg-rose-600 px-3 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
    >
      {pending ? "Deleting..." : "Yes, delete"}
    </button>
  );
}

export function DeleteDreamButton() {
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <button
        type="button"
        onClick={() => setConfirmed(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 text-sm text-rose-300 transition hover:bg-rose-500/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground/70">Sure?</span>
      <ConfirmSubmit />
      <button
        type="button"
        onClick={() => setConfirmed(false)}
        className="inline-flex h-9 items-center rounded-lg border border-white/20 px-3 text-sm text-foreground/70 transition hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
