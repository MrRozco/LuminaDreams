import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Images */
  images: {
    remotePatterns: [
      // Supabase Storage (dream images/videos, avatars)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
      // xAI-generated media URLs
      {
        protocol: "https",
        hostname: "*.x.ai",
        pathname: "/**",
      },
    ],
  },

  /* Security headers */
  async headers() {
    // CSP is intentionally permissive for script-src because Next.js RSC
    // requires inline scripts. The other directives restrict connections,
    // framing, and media loading — covering the highest-risk attack vectors.
    const csp = [
      "default-src 'self'",
      // Next.js hydration + Stripe.js + Cloudflare Turnstile
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com",
      // Tailwind / shadcn inline styles
      "style-src 'self' 'unsafe-inline'",
      // Supabase Storage (images, avatars) + xAI CDN + data URIs + blobs
      "img-src 'self' data: blob: https://*.supabase.co https://*.x.ai",
      // Video/audio from Supabase Storage
      "media-src 'self' blob: https://*.supabase.co https://*.x.ai",
      // API calls: Supabase, xAI, Stripe
      "connect-src 'self' https://*.supabase.co https://api.x.ai https://api.stripe.com",
      // Stripe & Turnstile iframes only
      "frame-src https://js.stripe.com https://challenges.cloudflare.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Origin-Agent-Cluster", value: "?1" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
