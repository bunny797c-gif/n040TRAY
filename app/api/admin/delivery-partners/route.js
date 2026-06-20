import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser } from '@/lib/admin';

export async function GET() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('delivery_partners')
    .select('*, user:profiles(email, full_name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partners: data || [] });
}

export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  const { email, full_name, phone, vehicle_type, assigned_areas } = body;

  if (!email || !full_name || !phone) {
    return NextResponse.json({ error: 'Email, name, and phone are required' }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(String(phone))) {
    return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Create Supabase auth user for the partner
  const tempPassword = `tray-partner-${Date.now()}`;
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authError) {
    if (authError.message?.includes('already been registered')) {
      // User exists — look them up
      const { data: { users } } = await admin.auth.admin.listUsers();
      const existing = users?.find(u => u.email === email);
      if (!existing) return NextResponse.json({ error: 'User exists but could not be found' }, { status: 500 });

      // Update their profile role and create partner record
      await admin.from('profiles').update({ role: 'delivery_partner', full_name, phone }).eq('id', existing.id);

      const { data: partner, error: pErr } = await admin
        .from('delivery_partners')
        .insert({
          user_id: existing.id,
          phone,
          full_name,
          vehicle_type: vehicle_type || 'bike',
          assigned_areas: assigned_areas || [],
        })
        .select()
        .single();
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, partner });
    }
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Update profile with role
  await admin.from('profiles').update({
    role: 'delivery_partner',
    full_name,
    phone,
  }).eq('id', authUser.user.id);

  // Create partner record
  const { data: partner, error: pErr } = await admin
    .from('delivery_partners')
    .insert({
      user_id: authUser.user.id,
      phone,
      full_name,
      vehicle_type: vehicle_type || 'bike',
      assigned_areas: assigned_areas || [],
    })
    .select()
    .single();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, partner });
}

export async function PATCH(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const allowed = ['is_active', 'vehicle_type', 'assigned_areas', 'full_name', 'phone'];
  const payload = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  payload.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { error } = await admin.from('delivery_partners').update(payload).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
