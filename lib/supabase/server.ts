/**
 * lib/supabase/server.ts
 * ---------------------------------------------------------------------------
 * Server-side Supabase client.
 *
 * Usage (Server Components, Server Actions, Route Handlers):
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 *
 * - Reads/writes the auth session cookie through Next.js's async `cookies()`
 *   API, keeping the session consistent between RSC and client.
 * - The `setAll` catch block is intentional: Server Components cannot set
 *   cookies directly; the middleware handles token refresh for those cases.
 * - Must be called with `await` because `cookies()` is async in Next.js 15.
 * ---------------------------------------------------------------------------
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware will handle the
            // session refresh before it reaches the component tree.
          }
        },
      },
    }
  );
}

/**
 * Convenience helper: get the currently authenticated user.
 * Returns `null` (not an error) if no session exists.
 *
 * Example:
 *   const user = await getUser()
 *   if (!user) redirect('/auth/login')
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // getUser() returns an AuthError when the JWT is invalid/expired.
    // Treat this the same as "no user".
    return null;
  }

  return user;
}

/**
 * Convenience helper: get the full user session (includes access_token etc.).
 * Returns `null` if not authenticated.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
