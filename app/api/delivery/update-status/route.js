import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_TRANSITIONS = {
  scheduled: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['delivered', 'failed'],
};

export async function PATCH(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { delivery_id, new_status, failed_reason, notes } = await req.json();
  if (!delivery_id || !new_status) {
    return NextResponse.json({ error: 'Missing delivery_id or new_status' }, { status: 400 });
  }

  // Get partner
  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!partner) return NextResponse.json({ error: 'Not a delivery partner' }, { status: 403 });

  // Get delivery
  const admin = createAdminClient();
  const { data: delivery } = await admin
    .from('deliveries')
    .select('id, status, delivery_partner_id')
    .eq('id', delivery_id)
    .maybeSingle();

  if (!delivery) return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
  if (delivery.delivery_partner_id !== partner.id) {
    return NextResponse.json({ error: 'Not assigned to you' }, { status: 403 });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[delivery.status];
  if (!allowed || !allowed.includes(new_status)) {
    return NextResponse.json({
      error: `Cannot change from "${delivery.status}" to "${new_status}"`,
    }, { status: 400 });
  }

  if (new_status === 'failed' && !failed_reason?.trim()) {
    return NextResponse.json({ error: 'Please provide a reason for failed delivery' }, { status: 400 });
  }

  // Update delivery
  const updates = { status: new_status };
  if (new_status === 'picked_up') updates.picked_up_at = new Date().toISOString();
  if (new_status === 'delivered') updates.delivered_at = new Date().toISOString();
  if (new_status === 'failed') updates.failed_reason = failed_reason.trim();

  const { error: updateError } = await admin
    .from('deliveries')
    .update(updates)
    .eq('id', delivery_id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Log the status change
  await admin.from('delivery_status_log').insert({
    delivery_id,
    old_status: delivery.status,
    new_status,
    changed_by: user.id,
    notes: notes || null,
  });

  return NextResponse.json({ ok: true, new_status });
}
