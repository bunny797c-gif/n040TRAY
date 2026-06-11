import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isInLockWindow(now = new Date()) {
  const day = now.getDay(); // 0=Sun, 6=Sat
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

  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (subError || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  if (sub.status !== 'active') return NextResponse.json({ error: 'Only active subscriptions can skip a delivery' }, { status: 400 });
  if (!sub.next_delivery_date) return NextResponse.json({ error: 'No upcoming delivery to skip' }, { status: 400 });

  if (isInLockWindow()) {
    return NextResponse.json(
      { error: 'Changes are locked Sat–Sun. Skip must be requested Mon–Fri before Friday midnight.' },
      { status: 400 }
    );
  }

  // Push delivery by exactly 7 days (next Sunday)
  const nextDelivery = new Date(sub.next_delivery_date + 'T00:00:00');
  nextDelivery.setDate(nextDelivery.getDate() + 7);
  const newDate = nextDelivery.toISOString().slice(0, 10);

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ next_delivery_date: newDate })
    .eq('id', sub.id)
    .eq('user_id', user.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    new_delivery_date: newDate,
    message: `Skipped! Your next delivery is now ${fmtDelivery(newDate)}.`,
  });
}
