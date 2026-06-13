import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { istDayOfWeek } from '@/lib/dates';

// Lock window: Sat–Sun (delivery weekend) — match skip/pause behavior so we
// don't strand admins who've already packed a box.
function isInLockWindow() {
  const day = istDayOfWeek();
  return day === 0 || day === 6;
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

  if (['cancelled', 'expired'].includes(sub.status)) {
    return NextResponse.json({ error: 'This subscription is already inactive.' }, { status: 400 });
  }

  // pending_payment subscriptions can be cancelled any day (no deliveries scheduled yet)
  if (sub.status !== 'pending_payment' && isInLockWindow()) {
    return NextResponse.json(
      { error: 'Cancellation is locked Sat–Sun. Please try again on Monday.' },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', next_delivery_date: null })
    .eq('id', sub.id)
    .eq('user_id', user.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    message: 'Subscription cancelled. No further deliveries will be scheduled. You can subscribe again any time.',
  });
}
