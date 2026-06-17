import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';
import { sendOrderConfirmation } from '@/lib/email';
import { nextSundayIST, todayIST } from '@/lib/dates';

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { plan_id, address, referral_code } = await req.json();
  if (!plan_id || !address) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Validate phone format strictly
  if (!/^[6-9]\d{9}$/.test(String(address.phone || ''))) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  }

  // Phone must be verified via OTP
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified_at, verified_phone')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.phone_verified_at || profile.verified_phone !== address.phone) {
    return NextResponse.json({ error: 'Please verify your phone number with OTP before placing the order.' }, { status: 400 });
  }

  // Validate serviceable pincode server-side (never trust client)
  if (!/^\d{6}$/.test(String(address.pincode || ''))) {
    return NextResponse.json({ error: 'Invalid pincode.' }, { status: 400 });
  }
  const { data: pinRow } = await supabase
    .from('serviceable_pincodes')
    .select('pincode')
    .eq('pincode', address.pincode)
    .eq('is_active', true)
    .maybeSingle();
  if (!pinRow) {
    return NextResponse.json({ error: "We don't deliver to this pincode yet." }, { status: 400 });
  }

  // Fetch plan
  const { data: plan, error: planError } = await supabase
    .from('plans').select('*').eq('id', plan_id).maybeSingle();
  if (planError || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  // Upsert address
  const { data: addr, error: addrError } = await supabase
    .from('addresses')
    .insert({
      user_id: user.id,
      full_name: address.full_name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      is_default: true,
    })
    .select()
    .single();
  if (addrError) return NextResponse.json({ error: addrError.message }, { status: 500 });

  // Validate referral code and compute discount
  let discountCoins = 0;
  let validatedReferralCode = null;
  if (referral_code) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const { data: codeRow } = await admin
      .from('referral_codes')
      .select('id, user_id, is_active, uses_count, max_uses')
      .eq('code', referral_code.toUpperCase().trim())
      .maybeSingle();
    if (codeRow && codeRow.is_active && codeRow.uses_count < codeRow.max_uses && codeRow.user_id !== user.id) {
      discountCoins = 500; // 500 coins = ₹50 off
      validatedReferralCode = referral_code.toUpperCase().trim();
      // Store on profile for reward trigger at verify time
      await admin.from('profiles').update({ referred_by_code: validatedReferralCode }).eq('id', user.id);
    }
  }

  const discountInr = Math.floor(discountCoins / 10);
  const finalAmount = Math.max(0, plan.price_inr - discountInr);

  // Create pending subscription
  const today = todayIST();
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      address_id: addr.id,
      status: 'pending_payment',
      start_date: today,
      next_delivery_date: nextSundayIST(),
    })
    .select()
    .single();
  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  // Create order row
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      subscription_id: sub.id,
      amount_inr: finalAmount,
      status: 'created',
    })
    .select()
    .single();
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  // Razorpay
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes('REPLACE_ME') || key_secret.includes('REPLACE_ME')) {
    // Stub: mark as paid immediately so user can test flow without Razorpay keys
    await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id);
    await supabase.from('subscriptions').update({ status: 'active' }).eq('id', sub.id);
    try {
      await sendOrderConfirmation(user.email, {
        name: addr.full_name,
        planName: plan.name,
        audience: plan.audience,
        amount: finalAmount,
        deliveries: plan.deliveries,
        nextDelivery: sub.next_delivery_date,
        address: addr,
        discountInr: discountInr || 0,
      });
    } catch {}
    // Trigger referral reward for stub path
    if (validatedReferralCode) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/referral/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refereeId: user.id, orderId: order.id }),
      }).catch(() => null);
    }
    return NextResponse.json({ stub: true, message: 'Razorpay not configured — marked as active for testing.' });
  }

  const razorpay = new Razorpay({ key_id, key_secret });
  try {
    const rzpOrder = await razorpay.orders.create({
      amount: finalAmount * 100,
      currency: 'INR',
      receipt: order.id,
      notes: { subscription_id: sub.id, user_id: user.id, plan_id: plan.id },
    });
    await supabase.from('orders').update({ razorpay_order_id: rzpOrder.id }).eq('id', order.id);
    return NextResponse.json({
      razorpay_key: key_id,
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      order_db_id: order.id,
      subscription_id: sub.id,
      discount_inr: discountInr,
      referral_code: validatedReferralCode,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Razorpay order failed' }, { status: 500 });
  }
}
