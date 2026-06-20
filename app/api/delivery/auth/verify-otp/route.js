import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

function hashOtp(otp, salt) {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();
    if (!/^[6-9]\d{9}$/.test(String(phone || '')) || !/^\d{6}$/.test(String(otp || ''))) {
      return NextResponse.json({ error: 'Invalid phone or OTP format.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify partner exists
    const { data: partner } = await admin
      .from('delivery_partners')
      .select('id, user_id, is_active')
      .eq('phone', phone)
      .maybeSingle();

    if (!partner || !partner.is_active) {
      return NextResponse.json({ error: 'Partner not found or inactive.' }, { status: 404 });
    }

    // Find latest unverified OTP
    const { data: pv } = await admin
      .from('phone_verifications')
      .select('*')
      .eq('user_id', partner.user_id)
      .eq('phone', phone)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pv) return NextResponse.json({ error: 'No active OTP found. Request a new one.' }, { status: 404 });
    if (new Date(pv.expires_at) < new Date()) return NextResponse.json({ error: 'OTP expired.' }, { status: 400 });
    if (pv.attempts >= 5) return NextResponse.json({ error: 'Too many attempts. Request a new OTP.' }, { status: 429 });

    const salt = process.env.OTP_SALT || 'n040tray-default-salt';
    if (hashOtp(otp, salt) !== pv.otp_hash) {
      await admin.from('phone_verifications').update({ attempts: pv.attempts + 1 }).eq('id', pv.id);
      return NextResponse.json({ error: 'Incorrect OTP.' }, { status: 400 });
    }

    await admin.from('phone_verifications').update({ verified_at: new Date().toISOString() }).eq('id', pv.id);

    // Get or create the partner's Supabase auth account
    // The partner's email/password is managed by admin — return credentials for signIn
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', partner.user_id)
      .single();

    if (!profile?.email) {
      return NextResponse.json({ error: 'Partner account not configured. Contact admin.' }, { status: 500 });
    }

    // Generate a temporary password and update it so the partner can sign in
    const tempPassword = crypto.randomBytes(24).toString('base64url');
    const { error: authError } = await admin.auth.admin.updateUserById(partner.user_id, {
      password: tempPassword,
    });
    if (authError) {
      return NextResponse.json({ error: 'Auth error. Contact admin.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      email: profile.email,
      password: tempPassword,
    });
  } catch (e) {
    console.error('delivery verify-otp error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
