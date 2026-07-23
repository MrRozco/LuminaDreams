export async function verifyTurnstileToken(args: { token: string; remoteIp?: string | null }) {
  const { token, remoteIp } = args;
  const shouldEnforce = process.env.TURNSTILE_ENFORCE === "true";
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!shouldEnforce) {
    return true;
  }

  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY is missing while TURNSTILE_ENFORCE=true.");
  }

  if (!token) {
    return false;
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}
