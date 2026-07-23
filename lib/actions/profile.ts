"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username is too long");

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(80),
  username: z.union([z.literal(""), usernameSchema]).optional(),
  timezone: z.string().trim().min(1, "Timezone is required").max(100),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateProfileAction(formData: FormData) {
  const parsed = profileSchema.safeParse({
    displayName: getString(formData, "displayName"),
    username: getString(formData, "username"),
    timezone: getString(formData, "timezone"),
  });

  if (!parsed.success) {
    redirect(`/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid profile values")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { displayName, username, timezone } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      username: username && username.length > 0 ? username : null,
      timezone,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/settings?success=Profile updated");
}
