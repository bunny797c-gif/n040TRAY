import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. Use ONLY in server-side webhooks/admin routes.
// Never expose this to the browser or pass it to client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Get it from Supabase Dashboard → Project Settings → API → service_role.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
