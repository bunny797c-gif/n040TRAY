'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

// Sections shown in the sidebar, with the editable fields the homepage reads.
// Admins can also add custom keys to any section.
const SECTION_DEFS = [
  {
    id: 'hero',
    label: 'Hero (top of page)',
    fields: [
      { key: 'label', type: 'text', hint: 'Small label above the title' },
      { key: 'title', type: 'text', hint: 'Main heading — use | for line breaks' },
      { key: 'subtitle', type: 'text', hint: 'Paragraph under the heading' },
      { key: 'primary_cta', type: 'text', hint: 'Green button text' },
      { key: 'secondary_cta', type: 'text', hint: 'Outline button text' },
      { key: 'image', type: 'image', hint: 'Hero product image' },
    ],
  },
  {
    id: 'why_choose_us',
    label: 'Why Choose Us',
    fields: [{ key: 'image', type: 'image', hint: 'Full-width infographic' }],
  },
  {
    id: 'our_standards',
    label: 'Our Standards',
    fields: [{ key: 'image', type: 'image', hint: 'Full-width infographic' }],
  },
  {
    id: 'how_it_works',
    label: 'How It Works',
    fields: [{ key: 'image', type: 'image', hint: 'Full-width infographic' }],
  },
  {
    id: 'who_we_serve',
    label: 'Who We Serve',
    fields: [{ key: 'image', type: 'image', hint: 'Full-width infographic' }],
  },
  {
    id: 'varieties',
    label: 'Varieties intro',
    fields: [
      { key: 'label', type: 'text' },
      { key: 'title', type: 'text' },
      { key: 'subtitle', type: 'text' },
    ],
  },
  {
    id: 'cta',
    label: 'Final call-to-action',
    fields: [
      { key: 'label', type: 'text' },
      { key: 'title', type: 'text', hint: 'Use | for line breaks' },
      { key: 'subtitle', type: 'text' },
    ],
  },
  {
    id: 'layout',
    label: 'Layout & sizes',
    fields: [
      { key: 'image_max_width', type: 'number', hint: 'Max width (px) of infographic images, default 1100' },
      { key: 'section_padding', type: 'number', hint: 'Vertical section padding (px), default 100' },
    ],
  },
];

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0d8',
  borderRadius: 10, fontSize: 14, background: '#fff',
};

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

