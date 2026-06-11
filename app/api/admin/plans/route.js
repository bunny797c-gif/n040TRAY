import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';

// Update a plan row: { plan: { id, name, price_inr, deliveries, serving_label, varieties_label, savings_pct, tag, is_active } }
export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { plan } = await req.json();
  if (!plan?.id) return NextResponse.json({ error: 'Missing plan id' }, { status: 400 });

  const price = Number(plan.price_inr);
  const deliveries = Number(plan.deliveries);
  if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
  if (!Number.isInteger(deliveries) || deliveries <= 0) return NextResponse.json({ error: 'Deliveries must be a positive whole number' }, { status: 400 });

  const supabase = createClient();
  const { error } = await supabase
    .from('plans')
    .update({
      name: String(plan.name || '').trim(),
      price_inr: price,
      deliveries,
      serving_label: plan.serving_label ?? null,
      varieties_label: plan.varieties_label ?? null,
      savings_pct: plan.savings_pct === '' || plan.savings_pct === null ? null : Number(plan.savings_pct),
      tag: plan.tag ? String(plan.tag).trim() : null,
      is_active: Boolean(plan.is_active),
    })
    .eq('id', plan.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
