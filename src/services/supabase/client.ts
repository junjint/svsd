import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Optional Supabase client. Returns null when env vars are missing so the
 * MVP can run fully offline with AsyncStorage.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
}
