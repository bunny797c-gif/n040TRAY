import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/referral/validate — check if a code is valid at checkout
export async function POST(req) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' });

  const admin = createAdminClient();
  const { data } = await admin
    .from('referral_codes')
    .select('id, user_id, is_active, uses_count, max_uses')
    .eq('code', code.toUpperCase().trim())
    .single();

  if (!data) return NextResponse.json({ valid: false, error: 'Code not found' });
  if (!data.is_active) return NextResponse.json({ valid: false, error: 'Code is no longer active' });
  if (data.uses_count >= data.max_uses) return NextResponse.json({ valid: false, error: 'Code has reached its limit' });

  return NextResponse.json({ valid: true, referrerId: data.user_id });
}
