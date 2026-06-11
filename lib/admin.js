import { createClient } from '@/lib/supabase/server';

// Returns { user, isAdmin }. Use in /admin pages and admin API routes.
export async function getAdminUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  return { user, isAdmin: Boolean(profile?.is_admin) };
}
