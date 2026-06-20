'use client';

import { useState, useRef, useCallback } from 'react';
import { inputStyle } from './shared';

// Only the sections the homepage actually reads via t() — view-only/hardcoded
// sections are intentionally excluded.
const SECTION_DEFS = [
  {
    id: 'hero', num: 1, domId: 's-hero', label: 'Hero', icon: '🏠',
    fields: [
      { key: 'label', type: 'text', hint: 'Small label above title (leave blank for №40 logo)' },
      { key: 'title', type: 'text', hint: 'Main heading — use | for line breaks' },
      { key: 'subtitle', type: 'text', hint: 'Paragraph under the heading — use | for line breaks' },
      { key: 'primary_cta', type: 'text', hint: 'Primary (green) button text' },
      { key: 'secondary_cta', type: 'text', hint: 'Secondary (outline) button text' },
      { key: 'image', type: 'image', hint: 'Hero product photo (right side)' },
    ],
    defaults: {
      label: '', title: 'Harvested Today.|On Your Plate|Tomorrow.',
      subtitle: 'Fresh, nutrient-dense microgreens grown with care|and delivered at peak freshness.',
      primary_cta: 'START A SUBSCRIPTION', secondary_cta: 'SHOP MICROGREENS', image: '/images/img-1.jpg',
    },
  },
  {
    id: 'varieties', num: 2, domId: 's-varieties', label: 'Varieties Section', icon: '🌱',
    fields: [
      { key: 'label', type: 'text', hint: 'Small label above title' },
      { key: 'title', type: 'text', hint: 'Section heading' },
      { key: 'subtitle', type: 'text', hint: 'Description below heading' },
    ],
    defaults: {
      label: 'OUR VARIETIES', title: 'Microgreens We Grow',
      subtitle: 'Each variety is grown in a dedicated batch, harvested at peak flavour, and packed the same day.',
    },
  },
  {
    id: 'cta', num: 3, domId: 's-cta', label: 'Final CTA', icon: '📣',
    fields: [
      { key: 'label', type: 'text', hint: 'Small label above title' },
      { key: 'title', type: 'text', hint: 'CTA heading — use | for line breaks' },
      { key: 'subtitle', type: 'text', hint: 'Subtext under the heading' },
    ],
    defaults: {
      label: 'READY TO START?', title: 'Your First Box,|Harvested Tomorrow.',
      subtitle: 'Join 200+ households receiving fresh microgreens every week. No commitment required on your first order.',
    },
  },
];

export default function ContentTab({ initialContent, setMsg }) {
  const [content, setContent] = useState(() => {
    const map = {};
    (initialContent || []).forEach((r) => { map[`${r.section}.${r.key}`] = { value: r.value, type: r.type }; });
    return map;
  });
  const [dirty, setDirty] = useState({});
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(SECTION_DEFS[0]);
  const iframeRef = useRef(null);

  const dirtyCount = Object.keys(dirty).length;

  const scrollToSection = useCallback((domId) => {
    try {
      const el = iframeRef.current?.contentDocument?.getElementById(domId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
  }, []);

  function selectSection(sec) { setSelected(sec); scrollToSection(sec.domId); }

  function setValue(sec, key, value, type) {
    setContent((c) => ({ ...c, [`${sec}.${key}`]: { value, type } }));
    setDirty((d) => ({ ...d, [`${sec}.${key}`]: { section: sec, key, value, type } }));
  }

  async function uploadImage(sec, key, file) {
    if (!file) return;
    setBusy(true); setMsg?.(null);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg?.({ type: 'error', text: data.error || 'Upload failed' });
    setValue(sec, key, data.url, 'image');
    setMsg?.({ type: 'ok', text: 'Image uploaded — click Save changes to apply it.' });
  }

  async function save() {
    const rows = Object.values(dirty);
    if (!rows.length) return;
    setBusy(true); setMsg?.(null);
    const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg?.({ type: 'error', text: data.error || 'Save failed' });
    setDirty({});
    setMsg?.({ type: 'ok', text: `Saved ${data.saved} change${data.saved > 1 ? 's' : ''}. Reloading preview…` });
    try { iframeRef.current?.contentWindow?.location.reload(); } catch {}
  }

  return (
    <div className="admin-content-tab">
      {/* Section chips — editable only */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', marginRight: 6 }}>Editable sections:</span>
        {SECTION_DEFS.map((sec) => {
          const isActive = selected.id === sec.id;
          return (
            <button key={sec.id} onClick={() => selectSection(sec)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, background: isActive ? '#4a7c59' : '#eef5e6', color: isActive ? '#fff' : '#3d5a45' }}>
              <span>{sec.icon}</span><span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      <div className="admin-content-body">
        {/* Live iframe */}
        <div className="admin-content-preview">
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: '#1a2e1a', color: '#c8e6b0', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{selected.icon}</span><span>{selected.label}</span>
            <span style={{ background: '#7ab55c', color: '#fff', fontSize: 9, padding: '1px 6px', borderRadius: 10 }}>EDITABLE</span>
          </div>
          <iframe ref={iframeRef} src="/" onLoad={() => scrollToSection(selected.domId)} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="Site Preview" />
        </div>

        {/* Edit panel */}
        <div className="admin-content-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>{selected.icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a2e1a' }}>{selected.label}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>Edits go live after saving.</p>
            </div>
          </div>

          {selected.fields.map((fld) => {
            const cur = content[`${selected.id}.${fld.key}`];
            const val = cur?.value ?? '';
            const isDirty = Boolean(dirty[`${selected.id}.${fld.key}`]);
            return (
              <div key={fld.key} style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  {fld.key.replace(/_/g, ' ')}
                  {isDirty && <span style={{ background: '#e07b39', color: '#fff', fontSize: 9, padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>UNSAVED</span>}
                </label>
                {fld.hint && <p style={{ margin: '0 0 6px', fontSize: 11, color: '#aaa' }}>{fld.hint}</p>}
                {fld.type === 'image' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input style={inputStyle} value={val} placeholder="Image URL (or upload below)" onChange={(e) => setValue(selected.id, fld.key, e.target.value, 'image')} />
                    {val && <img src={val} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #eee' }} />}
                    <label style={{ background: '#7ab55c', color: '#fff', padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                      📁 UPLOAD IMAGE
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => uploadImage(selected.id, fld.key, e.target.files?.[0])} />
                    </label>
                  </div>
                ) : (fld.key === 'subtitle' || fld.key === 'title') ? (
                  <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={val} placeholder={selected.defaults?.[fld.key] || ''} onChange={(e) => setValue(selected.id, fld.key, e.target.value, fld.type)} />
                ) : (
                  <input style={inputStyle} value={val} placeholder={selected.defaults?.[fld.key] || ''} onChange={(e) => setValue(selected.id, fld.key, e.target.value, fld.type)} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky save bar */}
      {dirtyCount > 0 && (
        <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, background: '#1a2e1a', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <span style={{ color: '#c8e6b0', fontSize: 13 }}>{dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</span>
          <button onClick={save} disabled={busy} style={{ background: '#7ab55c', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{busy ? 'SAVING…' : 'SAVE CHANGES'}</button>
        </div>
      )}
    </div>
  );
}
