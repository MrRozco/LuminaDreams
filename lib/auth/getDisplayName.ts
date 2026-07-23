interface DisplayNameInput {
  email?: string | null;
  userMetadata?: Record<string, unknown> | null;
}

export function getDisplayName({ email, userMetadata }: DisplayNameInput): string {
  const preferred = userMetadata?.display_name;
  if (typeof preferred === "string" && preferred.trim().length > 0) {
    return preferred.trim();
  }

  const fullName = userMetadata?.full_name;
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName.trim();
  }

  if (typeof email === "string" && email.includes("@")) {
    return email.split("@")[0];
  }

  return "Dreamer";
}
