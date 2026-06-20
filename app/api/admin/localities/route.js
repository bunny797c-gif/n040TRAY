import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';

export async function GET(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode');

  const supabase = createClient();
  let query = supabase.from('serviceable_localities').select('*').order('name');
  if (pincode) query = query.eq('pincode', pincode);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ localities: data });
}

export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  const supabase = createClient();

  if (body.action === 'add') {
    const { pincode, name, locality_type } = body;
    if (!pincode || !name?.trim()) return NextResponse.json({ error: 'Pincode and name are required' }, { status: 400 });
    const { data, error } = await supabase
      .from('serviceable_localities')
      .upsert({ pincode, name: name.trim(), locality_type: locality_type || 'area', is_active: true }, { onConflict: 'pincode,name' })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, locality: data });
  }

  if (body.action === 'toggle') {
    const { id, is_active } = body;
    const { error } = await supabase.from('serviceable_localities').update({ is_active: Boolean(is_active) }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'delete') {
    const { id } = body;
    const { error } = await supabase.from('serviceable_localities').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'bulk_add') {
    const { pincode, names, locality_type } = body;
    if (!pincode || !names?.length) return NextResponse.json({ error: 'Pincode and names are required' }, { status: 400 });
    const rows = names.map((n) => ({ pincode, name: n.trim(), locality_type: locality_type || 'area', is_active: true }));
    const { data, error } = await supabase.from('serviceable_localities').upsert(rows, { onConflict: 'pincode,name' }).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, localities: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
