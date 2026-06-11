import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';

export async function GET() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('section')
    .order('key');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}

// Upsert one or more content rows: { rows: [{ section, key, value, type }] }
export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows to save' }, { status: 400 });
  }
  for (const r of rows) {
    if (!r.section || !r.key) {
      return NextResponse.json({ error: 'Each row needs section and key' }, { status: 400 });
    }
  }

  const supabase = createClient();
  const payload = rows.map((r) => ({
    section: String(r.section).trim(),
    key: String(r.key).trim(),
    value: r.value ?? '',
    type: ['text', 'image', 'number'].includes(r.type) ? r.type : 'text',
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('site_content')
    .upsert(payload, { onConflict: 'section,key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, saved: payload.length });
}

// Delete a row: { section, key }
export async function DELETE(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { section, key } = await req.json();
  if (!section || !key) return NextResponse.json({ error: 'Missing section/key' }, { status: 400 });

  const supabase = createClient();
  const { error } = await supabase.from('site_content').delete().eq('section', section).eq('key', key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
