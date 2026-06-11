import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOtp } from '@/lib/sms';

function hashOtp(otp, salt) {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { phone } = await req.json();
  if (!/^[6-9]\d{9}$/.test(String(phone || ''))) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  }

  // Rate limit: max 3 OTPs in 10 minutes per phone
  const admin = createAdminClient();
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('phone_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', since);
  if ((count || 0) >= 3) {
    return NextResponse.json({ error: 'Too many OTP requests. Please try again in 10 minutes.' }, { status: 429 });
  }

  // Generate + hash + store
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const salt = process.env.OTP_SALT || 'n040tray-default-salt';
  const otpHash = hashOtp(otp, salt);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await admin.from('phone_verifications').insert({
    user_id: user.id,
    phone,
    otp_hash: otpHash,
    expires_at: expiresAt,
  });

  // Send
  const { provider, dev } = await sendOtp(phone, otp);

  return NextResponse.json({
    ok: true,
    provider,
    // Only expose the OTP in dev fallback mode so testing works without SMS provider
    devOtp: dev ? otp : undefined,
    expires_in_seconds: 600,
  });
}
