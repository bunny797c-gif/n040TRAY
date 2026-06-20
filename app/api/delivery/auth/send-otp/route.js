import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOtp } from '@/lib/sms';

function hashOtp(otp, salt) {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!/^[6-9]\d{9}$/.test(String(phone || ''))) {
      return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify this phone belongs to an active delivery partner
    const { data: partner } = await admin
      .from('delivery_partners')
      .select('id, user_id, is_active')
      .eq('phone', phone)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: 'No delivery partner found with this phone number.' }, { status: 404 });
    }
    if (!partner.is_active) {
      return NextResponse.json({ error: 'Your account is deactivated. Contact admin.' }, { status: 403 });
    }

    // Rate limit
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('phone_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', since);
    if ((count || 0) >= 3) {
      return NextResponse.json({ error: 'Too many OTP requests. Try again in 10 minutes.' }, { status: 429 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const salt = process.env.OTP_SALT || 'n040tray-default-salt';
    const otpHash = hashOtp(otp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await admin.from('phone_verifications').insert({
      user_id: partner.user_id,
      phone,
      otp_hash: otpHash,
      expires_at: expiresAt,
    });

    const { provider, dev } = await sendOtp(phone, otp);

    return NextResponse.json({
      ok: true,
      provider,
      devOtp: dev ? otp : undefined,
      expires_in_seconds: 600,
    });
  } catch (e) {
    console.error('delivery send-otp error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
