"use client";

/**
 * lib/supabase/client.ts
 * ---------------------------------------------------------------------------
 * Browser-side Supabase client.
 *
 * Usage (Client Components only):
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *
 * - Uses createBrowserClient from @supabase/ssr, which handles cookie-based
 *   session management automatically in the browser.
 * - Safe to call multiple times — the library de-duplicates the instance.
 * - NEVER pass secret/service-role keys here; this runs in the browser.
 * ---------------------------------------------------------------------------
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
