import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser } from '@/lib/admin';

// GET — list all referral codes with referrer profile info
export async function GET() {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('referral_codes')
    .select('*, referrer:user_id(id, full_name, email, wallet_coins)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — enable referral for a user (generate code)
export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const admin = createAdminClient();

  // Check if already has a code
  const { data: existing } = await admin.from('referral_codes').select('id').eq('user_id', userId).single();
  if (existing) return NextResponse.json({ error: 'User already has a referral code' }, { status: 409 });

  // Generate unique 8-char code
  const code = await generateUniqueCode(admin);

  const { data, error } = await admin.from('referral_codes').insert({
    user_id: userId,
    code,
    is_active: true,
    max_uses: 100,
    uses_count: 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — toggle is_active or update max_uses
export async function PATCH(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { id, is_active, max_uses } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const update = {};
  if (typeof is_active === 'boolean') update.is_active = is_active;
  if (typeof max_uses === 'number') update.max_uses = max_uses;

  const admin = createAdminClient();
  const { error } = await admin.from('referral_codes').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function generateUniqueCode(admin) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = 'TRAY-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const { data } = await admin.from('referral_codes').select('id').eq('code', code).single();
    if (!data) return code;
  }
  throw new Error('Could not generate unique code');
}
