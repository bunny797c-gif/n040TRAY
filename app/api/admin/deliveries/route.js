import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser } from '@/lib/admin';
import { addDays } from '@/lib/dates';

export async function GET() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const admin = createAdminClient();

  // Fetch all deliveries with subscription + customer info
  const { data, error } = await admin
    .from('deliveries')
    .select(`
      id, scheduled_date, status, delivered_at, notes,
      subscription_id,
      subscriptions (
        id, status, next_delivery_date,
        plans ( name, audience ),
        profiles ( full_name, email ),
        addresses ( full_name, phone, line1, line2, city, state, pincode )
      )
    `)
    .order('scheduled_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// PATCH — mark a delivery as delivered, skipped, or scheduled
export async function PATCH(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });

  const allowed = ['delivered', 'skipped', 'scheduled'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const admin = createAdminClient();

  const update = { status };
  if (status === 'delivered') update.delivered_at = new Date().toISOString();
  if (status !== 'delivered') update.delivered_at = null;

  const { data: delivery, error } = await admin
    .from('deliveries')
    .update(update)
    .eq('id', id)
    .select('subscription_id, scheduled_date')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If marking delivered, advance subscription's next_delivery_date
  if (status === 'delivered') {
    const { data: next } = await admin
      .from('deliveries')
      .select('scheduled_date')
      .eq('subscription_id', delivery.subscription_id)
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next) {
      await admin.from('subscriptions')
        .update({ next_delivery_date: next.scheduled_date })
        .eq('id', delivery.subscription_id);
    }
  }

  return NextResponse.json({ ok: true });
}

// POST — backfill: create delivery schedule for existing active subscriptions that have none
export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { subscription_id } = await req.json();
  if (!subscription_id) return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });

  const admin = createAdminClient();

  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, user_id, next_delivery_date, status, plans(deliveries)')
    .eq('id', subscription_id)
    .single();

  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  // Delete any existing scheduled (not delivered/skipped) and re-create from next_delivery_date
  await admin.from('deliveries')
    .delete()
    .eq('subscription_id', subscription_id)
    .eq('status', 'scheduled');

  const count = sub.plans?.deliveries || 4;
  const rows = [];
  let date = sub.next_delivery_date;
  for (let i = 0; i < count; i++) {
    rows.push({
      subscription_id: sub.id,
      user_id: sub.user_id,
      scheduled_date: date,
      status: 'scheduled',
    });
    date = addDays(date, 7);
  }

  const { error } = await admin.from('deliveries').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, scheduled: rows.length });
}
