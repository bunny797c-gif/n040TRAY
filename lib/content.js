import { createClient } from '@/lib/supabase/server';

// Fetch all editable site content as a flat map: { "section.key": value }
// Pages call t(content, 'hero.title', 'fallback') so missing rows never break the site.
export async function getSiteContent() {
  try {
    const supabase = createClient();
    const { data } = await supabase.from('site_content').select('section, key, value');
    const map = {};
    (data || []).forEach((r) => { map[`${r.section}.${r.key}`] = r.value; });
    return map;
  } catch {
    return {};
  }
}

export function t(content, key, fallback) {
  const v = content?.[key];
  return v === undefined || v === null || v === '' ? fallback : v;
}
