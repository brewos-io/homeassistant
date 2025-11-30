import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

// Admin client (for server-side operations)
// Using any type for flexibility - the database schema is defined in migrations
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create a client for a specific user (with their JWT)
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(
    supabaseUrl || '',
    process.env.SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}

