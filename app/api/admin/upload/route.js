import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];

// Upload an image to the public site-images bucket. FormData: file
export async function POST(req) {
  const { isAdmin } = await getAdminUser();
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, WebP, SVG or GIF images are allowed.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 5 MB.' }, { status: 400 });
  }

  const ext = (file.name?.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = createClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from('site-images')
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from('site-images').getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
