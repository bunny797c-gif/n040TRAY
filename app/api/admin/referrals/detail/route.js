import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser } from '@/lib/admin';

// GET /api/admin/referrals/detail?referrerId=xxx — list who joined via this referrer
export async function GET(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const referrerId = searchParams.get('referrerId');
  if (!referrerId) return NextResponse.json({ error: 'Missing referrerId' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('referral_rewards')
    .select('id, coins_referee, created_at, referee:referee_id(full_name, email), order:order_id(status, amount_inr)')
    .eq('referrer_id', referrerId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
