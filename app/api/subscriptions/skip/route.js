import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { istDayOfWeek, addDays } from '@/lib/dates';

function isInLockWindow() {
  const day = istDayOfWeek();
  return day === 0 || day === 6;
}

function fmtDelivery(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });
}

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { subscription_id } = await req.json();
  if (!subscription_id) return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  if (sub.status !== 'active') return NextResponse.json({ error: 'Only active subscriptions can skip a delivery' }, { status: 400 });

  if (isInLockWindow()) {
    return NextResponse.json(
      { error: 'Changes are locked Sat–Sun. Skip must be requested Mon–Fri before Friday midnight.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Find the next scheduled delivery in the deliveries table
  const { data: nextDelivery } = await admin
    .from('deliveries')
    .select('id, scheduled_date')
    .eq('subscription_id', subscription_id)
    .eq('status', 'scheduled')
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextDelivery) {
    // Mark it skipped
    await admin.from('deliveries').update({ status: 'skipped' }).eq('id', nextDelivery.id);

    // Find the last scheduled delivery date to append carry-forward after it
    const { data: lastDelivery } = await admin
      .from('deliveries')
      .select('scheduled_date')
      .eq('subscription_id', subscription_id)
      .in('status', ['scheduled'])
      .order('scheduled_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const appendAfter = lastDelivery?.scheduled_date || nextDelivery.scheduled_date;
    const carryDate = addDays(appendAfter, 7);

    // Add carry-forward delivery at the end
    await admin.from('deliveries').insert({
      subscription_id,
      user_id: user.id,
      scheduled_date: carryDate,
      status: 'scheduled',
      notes: `Carried forward from skipped ${nextDelivery.scheduled_date}`,
    });

    // Update subscription's next_delivery_date to next scheduled slot
    const { data: upcomingDelivery } = await admin
      .from('deliveries')
      .select('scheduled_date')
      .eq('subscription_id', subscription_id)
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    const newDate = upcomingDelivery?.scheduled_date || addDays(sub.next_delivery_date, 7);
    await admin.from('subscriptions').update({ next_delivery_date: newDate }).eq('id', sub.id);

    return NextResponse.json({
      ok: true,
      new_delivery_date: newDate,
      message: `Skipped! Your next delivery is now ${fmtDelivery(newDate)}. Your skipped delivery has been added to the end of your schedule.`,
    });
  }

  // Fallback: no deliveries table entries — just push next_delivery_date
  const newDate = addDays(sub.next_delivery_date, 7);
  await supabase.from('subscriptions').update({ next_delivery_date: newDate }).eq('id', sub.id).eq('user_id', user.id);

  return NextResponse.json({
    ok: true,
    new_delivery_date: newDate,
    message: `Skipped! Your next delivery is now ${fmtDelivery(newDate)}.`,
  });
}
