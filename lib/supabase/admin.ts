/**
 * lib/supabase/admin.ts
 * ---------------------------------------------------------------------------
 * Service-role Supabase client — bypasses Row Level Security.
 *
 * ⚠️  SECURITY WARNING
 * - This client uses SUPABASE_SERVICE_ROLE_KEY which has full database access.
 * - ONLY import this in trusted server-side code:
 *     - Server Actions (action files in app/)
 *     - Route Handlers (app/api/**)
 *     - Scripts / migrations
 * - NEVER import this in Client Components, or any file that could be
 *   bundled into the browser (e.g. files inside components/ or pages/).
 * ---------------------------------------------------------------------------
 *
 * Usage:
 *   import { createAdminClient } from '@/lib/supabase/admin'
 *   const supabase = createAdminClient()
 *   // Full DB access, no RLS checks
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[createAdminClient] Missing required environment variables: " +
        "NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. " +
        "These must be set in .env.local for server-side use only."
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      // The service-role client never needs to persist a user session.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
