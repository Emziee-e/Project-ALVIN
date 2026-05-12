import { createClient } from '@supabase/supabase-js'

// Vite uses import.meta.env to access variables in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This creates the single instance of Supabase you'll use everywhere
export const supabase = createClient(supabaseUrl, supabaseAnonKey)