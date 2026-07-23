"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

let scriptRequested = false;

export function TurnstileField() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const shouldEnforce = process.env.NEXT_PUBLIC_TURNSTILE_ENFORCE === "true";
  const [token, setToken] = useState("");
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && !!window.turnstile,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldEnforce || !siteKey) return;
    if (window.turnstile) return;

    if (!scriptRequested) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptReady(true);
      document.head.appendChild(script);
      scriptRequested = true;
      return;
    }

    const timer = window.setInterval(() => {
      if (window.turnstile) {
        setScriptReady(true);
        window.clearInterval(timer);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [shouldEnforce, siteKey]);

  useEffect(() => {
    if (!shouldEnforce || !siteKey) return;
    if (!scriptReady || !window.turnstile || !containerRef.current) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (nextToken) => setToken(nextToken),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
      theme: "dark",
    });
  }, [scriptReady, shouldEnforce, siteKey]);

  if (!shouldEnforce || !siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} />
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  );
}
