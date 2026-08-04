type AuthContext = "password_reset" | "signin" | "signup" | "magic_link" | "settings_password";

export function getUserFriendlyAuthErrorMessage(error: unknown, context: AuthContext): string {
  const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit exceeded") || normalized.includes("too many")) {
    if (context === "password_reset") {
      return "We couldn’t send the password reset email right now. Please wait a few minutes and try again.";
    }

    return "We couldn’t complete that request right now. Please wait a few minutes and try again.";
  }

  return message || "Authentication failed. Please try again.";
}
