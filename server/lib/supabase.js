/**
 * lib/supabase.js
 * Supabase service-role (admin) client for server-side operations.
 * Uses the service role key which bypasses Row Level Security.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isValidHttpUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\//i.test(url.trim());
};

const isConfigured =
  isValidHttpUrl(supabaseUrl) &&
  supabaseServiceRoleKey &&
  !supabaseServiceRoleKey.includes('paste_your_');

if (!isConfigured) {
  console.warn(
    '[Supabase] NOTICE: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured with a valid URL. ' +
    'Operating in standalone mode.'
  );
}

/**
 * Admin Supabase client using the service role key.
 * This client bypasses RLS and should only be used server-side.
 */
const supabaseAdmin = isConfigured
  ? createClient(supabaseUrl.trim(), supabaseServiceRoleKey.trim(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export { supabaseAdmin };
