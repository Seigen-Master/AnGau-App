/**
 * Supabase Client (Client-Side)
 * 
 * Use this client in React components and client-side code.
 * This client uses the anon key and respects RLS policies.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Singleton pattern to ensure only one client instance
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

// Export a default instance
export const supabase = createClient();

