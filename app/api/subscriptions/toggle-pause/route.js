import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { istDayOfWeek, nextSundayIST } from '@/lib/dates';

// Lock window: Saturday 00:00 → Monday 00:00 IST (delivery weekend, no changes allowed)
// Buttons are active Mon–Fri (any time before Friday midnight).
function isInLockWindow() {
  const day = istDayOfWeek(); // 0=Sun, 6=Sat (IST)
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

  const { subscription_id, action } = await req.json();
  if (!subscription_id || !['pause', 'resume'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (subError || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  if (action === 'pause' && sub.status !== 'active') {
    return NextResponse.json({ error: 'Only active subscriptions can be paused' }, { status: 400 });
  }
  if (action === 'resume' && sub.status !== 'paused') {
    return NextResponse.json({ error: 'Subscription is not paused' }, { status: 400 });
  }

  // Enforce lock window: no changes Sat–Sun (delivery weekend)
  if (isInLockWindow()) {
    return NextResponse.json(
      { error: "Changes are locked from Friday midnight through Sunday. Please try again on Monday." },
      { status: 400 }
    );
  }

  let newStatus, newNextDelivery, message;

  if (action === 'pause') {
    newStatus = 'paused';
    newNextDelivery = null;
    message = "Subscription paused. Resume any Mon–Fri before Friday midnight to receive deliveries again. No deliveries are lost while paused.";
  } else {
    newStatus = 'active';
    newNextDelivery = nextSundayIST();
    message = `Welcome back! Your next delivery is ${fmtDelivery(newNextDelivery)}.`;
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ status: newStatus, next_delivery_date: newNextDelivery })
    .eq('id', sub.id)
    .eq('user_id', user.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, new_status: newStatus, new_next_delivery: newNextDelivery, message });
}
