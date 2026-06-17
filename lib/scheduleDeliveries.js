import { addDays } from './dates';

/**
 * Creates delivery records in the deliveries table for a newly activated subscription.
 * Idempotent — skips creation if records already exist.
 *
 * @param {object} supabase  — admin client
 * @param {object} sub       — { id, user_id, next_delivery_date }
 * @param {number} count     — number of deliveries to schedule (from plan.deliveries)
 */
export async function scheduleDeliveries(supabase, sub, count) {
  // Don't re-create if already scheduled
  const { count: existing } = await supabase
    .from('deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_id', sub.id);

  if (existing > 0) return;

  const rows = [];
  let date = sub.next_delivery_date;
  for (let i = 0; i < count; i++) {
    rows.push({
      subscription_id: sub.id,
      user_id: sub.user_id,
      scheduled_date: date,
      status: 'scheduled',
    });
    date = addDays(date, 7);
  }

  await supabase.from('deliveries').insert(rows);
}

/**
 * Returns the next scheduled delivery date for a subscription from the deliveries table.
 * Falls back to subscription.next_delivery_date if none found.
 */
export async function getNextDeliveryDate(supabase, subscriptionId, fallback) {
  const { data } = await supabase
    .from('deliveries')
    .select('scheduled_date')
    .eq('subscription_id', subscriptionId)
    .eq('status', 'scheduled')
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.scheduled_date || fallback;
}
