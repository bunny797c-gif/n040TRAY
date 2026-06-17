import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmation } from '@/lib/email';
import { scheduleDeliveries } from '@/lib/scheduleDeliveries';

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_db_id, subscription_id } = await req.json();

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', order_db_id);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await supabase
    .from('orders')
    .update({ status: 'paid', razorpay_payment_id, razorpay_signature, paid_at: new Date().toISOString() })
    .eq('id', order_db_id)
    .eq('user_id', user.id);

  await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('id', subscription_id)
    .eq('user_id', user.id);

  // Schedule all delivery slots
  try {
    const admin = createAdminClient();
    const { data: sub } = await admin
      .from('subscriptions')
      .select('id, user_id, next_delivery_date, plans(deliveries, name, audience), addresses(full_name, phone, line1, line2, city, state, pincode)')
      .eq('id', subscription_id)
      .single();

    await scheduleDeliveries(admin, sub, sub.plans.deliveries);

    // Email confirmation
    const { data: order } = await admin.from('orders').select('amount_inr').eq('id', order_db_id).maybeSingle();
    await sendOrderConfirmation(user.email, {
      name: sub?.addresses?.full_name,
      planName: sub?.plans?.name,
      audience: sub?.plans?.audience,
      amount: order?.amount_inr,
      deliveries: sub?.plans?.deliveries,
      nextDelivery: sub?.next_delivery_date,
      address: sub?.addresses,
    });
  } catch (e) {
    console.warn('[verify] post-activation tasks skipped', e?.message || e);
  }

  // Trigger referral reward (fire and forget)
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/referral/reward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refereeId: user.id, orderId: order_db_id }),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
