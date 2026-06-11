import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode');

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid 6-digit pincode.' }, { status: 400 });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from('serviceable_pincodes')
    .select('pincode, city, state')
    .eq('pincode', pincode)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({
      ok: false,
      serviceable: false,
      message: "We don't deliver to this area yet — we'll launch here soon!",
    });
  }
  return NextResponse.json({ ok: true, serviceable: true, city: data.city, state: data.state });
}
