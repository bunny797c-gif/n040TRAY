import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/referral — fetch current user's referral code + stats
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: code } = await admin
    .from('referral_codes')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!code) return NextResponse.json({ hasReferral: false });

  // Fetch list of people who used this code
  const { data: rewards } = await admin
    .from('referral_rewards')
    .select('id, coins_referrer, created_at, referee:referee_id(full_name, email)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await admin
    .from('profiles')
    .select('wallet_coins')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    hasReferral: true,
    code: code.code,
    isActive: code.is_active,
    usesCount: code.uses_count,
    maxUses: code.max_uses,
    walletCoins: profile?.wallet_coins || 0,
    rewards: rewards || [],
  });
}
