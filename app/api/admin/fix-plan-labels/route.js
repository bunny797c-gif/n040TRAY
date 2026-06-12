import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';

export async function GET() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const supabase = createClient();

  await supabase.from('plans').update({ serving_label: '4 varieties · 25g each', varieties_label: 'Curated weekly mix' }).eq('audience', 'single');
  await supabase.from('plans').update({ serving_label: '4 varieties · 50g each', varieties_label: 'Curated weekly mix' }).eq('audience', 'couple');
  await supabase.from('plans').update({ serving_label: '4 varieties · 100g each', varieties_label: 'Curated weekly mix' }).eq('audience', 'family');

  const { data } = await supabase.from('plans').select('name, serving_label, varieties_label').order('price_inr');
  return NextResponse.json({ ok: true, plans: data });
}
