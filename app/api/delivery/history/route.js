import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const offset = (page - 1) * limit;

  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!partner) return NextResponse.json({ error: 'Not a delivery partner' }, { status: 403 });

  const admin = createAdminClient();
  const { data: deliveries, error, count } = await admin
    .from('deliveries')
    .select(`
      id, scheduled_date, status, delivered_at, picked_up_at, failed_reason,
      user:profiles!deliveries_user_id_fkey(full_name, phone),
      subscription:subscriptions(plans(name), addresses(line1, city, pincode))
    `, { count: 'exact' })
    .eq('delivery_partner_id', partner.id)
    .in('status', ['delivered', 'failed'])
    .order('scheduled_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deliveries: deliveries || [], total: count, page, limit });
}
