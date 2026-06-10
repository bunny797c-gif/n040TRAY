import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function nextSundayAfter(date) {
  const d = new Date(date);
  const daysUntilSun = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSun);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Lock window: Saturday 00:00 → Monday 00:00 (delivery weekend, no changes allowed)
// Buttons are active Mon–Fri (any time before Friday midnight).
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
  const now = new Date();
  if (isInLockWindow(now)) {
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
    newNextDelivery = nextSundayAfter(now).toISOString().slice(0, 10);
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
