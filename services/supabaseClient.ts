import { createClient } from '@supabase/supabase-js';

// Safe Environment Variable Accessor
const getEnv = (key: string) => {
  // 1. Try import.meta.env (Vite Standard) safely
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const val = (import.meta as any).env[key];
    if (val) return val;
  }
  // 2. Fallback to process.env (Node/Polyfilled Standard)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing! Check your .env file.");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);