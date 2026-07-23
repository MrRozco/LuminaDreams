/**
 * lib/supabase/middleware.ts
 * ---------------------------------------------------------------------------
 * Session-refresh helper for the Next.js root middleware.
 *
 * Called on every request to:
 *   1. Refresh the Supabase access token (silently, via the refresh token
 *      stored in the cookie) so the session never expires mid-navigation.
 *   2. Enforce route protection rules:
 *      - Unauthenticated users hitting a protected route → redirect to /auth/login
 *      - Authenticated users hitting /auth/* → redirect to /dashboard
 *
 * IMPORTANT (from Supabase docs):
 *   Do not add any logic between createServerClient and supabase.auth.getUser().
 *   Always return the supabaseResponse object unmodified, or copy its cookies
 *   onto any new NextResponse you construct.
 * ---------------------------------------------------------------------------
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/** Routes that are accessible without authentication */
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/signup", "/auth/callback", "/auth/verify"];

/** Route prefixes that are always public (static assets, API health) */
const PUBLIC_PREFIXES = ["/api/health", "/api/stripe/webhook"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

function isAuthRoute(pathname: string): boolean {
  // Keep callback/verify accessible so auth code exchanges can complete.
  if (pathname === "/auth/callback" || pathname === "/auth/verify") {
    return false;
  }

  return pathname.startsWith("/auth");
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  /*
   * Build a mutable response. We must pass `request` so Next.js can
   * read/write the same cookie jar throughout the middleware chain.
   */
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Mirror onto the request so RSCs downstream see fresh cookies.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 2. Rebuild the response with the updated request cookies.
          supabaseResponse = NextResponse.next({ request });
          // 3. Set each cookie on the response so the browser receives them.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /*
   * Refresh the session (exchanges the refresh token for a fresh access token
   * when the current one is about to expire).
   * getUser() is the authoritative check — do NOT use getSession() here.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /* ── Route protection ────────────────────────────────── */

  // Authenticated user hitting an auth page → send to dashboard
  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Unauthenticated user hitting a protected route → send to login
  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Preserve the originally-requested path so we can redirect back after login
    if (pathname !== "/") {
      url.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(url);
  }

  /*
   * IMPORTANT: Return supabaseResponse — not a new NextResponse.next().
   * The cookie updates above must travel with the response.
   */
  return supabaseResponse;
}
