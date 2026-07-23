import { SubmitButton } from "@/components/auth/SubmitButton";
import { MoodDropdown } from "@/components/dreams/MoodDropdown";
import type { DreamRow } from "@/types/database";

type DreamDefaults = Partial<Pick<DreamRow, "title" | "dream_date" | "content" | "mood" | "tags" | "is_lucid">>;

interface DreamFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: DreamDefaults;
  submitLabel?: string;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function DreamForm({ action, defaultValues, submitLabel = "Save dream" }: DreamFormProps) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-medium text-foreground/90">
            Dream title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={defaultValues?.title ?? ""}
            placeholder="The moonlit staircase"
            className="input-cosmic h-11 w-full rounded-lg px-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="dreamDate" className="text-sm font-medium text-foreground/90">
            Date of dream
          </label>
          <input
            id="dreamDate"
            name="dreamDate"
            type="date"
            defaultValue={defaultValues?.dream_date ?? todayISO()}
            required
            className="input-cosmic h-11 w-full rounded-lg px-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="mood" className="text-sm font-medium text-foreground/90">
            Mood (optional)
          </label>
          <MoodDropdown id="mood" name="mood" defaultValue={defaultValues?.mood ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium text-foreground/90">
          Dream text
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={8}
          defaultValue={defaultValues?.content ?? ""}
          placeholder="Write every detail you remember..."
          className="input-cosmic w-full rounded-lg px-3 py-2 text-sm leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium text-foreground/90">
            Tags (optional)
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            defaultValue={defaultValues?.tags?.join(", ") ?? ""}
            placeholder="water, flying, childhood"
            className="input-cosmic h-11 w-full rounded-lg px-3 text-sm"
          />
          <p className="text-xs text-foreground/55">Separate tags with commas.</p>
        </div>

        <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-foreground/80">
          <input
            type="checkbox"
            name="isLucid"
            defaultChecked={defaultValues?.is_lucid ?? false}
            className="accent-cosmic-purple"
          />
          Lucid dream
        </label>
      </div>

      <SubmitButton pendingText={`${submitLabel.replace(/^./, (c) => c.toLowerCase())}...`}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
