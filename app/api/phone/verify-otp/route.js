import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function hashOtp(otp, salt) {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { phone, otp } = await req.json();
  if (!/^[6-9]\d{9}$/.test(String(phone || '')) || !/^\d{6}$/.test(String(otp || ''))) {
    return NextResponse.json({ error: 'Invalid phone or OTP format.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find the most recent unverified OTP for this user+phone
  const { data: pv } = await admin
    .from('phone_verifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('phone', phone)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pv) return NextResponse.json({ error: 'No active OTP found. Request a new one.' }, { status: 404 });
  if (new Date(pv.expires_at) < new Date()) return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
  if (pv.attempts >= 5) return NextResponse.json({ error: 'Too many attempts. Request a new OTP.' }, { status: 429 });

  const salt = process.env.OTP_SALT || 'praahis-default-salt';
  const submittedHash = hashOtp(otp, salt);
  if (submittedHash !== pv.otp_hash) {
    await admin.from('phone_verifications').update({ attempts: pv.attempts + 1 }).eq('id', pv.id);
    return NextResponse.json({ error: 'Incorrect OTP. Try again.' }, { status: 400 });
  }

  // Success — mark verified
  await admin.from('phone_verifications').update({ verified_at: new Date().toISOString() }).eq('id', pv.id);
  await admin
    .from('profiles')
    .update({ phone_verified_at: new Date().toISOString(), verified_phone: phone, phone })
    .eq('id', user.id);

  return NextResponse.json({ ok: true, verified: true });
}
