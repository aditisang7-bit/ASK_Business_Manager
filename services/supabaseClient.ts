import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wibgovfccgzohlaxxhuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpYmdvdmZjY2d6b2hsYXh4aHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg2NzMsImV4cCI6MjA4NDc1NDY3M30.ot_mEEkWozSBQsJ3Cd2zGGTyhCyaAobRvcolt7Ptab0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);