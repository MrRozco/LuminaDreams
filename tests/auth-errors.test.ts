import { describe, expect, it } from "vitest";
import { getUserFriendlyAuthErrorMessage } from "@/lib/auth/error-messages";

describe("getUserFriendlyAuthErrorMessage", () => {
  it("maps Supabase email rate limit errors to a clearer password reset message", () => {
    expect(getUserFriendlyAuthErrorMessage("Email rate limit exceeded", "password_reset")).toBe(
      "We couldn’t send the password reset email right now. Please wait a few minutes and try again."
    );
  });

  it("preserves unrelated errors", () => {
    expect(getUserFriendlyAuthErrorMessage("Invalid login credentials", "signin")).toBe("Invalid login credentials");
  });
});
