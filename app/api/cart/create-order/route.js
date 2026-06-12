import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';
import { nextSundayIST } from '@/lib/dates';
import { sendCartConfirmation } from '@/lib/email';

const PACK_PRICE_COL = { '100g': 'price_100g', '200g': 'price_200g', '500g': 'price_500g' };
const FALLBACK_PRICE = 249;

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { items, address } = await req.json();
  if (!items?.length || !address) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  if (!/^[6-9]\d{9}$/.test(String(address.phone || ''))) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  }

  // Phone must be verified
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified_at, verified_phone')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.phone_verified_at || profile.verified_phone !== address.phone) {
    return NextResponse.json({ error: 'Please verify your phone number with OTP first.' }, { status: 400 });
  }

  // Validate pincode
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

  // Price each item server-side from the catalog (never trust client prices)
  const names = [...new Set(items.map((i) => i.name))];
  const { data: catalog = [] } = await supabase
    .from('microgreens_catalog')
    .select('name, price_100g, price_200g, price_500g, out_of_stock')
    .in('name', names);
  const byName = Object.fromEntries((catalog || []).map((c) => [c.name, c]));

  const orderItems = [];
  let totalAmt = 0;
  for (const i of items) {
    const qty = Math.max(1, Math.min(50, Number(i.qty) || 1));
    const cat = byName[i.name];
    if (cat?.out_of_stock) {
      return NextResponse.json({ error: `${i.name} is out of stock.` }, { status: 400 });
    }
    const col = PACK_PRICE_COL[i.packLabel];
    const unitPrice = (cat && col && Number(cat[col])) || Number(i.price) || FALLBACK_PRICE;
    totalAmt += qty * unitPrice;
    orderItems.push({ name: i.name, pack: i.packLabel || null, qty, price: unitPrice });
  }

  const deliveryDate = nextSundayIST();

  // Save address
  const { data: addr, error: addrError } = await supabase
    .from('addresses')
    .insert({ user_id: user.id, full_name: address.full_name, phone: address.phone, line1: address.line1, line2: address.line2 || null, city: address.city, state: address.state, pincode: address.pincode, is_default: true })
    .select().single();
  if (addrError) return NextResponse.json({ error: addrError.message }, { status: 500 });

  // Create order row (no subscription — one-time cart order)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ user_id: user.id, amount_inr: totalAmt, status: 'created', items: orderItems, delivery_date: deliveryDate })
    .select().single();
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes('REPLACE_ME') || key_secret.includes('REPLACE_ME')) {
    await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id);
    // Fire-and-forget confirmation email (stub flow used in dev/preview)
    if (user.email) {
      sendCartConfirmation(user.email, {
        name: address.full_name,
        items: orderItems,
        amount: totalAmt,
        deliveryDate,
        address: { ...address, full_name: address.full_name },
      }).catch((e) => console.error('[cart] email send failed', e));
    }
    return NextResponse.json({ stub: true });
  }

  const razorpay = new Razorpay({ key_id, key_secret });
  try {
    const rzpOrder = await razorpay.orders.create({
      amount: totalAmt * 100,
      currency: 'INR',
      receipt: order.id,
      notes: { user_id: user.id },
    });
    await supabase.from('orders').update({ razorpay_order_id: rzpOrder.id }).eq('id', order.id);
    return NextResponse.json({ razorpay_key: key_id, razorpay_order_id: rzpOrder.id, amount: rzpOrder.amount, order_db_id: order.id });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Razorpay order failed' }, { status: 500 });
  }
}
