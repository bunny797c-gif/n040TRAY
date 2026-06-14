import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Validates the shared shape used by all address mutations.
function validate(body) {
  const errors = [];
  if (!body.full_name?.trim()) errors.push('Name is required');
  if (!/^[6-9]\d{9}$/.test(String(body.phone || ''))) errors.push('Enter a valid 10-digit Indian mobile number');
  if (!body.line1?.trim()) errors.push('Address line 1 is required');
  if (!body.city?.trim()) errors.push('City is required');
  if (!body.state?.trim()) errors.push('State is required');
  if (!/^\d{6}$/.test(String(body.pincode || ''))) errors.push('Pincode must be 6 digits');
  return errors;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addresses: data || [] });
}

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const body = await req.json();
  const errors = validate(body);
  if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 });

  // First address becomes default automatically
  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const makeDefault = body.is_default || count === 0;

  if (makeDefault) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: user.id,
      full_name: body.full_name.trim(),
      phone: String(body.phone),
      line1: body.line1.trim(),
      line2: body.line2?.trim() || null,
      city: body.city.trim(),
      state: body.state.trim(),
      pincode: String(body.pincode),
      is_default: makeDefault,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}

export async function PATCH(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { id, ...body } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Two distinct flows: set-default-only, or full edit
  if (body.set_default === true) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const errors = validate(body);
  if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 });

  const { error } = await supabase
    .from('addresses')
    .update({
      full_name: body.full_name.trim(),
      phone: String(body.phone),
      line1: body.line1.trim(),
      line2: body.line2?.trim() || null,
      city: body.city.trim(),
      state: body.state.trim(),
      pincode: String(body.pincode),
    })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Block deletion if this address is currently used by an active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('address_id', id)
    .in('status', ['active', 'paused', 'pending_payment'])
    .maybeSingle();
  if (sub) {
    return NextResponse.json({ error: 'This address is used by an active subscription. Switch your subscription to a different address first.' }, { status: 400 });
  }

  // Check if it's the default — if so, promote another to default after delete
  const { data: row } = await supabase
    .from('addresses')
    .select('is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (row?.is_default) {
    const { data: remaining } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (remaining) {
      await supabase.from('addresses').update({ is_default: true }).eq('id', remaining.id);
    }
  }

  return NextResponse.json({ ok: true });
}
