import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { sendOrderConfirmation } from '@/lib/email';

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
    .update({
      status: 'paid',
      razorpay_payment_id,
      razorpay_signature,
      paid_at: new Date().toISOString(),
    })
    .eq('id', order_db_id)
    .eq('user_id', user.id);

  await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('id', subscription_id)
    .eq('user_id', user.id);

  // Fire and forget — don't block the response on email
  try {
    const { data: order } = await supabase.from('orders').select('amount_inr, subscription_id').eq('id', order_db_id).maybeSingle();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('next_delivery_date, plans(name, audience, deliveries), addresses(full_name, phone, line1, line2, city, state, pincode)')
      .eq('id', subscription_id)
      .maybeSingle();

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
    console.warn('[verify] email send skipped', e?.message || e);
  }

  return NextResponse.json({ ok: true });
}
