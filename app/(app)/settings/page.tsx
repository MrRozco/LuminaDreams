import { SubmitButton } from "@/components/auth/SubmitButton";
import { PricingCards } from "@/components/marketing/PricingCards";
import {
  openBillingPortalAction,
} from "@/lib/actions/billing";
import { normalizeTier } from "@/lib/billing/plans";
import { updateProfileAction } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";

interface SettingsPageProps {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, timezone, membership_tier, subscription_status")
    .eq("id", user!.id)
    .single();

  const currentTier = normalizeTier(profile?.membership_tier);

  return (
    <div className="space-y-5">
      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <h1 className="font-script text-4xl italic text-cosmic-gold">Settings</h1>
        <p className="mt-2 text-sm text-foreground/70">Update your profile and account preferences.</p>
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

      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <form action={updateProfileAction} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground/90">Email</label>
            <input
              id="email"
              type="email"
              value={user?.email ?? ""}
              disabled
              className="input-cosmic h-11 w-full rounded-lg px-3 text-sm opacity-70"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground/90">Display name</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              defaultValue={profile?.display_name ?? ""}
              className="input-cosmic h-11 w-full rounded-lg px-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground/90">Username (optional)</label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={profile?.username ?? ""}
              placeholder="moonwalker_87"
              className="input-cosmic h-11 w-full rounded-lg px-3 text-sm"
            />
            <p className="text-xs text-foreground/55">3–30 chars, letters/numbers/underscore.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-medium text-foreground/90">Timezone</label>
            <input
              id="timezone"
              name="timezone"
              type="text"
              required
              defaultValue={profile?.timezone ?? "UTC"}
              placeholder="America/New_York"
              className="input-cosmic h-11 w-full rounded-lg px-3 text-sm"
            />
          </div>

          <SubmitButton pendingText="Saving settings...">Save settings</SubmitButton>
        </form>
      </section>

      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Membership</h2>
            <p className="mt-1 text-sm text-foreground/65">
              Current tier: <span className="font-semibold capitalize text-cosmic-gold">{profile?.membership_tier ?? "free"}</span>
              {" "}· Status: <span className="font-semibold capitalize text-cosmic-purple">{profile?.subscription_status ?? "inactive"}</span>
            </p>
          </div>

          {(profile?.membership_tier === "essential" || profile?.membership_tier === "pro") ? (
            <form action={openBillingPortalAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-medium text-foreground/85 transition hover:bg-white/8"
              >
                Open billing portal
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-6">
          <PricingCards mode="settings" currentTier={currentTier} />
        </div>
      </section>
    </div>
  );
}
