import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Razorpay webhook secret — set in dashboard under Webhooks
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(req) {
  if (!WEBHOOK_SECRET) {
    console.error('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Razorpay signs with HMAC-SHA256(secret, body)
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');

  if (!signature || signature !== expected) {
    console.warn('[razorpay-webhook] signature mismatch');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const eventType = event.event;
  const payment = event.payload?.payment?.entity;
  const refund = event.payload?.refund?.entity;
  const razorpayOrderId = payment?.order_id || refund?.notes?.order_id;
  const razorpayPaymentId = payment?.id || refund?.payment_id;
  const razorpayEventId = event.id || `${eventType}_${razorpayPaymentId || razorpayOrderId}_${Date.now()}`;

  // Log the event (idempotent on razorpay_event_id)
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id, processed')
    .eq('razorpay_event_id', razorpayEventId)
    .maybeSingle();
  if (existing?.processed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { data: logged } = await supabase
    .from('webhook_events')
    .upsert({
      source: 'razorpay',
      event_type: eventType,
      razorpay_event_id: razorpayEventId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      payload: event,
    }, { onConflict: 'razorpay_event_id' })
    .select()
    .single();

  try {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id: razorpayPaymentId,
          paid_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', razorpayOrderId)
        .neq('status', 'paid');

      // Find linked subscription and activate it
      const { data: order } = await supabase
        .from('orders')
        .select('subscription_id')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();
      if (order?.subscription_id) {
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', order.subscription_id)
          .eq('status', 'pending_payment');
      }
    } else if (eventType === 'payment.failed') {
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', razorpayOrderId)
        .neq('status', 'paid');
    } else if (eventType === 'refund.processed' || eventType === 'refund.created') {
      await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('razorpay_payment_id', razorpayPaymentId);
    }
    // Other events: just log, no DB mutation needed

    await supabase.from('webhook_events').update({ processed: true }).eq('id', logged.id);
  } catch (e) {
    await supabase
      .from('webhook_events')
      .update({ processed: false, error: String(e?.message || e) })
      .eq('id', logged.id);
    console.error('[razorpay-webhook] processing error', e);
    // Still return 200 so Razorpay doesn't retry indefinitely; we have it logged.
  }

  return NextResponse.json({ ok: true });
}
