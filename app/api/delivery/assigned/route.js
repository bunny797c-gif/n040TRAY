import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { todayIST } from '@/lib/dates';

export async function GET(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayIST();

  // Get partner record (user's own row — RLS allows this)
  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!partner) return NextResponse.json({ error: 'Not a delivery partner' }, { status: 403 });

  // Use admin client to bypass RLS on subscriptions/addresses/profiles joins
  const admin = createAdminClient();
  const { data: deliveries, error } = await admin
    .from('deliveries')
    .select(`
      id, scheduled_date, status, picked_up_at, failed_reason, notes,
      subscription:subscriptions(
        id,
        plans(name),
        addresses(full_name, phone, line1, line2, city, state, pincode)
      ),
      user:profiles!deliveries_user_id_fkey(full_name, email, phone)
    `)
    .eq('delivery_partner_id', partner.id)
    .eq('scheduled_date', date)
    .in('status', ['scheduled', 'picked_up', 'in_transit', 'delivered', 'failed'])
    .order('status');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deliveries: deliveries || [] });
}