export default function AdminEditor({ initialContent, initialPlans, initialPincodes, adminEmail }) {
  const [tab, setTab] = useState('content');
  const [section, setSection] = useState('hero');
  const [content, setContent] = useState(() => {
    const map = {};
    initialContent.forEach((r) => { map[`${r.section}.${r.key}`] = { value: r.value, type: r.type }; });
    return map;
  });
  const [plans, setPlans] = useState(initialPlans);
  const [pincodes, setPincodes] = useState(initialPincodes);
  const [dirty, setDirty] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [newPin, setNewPin] = useState({ pincode: '', city: '', state: 'Andhra Pradesh' });

  const def = useMemo(() => SECTION_DEFS.find((s) => s.id === section), [section]);

  function setValue(sec, key, value, type) {
    setContent((c) => ({ ...c, [`${sec}.${key}`]: { value, type } }));
    setDirty((d) => ({ ...d, [`${sec}.${key}`]: { section: sec, key, value, type } }));
  }

  async function saveContent() {
    const rows = Object.values(dirty);
    if (!rows.length) return;
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Save failed' });
    setDirty({});
    setMsg({ type: 'ok', text: `Saved ${data.saved} change${data.saved > 1 ? 's' : ''}. Refresh the site to see them.` });
  }

  async function uploadImage(sec, key, file) {
    if (!file) return;
    setBusy(true); setMsg(null);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Upload failed' });
    setValue(sec, key, data.url, 'image');
    setMsg({ type: 'ok', text: 'Image uploaded — click Save changes to apply it.' });
  }

  async function savePlan(plan) {
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Save failed' });
    setMsg({ type: 'ok', text: `Plan "${plan.name}" saved.` });
  }

  async function addPincode() {
    if (!/^\d{6}$/.test(newPin.pincode) || !newPin.city) {
      return setMsg({ type: 'error', text: 'Enter a 6-digit pincode and a city.' });
    }
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/pincodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', ...newPin }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Failed' });
    setPincodes((p) => [...p.filter((x) => x.pincode !== newPin.pincode), data.row].sort((a, b) => a.pincode.localeCompare(b.pincode)));
    setNewPin({ pincode: '', city: '', state: newPin.state });
    setMsg({ type: 'ok', text: 'Pincode added.' });
  }

  async function togglePincode(row) {
    setBusy(true);
    const res = await fetch('/api/admin/pincodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', pincode: row.pincode, is_active: !row.is_active }),
    });
    setBusy(false);
    if (res.ok) {
      setPincodes((p) => p.map((x) => x.pincode === row.pincode ? { ...x, is_active: !row.is_active } : x));
    }
  }

  const dirtyCount = Object.keys(dirty).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4ef', fontFamily: 'inherit' }}>
      {/* Top bar */}
      <div style={{ background: '#3d5a45', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, letterSpacing: 0.5 }}>🌱 SITE ADMIN</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
          <span style={{ opacity: 0.8 }}>{adminEmail}</span>
          <Link href="/" target="_blank" style={{ color: '#c8e6b0', fontWeight: 700 }}>VIEW SITE ↗</Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 24px 0' }}>
        {[['content', 'Page Content'], ['plans', 'Plans & Pricing'], ['pincodes', 'Delivery Areas']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              padding: '10px 18px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: tab === id ? '#fff' : '#e4e4dc', color: tab === id ? '#3d5a45' : '#777',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', margin: '0 24px 24px', borderRadius: '0 12px 12px 12px', padding: 24, minHeight: 500 }}>
        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600,
            background: msg.type === 'error' ? '#fdecea' : '#eef7e8',
            color: msg.type === 'error' ? '#c0392b' : '#3d6b2e',
          }}>{msg.text}</div>
        )}

        {tab === 'content' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
            {/* Section list */}
            <div style={{ borderRight: '1px solid #eee', paddingRight: 16 }}>
              {SECTION_DEFS.map((s) => (
                <button key={s.id} onClick={() => setSection(s.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                    border: 'none', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: section === s.id ? '#eef5e6' : 'transparent',
                    color: section === s.id ? '#3d5a45' : '#555',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{def.label}</h2>
              <p style={{ margin: '0 0 20px', fontSize: 12, color: '#999' }}>
                Leave a field empty to use the site&apos;s built-in default.
              </p>
              {def.fields.map((f) => {
                const cur = content[`${section}.${f.key}`];
                const val = cur?.value ?? '';
                return (
                  <div key={f.key} style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      {f.key.replace(/_/g, ' ')}{f.hint ? <span style={{ fontWeight: 400, textTransform: 'none', color: '#aaa' }}> — {f.hint}</span> : null}
                    </label>
                    {f.type === 'image' ? (
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <input style={inputStyle} value={val} placeholder="Image URL (or upload →)"
                            onChange={(e) => setValue(section, f.key, e.target.value, 'image')} />
                          {val && <img src={val} alt="" style={{ marginTop: 10, maxWidth: 320, maxHeight: 160, borderRadius: 8, border: '1px solid #eee', objectFit: 'contain' }} />}
                        </div>
                        <label style={{ background: '#7ab55c', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          UPLOAD
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={(e) => uploadImage(section, f.key, e.target.files?.[0])} />
                        </label>
                      </div>
                    ) : f.key === 'subtitle' || (val && val.length > 80) ? (
                      <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={val}
                        onChange={(e) => setValue(section, f.key, e.target.value, f.type)} />
                    ) : (
                      <input style={inputStyle} value={val} type={f.type === 'number' ? 'number' : 'text'}
                        onChange={(e) => setValue(section, f.key, e.target.value, f.type)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'plans' && (
          <div>
            <p style={{ fontSize: 13, color: '#888', marginTop: 0 }}>
              These are the live plans shown on the subscription page and used at checkout. Edits apply immediately after saving a row.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#888', textTransform: 'uppercase', fontSize: 11 }}>
                    {['Audience', 'Name', 'Price (₹)', 'Deliveries', 'Serving label', 'Varieties label', 'Save %', 'Tag', 'Active', ''].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', borderBottom: '2px solid #eee' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, textTransform: 'capitalize' }}>{p.audience}</td>
                      {[['name', 130], ['price_inr', 80], ['deliveries', 70], ['serving_label', 180], ['varieties_label', 180], ['savings_pct', 60], ['tag', 100]].map(([k, w]) => (
                        <td key={k} style={{ padding: '6px 4px' }}>
                          <input style={{ ...inputStyle, padding: '7px 8px', width: w }} value={p[k] ?? ''}
                            onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} />
                        </td>
                      ))}
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <input type="checkbox" checked={Boolean(p.is_active)}
                          onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, is_active: e.target.checked } : x))} />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <button onClick={() => savePlan(plans[i])} disabled={busy}
                          style={{ background: '#7ab55c', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          SAVE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'pincodes' && (
          <div style={{ maxWidth: 560 }}>
            <p style={{ fontSize: 13, color: '#888', marginTop: 0 }}>
              Customers can only order if their pincode is active here.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input style={{ ...inputStyle, width: 110 }} placeholder="Pincode" maxLength={6} value={newPin.pincode}
                onChange={(e) => setNewPin((n) => ({ ...n, pincode: e.target.value.replace(/\D/g, '') }))} />
              <input style={{ ...inputStyle, flex: 1 }} placeholder="City" value={newPin.city}
                onChange={(e) => setNewPin((n) => ({ ...n, city: e.target.value }))} />
              <input style={{ ...inputStyle, width: 160 }} placeholder="State" value={newPin.state}
                onChange={(e) => setNewPin((n) => ({ ...n, state: e.target.value }))} />
              <button onClick={addPincode} disabled={busy}
                style={{ background: '#7ab55c', color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                ADD
              </button>
            </div>
            {pincodes.map((row) => (
              <div key={row.pincode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f0f0ea', fontSize: 14 }}>
                <span><strong>{row.pincode}</strong> &nbsp; {row.city}, {row.state}</span>
                <button onClick={() => togglePincode(row)} disabled={busy}
                  style={{
                    border: 'none', borderRadius: 20, padding: '6px 14px', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                    background: row.is_active ? '#eef7e8' : '#fdecea',
                    color: row.is_active ? '#3d6b2e' : '#c0392b',
                  }}>
                  {row.is_active ? 'ACTIVE — click to disable' : 'DISABLED — click to enable'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky save bar for content edits */}
      {tab === 'content' && dirtyCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#3d5a45', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontSize: 13 }}>{dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</span>
          <button onClick={saveContent} disabled={busy}
            style={{ background: '#7ab55c', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {busy ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </div>
      )}
    </div>
  );
}
