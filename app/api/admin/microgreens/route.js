import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('microgreens_catalog')
    .select('*')
    .order('home_order')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ varieties: data });
}

// PATCH { id, image_url? show_on_home? home_order? }
export async function PATCH(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const allowed = ['image_url', 'show_on_home', 'home_order', 'out_of_stock'];
  const payload = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(payload).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const supabase = createClient();
  const { error } = await supabase.from('microgreens_catalog').update(payload).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
