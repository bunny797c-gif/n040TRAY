import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const COINS = 500;

// POST /api/referral/reward — called internally after first successful payment
// Body: { refereeId, orderId }
export async function POST(req) {
  const { refereeId, orderId } = await req.json();
  if (!refereeId) return NextResponse.json({ ok: false, error: 'Missing refereeId' });

  const admin = createAdminClient();

  // Get the referral code the referee used
  const { data: profile } = await admin
    .from('profiles')
    .select('referred_by_code, wallet_coins')
    .eq('id', refereeId)
    .single();

  if (!profile?.referred_by_code) return NextResponse.json({ ok: false, reason: 'No referral code on profile' });

  // Prevent double-rewarding
  const { data: existing } = await admin
    .from('referral_rewards')
    .select('id')
    .eq('referee_id', refereeId)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: false, reason: 'Already rewarded' });

  // Find referrer via code
  const { data: codeRow } = await admin
    .from('referral_codes')
    .select('id, user_id, uses_count, is_active')
    .eq('code', profile.referred_by_code)
    .maybeSingle();

  if (!codeRow || !codeRow.is_active) return NextResponse.json({ ok: false, reason: 'Code inactive' });

  const referrerId = codeRow.user_id;

  // Credit referrer coins
  const { data: referrerProfile } = await admin
    .from('profiles').select('wallet_coins').eq('id', referrerId).single();
  await admin.from('profiles')
    .update({ wallet_coins: (referrerProfile?.wallet_coins || 0) + COINS })
    .eq('id', referrerId);

  // Credit referee coins
  await admin.from('profiles')
    .update({ wallet_coins: (profile.wallet_coins || 0) + COINS })
    .eq('id', refereeId);

  // Log reward
  await admin.from('referral_rewards').insert({
    referrer_id: referrerId,
    referee_id: refereeId,
    order_id: orderId || null,
    coins_referrer: COINS,
    coins_referee: COINS,
  });

  // Increment uses_count
  await admin.from('referral_codes')
    .update({ uses_count: codeRow.uses_count + 1 })
    .eq('id', codeRow.id);

  return NextResponse.json({ ok: true, coinsAwarded: COINS });
}
