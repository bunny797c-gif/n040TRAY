import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser } from '@/lib/admin';

export async function GET() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(name, audience, price_inr, duration), profiles(email, full_name), addresses(full_name, phone, line1, line2, city, state, pincode)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
