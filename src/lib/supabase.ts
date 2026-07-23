import { createClient } from '@supabase/supabase-js'

// The Supabase URL and publishable key are safe to ship in the browser bundle:
// they are designed for client-side use, and Row Level Security protects the data.
// Env vars override these defaults for local development or a different project.
const url =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://lgxwgsiehprplflawjqd.supabase.co'
const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  'sb_publishable_40KD_ZXfUqVGdhxuw5Ng3g_ccpWFZHX'

export const supabase = createClient(url, key)
