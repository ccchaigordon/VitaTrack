import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

const PERSIST_KEY = 'vitatrack_keep_logged_in';

function getPreferredPersist(): boolean {
  const raw = localStorage.getItem(PERSIST_KEY);
  if (raw === null) return true; // default: keep logged in
  return raw === 'true';
}

function getProjectRefFromUrl(url: string): string {
  return new URL(url).hostname.split('.')[0] || 'unknown';
}

const STORAGE_KEY = `sb-${getProjectRefFromUrl(supabaseUrl)}-auth-token`;

function activeStorage(): Storage {
  return getPreferredPersist() ? localStorage : sessionStorage;
}

const switchableStorage = {
  getItem: (key: string) => activeStorage().getItem(key),
  setItem: (key: string, value: string) => activeStorage().setItem(key, value),
  removeItem: (key: string) => activeStorage().removeItem(key)
};

export function setAuthPersistence(keepLoggedIn: boolean) {
  const old = getPreferredPersist() ? localStorage : sessionStorage;
  const next = keepLoggedIn ? localStorage : sessionStorage;

  if (old !== next) {
    const existing = old.getItem(STORAGE_KEY);
    if (existing) {
      next.setItem(STORAGE_KEY, existing);
      old.removeItem(STORAGE_KEY);
    }
  }

  localStorage.setItem(PERSIST_KEY, String(keepLoggedIn));
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: STORAGE_KEY,
    storage: switchableStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export function getSupabase() {
  return supabase;
}


