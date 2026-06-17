import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser } from '@/lib/admin';
import { addDays } from '@/lib/dates';

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

// PATCH /api/admin/subscriptions
// body: { id, action: 'deliver' } — marks delivered and advances next_delivery_date by 7 days
// body: { id, action: 'advance' } — just advance next_delivery_date (fix stale dates)
export async function PATCH(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { id, action } = await req.json();
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, next_delivery_date, status')
    .eq('id', id)
    .single();

  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  const nextDate = addDays(sub.next_delivery_date, 7);

  if (action === 'deliver') {
    // Mark the most recent paid/active order for this subscription as delivered
    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('subscription_id', id)
      .in('status', ['paid', 'packed', 'out_for_delivery'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (order) {
      await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id);
    }

    // Advance next_delivery_date
    await supabase.from('subscriptions').update({ next_delivery_date: nextDate }).eq('id', id);
    return NextResponse.json({ ok: true, next_delivery_date: nextDate });
  }

  if (action === 'advance') {
    await supabase.from('subscriptions').update({ next_delivery_date: nextDate }).eq('id', id);
    return NextResponse.json({ ok: true, next_delivery_date: nextDate });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
