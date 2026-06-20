import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser } from '@/lib/admin';
import { scheduleDeliveries } from '@/lib/scheduleDeliveries';
import { todayIST, nextSundayIST } from '@/lib/dates';

const SUB_SELECT =
  '*, plans(name, audience, price_inr, duration, deliveries), profiles(email, full_name, phone), addresses(full_name, phone, line1, line2, city, state, pincode)';

// Add a plan term (in months) to a 'YYYY-MM-DD' date string.
function addTerm(ymd, duration) {
  const months = { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 }[duration] ?? 1;
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ── GET — list all subscriptions with payment fields ──────────────────────
export async function GET() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subscriptions')
    .select(SUB_SELECT)
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// ── POST — action-based: create | record_payment | check_overdue ──────────
export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  const action = body.action;
  const admin = createAdminClient();

  // ---- Auto-pause every active subscription whose payment has lapsed ----
  if (action === 'check_overdue') {
    const today = todayIST();
    const { data, error } = await admin
      .from('subscriptions')
      .update({ status: 'paused', next_delivery_date: null })
      .eq('status', 'active')
      .lt('paid_until', today)
      .select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, paused: data?.length || 0 });
  }

  // ---- Record a (cash) payment: extend the term and reactivate ----
  if (action === 'record_payment') {
    const { subscription_id, amount } = body;
    if (!subscription_id) return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });

    const { data: sub } = await admin
      .from('subscriptions')
      .select('id, user_id, status, paid_until, next_delivery_date, plans(price_inr, duration)')
      .eq('id', subscription_id)
      .single();
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    const today = todayIST();
    // Extend from the later of (current paid_until, today) so paying early stacks.
    const base = sub.paid_until && sub.paid_until > today ? sub.paid_until : today;
    const newPaidUntil = addTerm(base, sub.plans?.duration);

    const update = { paid_until: newPaidUntil, status: 'active' };
    if (!sub.next_delivery_date) update.next_delivery_date = nextSundayIST();

    const { error: upErr } = await admin.from('subscriptions').update(update).eq('id', subscription_id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    await admin.from('orders').insert({
      user_id: sub.user_id,
      subscription_id,
      amount_inr: Number(amount) || sub.plans?.price_inr || 0,
      status: 'paid',
      paid_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, paid_until: newPaidUntil });
  }

  // ---- Create a manual / cash subscriber from scratch ----
  if (action === 'create') {
    const { full_name, email, phone, password, plan_id, address, amount } = body;
    if (!email || !full_name || !plan_id || !address?.line1 || !address?.pincode) {
      return NextResponse.json({ error: 'Name, email, plan, and address (line1 + pincode) are required.' }, { status: 400 });
    }

    const { data: plan } = await admin.from('plans').select('*').eq('id', plan_id).maybeSingle();
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    // Reuse an existing customer with this email, else create a new auth user.
    let userId;
    const { data: existing } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing) {
      userId = existing.id;
    } else {
      const pwd = password && password.length >= 6 ? password : Math.random().toString(36).slice(-10) + 'A1';
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: pwd,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });
      userId = created.user.id;
    }

    // Ensure profile reflects the latest name + phone (trigger created the row).
    await admin.from('profiles').update({ full_name, phone: phone || null }).eq('id', userId);

    const { data: addr, error: addrErr } = await admin
      .from('addresses')
      .insert({
        user_id: userId,
        full_name,
        phone: phone || '',
        line1: address.line1,
        line2: address.line2 || null,
        city: address.city || 'Tirupati',
        state: address.state || 'Andhra Pradesh',
        pincode: address.pincode,
        is_default: true,
      })
      .select()
      .single();
    if (addrErr) return NextResponse.json({ error: addrErr.message }, { status: 500 });

    const today = todayIST();
    const { data: sub, error: subErr } = await admin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        address_id: addr.id,
        status: 'active',
        start_date: today,
        next_delivery_date: nextSundayIST(),
        paid_until: addTerm(today, plan.duration),
        is_manual: true,
      })
      .select()
      .single();
    if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

    // Record the cash payment as a paid order so revenue reflects it.
    await admin.from('orders').insert({
      user_id: userId,
      subscription_id: sub.id,
      amount_inr: Number(amount) || plan.price_inr,
      status: 'paid',
      paid_at: new Date().toISOString(),
    });

    // Schedule the full Sunday delivery run.
    try {
      await scheduleDeliveries(admin, { id: sub.id, user_id: userId, next_delivery_date: sub.next_delivery_date }, plan.deliveries);
    } catch (e) {
      console.warn('[subscribers] scheduleDeliveries failed', e?.message || e);
    }

    return NextResponse.json({ ok: true, subscription_id: sub.id, user_id: userId, reused: Boolean(existing) });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ── PATCH — edit details / address / password / status ────────────────────
export async function PATCH(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { subscription_id, profile, address, password, status } = await req.json();
  if (!subscription_id) return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, user_id, address_id, status')
    .eq('id', subscription_id)
    .single();
  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  // Profile fields (name / phone) → profiles table
  if (profile && (profile.full_name !== undefined || profile.phone !== undefined)) {
    const up = {};
    if (profile.full_name !== undefined) up.full_name = profile.full_name;
    if (profile.phone !== undefined) up.phone = profile.phone || null;
    const { error } = await admin.from('profiles').update(up).eq('id', sub.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Email change → auth + profiles
  if (profile?.email) {
    const { error: authErr } = await admin.auth.admin.updateUserById(sub.user_id, { email: profile.email });
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
    await admin.from('profiles').update({ email: profile.email }).eq('id', sub.user_id);
  }

  // Password change → auth
  if (password) {
    if (String(password).length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    const { error: pwErr } = await admin.auth.admin.updateUserById(sub.user_id, { password });
    if (pwErr) return NextResponse.json({ error: pwErr.message }, { status: 400 });
  }

  // Address change → addresses table (update default, or create one)
  if (address && (address.line1 || address.pincode)) {
    const fields = {
      full_name: address.full_name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };
    if (sub.address_id) {
      await admin.from('addresses').update(fields).eq('id', sub.address_id);
    } else {
      const { data: newAddr } = await admin.from('addresses').insert({ user_id: sub.user_id, is_default: true, ...fields }).select().single();
      if (newAddr) await admin.from('subscriptions').update({ address_id: newAddr.id }).eq('id', subscription_id);
    }
  }

  // Status change (active / paused / cancelled)
  if (status && ['active', 'paused', 'cancelled'].includes(status)) {
    const up = { status };
    if (status === 'paused' || status === 'cancelled') up.next_delivery_date = null;
    if (status === 'active') up.next_delivery_date = nextSundayIST();
    const { error } = await admin.from('subscriptions').update(up).eq('id', subscription_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ── DELETE — remove subscription, or the whole customer ───────────────────
export async function DELETE(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { subscription_id, delete_user } = await req.json();
  if (!subscription_id) return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from('subscriptions').select('id, user_id').eq('id', subscription_id).single();
  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  if (delete_user) {
    // Cascades through profiles → subscriptions/orders/addresses/deliveries.
    const { error } = await admin.auth.admin.deleteUser(sub.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted_user: true });
  }

  // Just this subscription: detach orders, drop deliveries, then the sub.
  await admin.from('orders').update({ subscription_id: null }).eq('subscription_id', subscription_id);
  await admin.from('deliveries').delete().eq('subscription_id', subscription_id);
  const { error } = await admin.from('subscriptions').delete().eq('id', subscription_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
