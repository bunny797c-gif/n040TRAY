import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_db_id } = await req.json();

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret || key_secret.includes('REPLACE_ME')) {
    return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto.createHmac('sha256', key_secret).update(body).digest('hex');
  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
  }

  await supabase.from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString(), razorpay_payment_id })
    .eq('id', order_db_id)
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
