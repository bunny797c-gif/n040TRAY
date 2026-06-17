-- Referral system: coins-based, admin-controlled

-- 1. Add wallet_coins to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- 2. referral_codes: admin enables per user
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER NOT NULL DEFAULT 100,
  uses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referral_codes_user_unique UNIQUE (user_id)
);

-- 3. referral_rewards: audit trail
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  coins_referrer INTEGER NOT NULL DEFAULT 500,
  coins_referee INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
CREATE POLICY "Users read own referral code" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own rewards
CREATE POLICY "Users read own rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Index for fast code lookup at checkout
CREATE INDEX IF NOT EXISTS referral_codes_code_idx ON referral_codes (code);
CREATE INDEX IF NOT EXISTS referral_codes_user_idx ON referral_codes (user_id);
CREATE INDEX IF NOT EXISTS referral_rewards_referrer_idx ON referral_rewards (referrer_id);
