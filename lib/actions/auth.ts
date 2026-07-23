"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { RATE_LIMITS } from "@/lib/constants";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/abuse";
import { verifyTurnstileToken } from "@/lib/security/captcha";
import { isDisposableEmail } from "@/lib/security/disposable-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email("Please enter a valid email address.");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");
const displayNameSchema = z.string().trim().min(2).max(80).optional();

/** Only allow same-origin relative paths to prevent open-redirect attacks. */
function sanitizeRedirectTo(raw: string): string {
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    // Strip any protocol-relative or absolute URL smuggled after a slash
    return raw;
  }
  return "/dashboard";
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function toSearch(value: string) {
  return encodeURIComponent(value);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signUpWithPassword(formData: FormData) {
  const emailInput = getString(formData, "email");
  const passwordInput = getString(formData, "password");
  const displayNameInput = getString(formData, "displayName");

  const emailResult = emailSchema.safeParse(emailInput);
  const passwordResult = passwordSchema.safeParse(passwordInput);
  const displayNameResult = displayNameSchema.safeParse(displayNameInput || undefined);

  if (!emailResult.success || !passwordResult.success || !displayNameResult.success) {
    redirect("/auth/signup?error=" + toSearch("Please provide valid signup details."));
  }

  const ip = await getClientIpAddress();
  const captchaToken = getString(formData, "captchaToken");

  const captchaOk = await verifyTurnstileToken({ token: captchaToken, remoteIp: ip });
  if (!captchaOk) {
    redirect("/auth/signup?error=" + toSearch("CAPTCHA verification failed. Please try again."));
  }

  if (isDisposableEmail(emailResult.data)) {
    redirect("/auth/signup?error=" + toSearch("Please use a non-temporary email address."));
  }

  try {
    await enforceRateLimit({
      eventType: "signup_attempt",
      scopeType: "ip",
      scopeKey: ip,
      maxEvents: RATE_LIMITS.signupPerIpPerHour,
      windowMinutes: 60,
    });
    await enforceRateLimit({
      eventType: "signup_attempt",
      scopeType: "email",
      scopeKey: emailResult.data.toLowerCase(),
      maxEvents: RATE_LIMITS.signupPerEmailPerDay,
      windowMinutes: 60 * 24,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Too many signup attempts.";
    redirect("/auth/signup?error=" + toSearch(msg));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: emailResult.data,
    password: passwordResult.data,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
      data: {
        display_name: displayNameResult.data ?? null,
      },
    },
  });

  if (error) {
    redirect("/auth/signup?error=" + toSearch(error.message));
  }

  redirect(`/auth/verify?email=${toSearch(emailResult.data)}`);
}

export async function signInWithPassword(formData: FormData) {
  const emailInput = getString(formData, "email");
  const passwordInput = getString(formData, "password");
  const redirectTo = sanitizeRedirectTo(getString(formData, "redirectTo"));

  const emailResult = emailSchema.safeParse(emailInput);
  const passwordResult = passwordSchema.safeParse(passwordInput);

  if (!emailResult.success || !passwordResult.success) {
    redirect("/auth/login?error=" + toSearch("Invalid email or password format."));
  }

  const ip = await getClientIpAddress();
  const captchaToken = getString(formData, "captchaToken");
  const captchaOk = await verifyTurnstileToken({ token: captchaToken, remoteIp: ip });
  if (!captchaOk) {
    redirect("/auth/login?error=" + toSearch("CAPTCHA verification failed. Please try again."));
  }

  try {
    await enforceRateLimit({
      eventType: "signin_attempt",
      scopeType: "ip",
      scopeKey: ip,
      maxEvents: RATE_LIMITS.loginPerIpPerHour,
      windowMinutes: 60,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Too many sign-in attempts.";
    redirect("/auth/login?error=" + toSearch(msg));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: emailResult.data,
    password: passwordResult.data,
  });

  if (error) {
    redirect("/auth/login?error=" + toSearch(error.message));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_banned, is_limited")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_banned) {
      await supabase.auth.signOut();
      redirect("/auth/login?error=" + toSearch("This account has been blocked due to abuse detection."));
    }

    if (profile?.is_limited) {
      await supabase.auth.signOut();
      redirect("/auth/login?error=" + toSearch("This account is temporarily limited. Please contact support."));
    }

    await admin
      .from("profiles")
      .update({ last_sign_in_ip: ip })
      .eq("id", user.id);
  }

  redirect(redirectTo);
}

export async function signInWithMagicLink(formData: FormData) {
  const emailInput = getString(formData, "email");
  const redirectTo = sanitizeRedirectTo(getString(formData, "redirectTo"));

  const emailResult = emailSchema.safeParse(emailInput);
  if (!emailResult.success) {
    redirect("/auth/login?error=" + toSearch("Enter a valid email for magic link."));
  }

  const ip = await getClientIpAddress();
  const captchaToken = getString(formData, "captchaToken");
  const captchaOk = await verifyTurnstileToken({ token: captchaToken, remoteIp: ip });
  if (!captchaOk) {
    redirect("/auth/login?error=" + toSearch("CAPTCHA verification failed. Please try again."));
  }

  try {
    await enforceRateLimit({
      eventType: "magic_link_attempt",
      scopeType: "ip",
      scopeKey: ip,
      maxEvents: RATE_LIMITS.magicLinkPerIpPerHour,
      windowMinutes: 60,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Too many magic link requests.";
    redirect("/auth/login?error=" + toSearch(msg));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: emailResult.data,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    redirect("/auth/login?error=" + toSearch(error.message));
  }

  redirect(`/auth/verify?email=${toSearch(emailResult.data)}&mode=magic`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
