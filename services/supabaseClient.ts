import { createClient } from '@supabase/supabase-js';

// Safe Environment Variable Accessor
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const val = (import.meta as any).env[key];
    if (val) return val;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Robust check: Ensure variables exist AND are not default placeholders
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.warn("Supabase credentials missing or placeholders detected. App running in local-only mode.");
}

// Initialize with fallback.
// If isSupabaseConfigured is false, the app logic (in db.ts) prevents using this client for data sync.
export const supabase = createClient(
  (supabaseUrl && !supabaseUrl.includes('your-project')) ? supabaseUrl : 'https://placeholder.supabase.co', 
  (supabaseAnonKey && !supabaseAnonKey.includes('your-anon-key')) ? supabaseAnonKey : 'placeholder-key'
);