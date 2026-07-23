"use client";

import { useFormStatus } from "react-dom";

interface MediaActionButtonProps {
  label: string;
  pendingLabel: string;
  className?: string;
}

export function MediaActionButton({ label, pendingLabel, className }: MediaActionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
