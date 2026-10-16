import { createClient } from '@supabase/supabase-js';

// Single shared client: auth and data must use the same instance,
// otherwise data requests don't carry the logged-in user's session.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
