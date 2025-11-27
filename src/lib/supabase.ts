import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mzguoaihqpdhhaytqrwa.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseKey) {
  console.warn('Missing VITE_SUPABASE_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseKey || '');
