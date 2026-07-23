/**
 * proxy.ts  (Next.js root proxy)
 * ---------------------------------------------------------------------------
 * Runs on every matched request before it reaches any page or API route.
 * Delegates to updateSession() which handles:
 *   - Supabase session refresh (cookie token rotation)
 *   - Route protection (auth guards + redirect-after-login)
 *
 * The matcher intentionally excludes:
 *   - Next.js internal routes (_next/static, _next/image)
 *   - The favicon
 *   - All static media files (images, fonts, etc.)
 * ---------------------------------------------------------------------------
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
};