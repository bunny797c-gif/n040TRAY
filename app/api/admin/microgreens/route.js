import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('microgreens_catalog')
    .insert({
      name: body.name.trim(),
      family: body.family || null,
      taste: body.taste || null,
      description: body.description || null,
      benefits: body.benefits || null,
      grow_time: body.grow_time || null,
      daily_intake: body.daily_intake || null,
      tag: body.tag || null,
      price_100g: body.price_100g || 249,
      price_200g: body.price_200g || 449,
      price_500g: body.price_500g || 999,
      show_on_home: false,
      out_of_stock: false,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, variety: data });
}

export async function PATCH(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const allowed = [
    'image_url', 'show_on_home', 'home_order', 'out_of_stock',
    'name', 'family', 'taste', 'description', 'benefits',
    'grow_time', 'daily_intake', 'tag', 'tag_class',
    'price_100g', 'price_200g', 'price_500g',
  ];
  const payload = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(payload).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('microgreens_catalog').update(payload).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
