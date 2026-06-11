import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';

// { action: 'add', pincode, city, state } or { action: 'toggle', pincode, is_active }
export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  const supabase = createClient();

  if (body.action === 'add') {
    const { pincode, city, state } = body;
    if (!/^\d{6}$/.test(String(pincode || ''))) return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 });
    if (!city) return NextResponse.json({ error: 'City is required' }, { status: 400 });
    const { data, error } = await supabase
      .from('serviceable_pincodes')
      .upsert({ pincode, city, state: state || 'Andhra Pradesh', is_active: true }, { onConflict: 'pincode' })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, row: data });
  }

  if (body.action === 'toggle') {
    const { pincode, is_active } = body;
    const { error } = await supabase
      .from('serviceable_pincodes')
      .update({ is_active: Boolean(is_active) })
      .eq('pincode', pincode);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
