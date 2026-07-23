import { format } from "date-fns";
import { Brain, Sparkles } from "lucide-react";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { generateInsightsAction } from "@/lib/actions/insights";
import { MIN_DREAMS_FOR_INSIGHTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

interface InsightsPageProps {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: dreamCount } = await supabase
    .from("dreams")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { data: latestInsight } = await supabase
    .from("dream_insights")
    .select("*")
    .eq("user_id", user!.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: insightHistory } = await supabase
    .from("dream_insights")
    .select("id, dream_count, generated_at")
    .eq("user_id", user!.id)
    .order("generated_at", { ascending: false })
    .limit(6);

  const totalDreams = dreamCount ?? 0;
  const canGenerate = totalDreams >= MIN_DREAMS_FOR_INSIGHTS;

  return (
    <div className="space-y-5">
      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <h1 className="font-script text-4xl italic text-cosmic-gold">Insights</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Cross-dream pattern analysis and mind-state diagnosis generated from your journal.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground/75">
            Dreams logged: <span className="font-semibold text-cosmic-gold">{totalDreams}</span>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground/75">
            Minimum required: <span className="font-semibold text-cosmic-purple">{MIN_DREAMS_FOR_INSIGHTS}</span>
          </div>
        </div>

        <form action={generateInsightsAction} className="mt-4 max-w-xs">
          <SubmitButton pendingText="Analyzing patterns...">
            {canGenerate ? "Generate fresh insights" : `Need ${MIN_DREAMS_FOR_INSIGHTS}+ dreams`}
          </SubmitButton>
        </form>
      </section>

      {params.success ? (
        <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {params.success}
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {params.error}
        </p>
      ) : null}

      {latestInsight ? (
        <section className="glass-card rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-script text-3xl italic text-cosmic-gold">Latest analysis</h2>
            <span className="text-xs uppercase tracking-[0.18em] text-foreground/45">
              {format(new Date(latestInsight.generated_at), "MMM d, yyyy")}
            </span>
          </div>

          <div className="rounded-xl border border-cosmic-purple/25 bg-cosmic-purple/10 p-4">
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-cosmic-purple">
              <Brain className="h-3.5 w-3.5" /> Mind-state diagnosis
            </p>
            <p className="text-sm leading-relaxed text-foreground/80">{latestInsight.mind_state_diagnosis}</p>
          </div>

          {latestInsight.themes.length > 0 ? (
            <div className="mt-5">
              <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-foreground/45">Themes</h3>
              <div className="flex flex-wrap gap-2">
                {latestInsight.themes.map((theme) => (
                  <span key={theme} className="rounded-full border border-cosmic-gold/30 bg-cosmic-gold/10 px-3 py-1 text-xs text-cosmic-gold-light">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {latestInsight.recurring_symbols.length > 0 ? (
            <div className="mt-5">
              <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-foreground/45">Recurring symbols</h3>
              <div className="flex flex-wrap gap-2">
                {latestInsight.recurring_symbols.map((symbol) => (
                  <span key={symbol} className="rounded-full border border-cosmic-teal/30 bg-cosmic-teal/10 px-3 py-1 text-xs text-cosmic-teal">
                    {symbol}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {latestInsight.patterns.length > 0 ? (
            <div className="mt-5">
              <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-foreground/45">Patterns</h3>
              <ul className="space-y-2">
                {latestInsight.patterns.map((pattern) => (
                  <li key={pattern} className="rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-sm text-foreground/75">
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {latestInsight.actionable_advice.length > 0 ? (
            <div className="mt-5">
              <h3 className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-cosmic-purple">
                <Sparkles className="h-3.5 w-3.5" /> Actionable advice
              </h3>
              <ol className="space-y-2">
                {latestInsight.actionable_advice.map((advice, idx) => (
                  <li key={advice} className="rounded-lg border border-cosmic-purple/20 bg-cosmic-purple/7 px-3 py-2 text-sm text-foreground/78">
                    <span className="mr-2 text-cosmic-purple">{idx + 1}.</span>
                    {advice}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="glass-card rounded-2xl border border-white/10 p-6 text-center">
          <p className="text-sm text-foreground/70">No insights generated yet. Run your first analysis above.</p>
        </section>
      )}

      {insightHistory && insightHistory.length > 1 ? (
        <section className="glass-card rounded-2xl border border-white/10 p-6">
          <h2 className="mb-3 text-sm uppercase tracking-[0.2em] text-foreground/45">Analysis history</h2>
          <div className="space-y-2">
            {insightHistory.slice(1).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-sm">
                <span className="text-foreground/70">{format(new Date(entry.generated_at), "MMM d, yyyy h:mm a")}</span>
                <span className="text-cosmic-purple">{entry.dream_count} dreams analyzed</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
