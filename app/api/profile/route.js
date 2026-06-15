import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Only the display name is editable here. Phone changes need re-OTP and go
// through the existing /api/phone/verify-otp flow (intentionally not exposed
// as a free-text patch).
export async function PATCH(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const body = await req.json();
  const name = String(body.full_name || '').trim();
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: 'Name must be between 2 and 80 characters.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: name })
    .eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, full_name: name });
}
