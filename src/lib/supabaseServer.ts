import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

/**
 * Server-side administrative Supabase client
 * Uses the Service Role Key for backend administrative operations and API routes
 */
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
