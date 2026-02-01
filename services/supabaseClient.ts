import { createClient } from '@supabase/supabase-js';

// Load from Environment Variables (process.env)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing! Check your .env file.");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);