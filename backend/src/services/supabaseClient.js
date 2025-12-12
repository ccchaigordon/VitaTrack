require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!SUPABASE_SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_KEY');

// Keep backward compatibility: many modules expect `require(.../supabaseClient)`
// to return a Supabase client with service-role access.
const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Create a per-request Supabase client that enforces RLS using the user's JWT.
function createUserSupabaseClient(userAccessToken) {
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_ANON_KEY (required for RLS-enforced server queries)');
  }
  if (!userAccessToken) throw new Error('Missing user access token');

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${userAccessToken}`
      }
    }
  });
}

// Attach helper(s) without breaking existing `supabaseServer.from(...)` usage.
supabaseServer.createUserSupabaseClient = createUserSupabaseClient;

module.exports = supabaseServer;