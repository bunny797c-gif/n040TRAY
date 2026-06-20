import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode');

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ localities: [] });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('serviceable_localities')
    .select('id, name, locality_type')
    .eq('pincode', pincode)
    .eq('is_active', true)
    .order('name');

  if (error) return NextResponse.json({ localities: [] });
  return NextResponse.json({ localities: data || [] });
}
