'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

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

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const STATUS_COLORS = {
  active:          { bg: '#e8f5e0', color: '#3d6b2e' },
  paused:          { bg: '#e8edf5', color: '#3a5080' },
  pending_payment: { bg: '#fff4e0', color: '#9a6200' },
  cancelled:       { bg: '#fdecea', color: '#b0281e' },
  expired:         { bg: '#f0f0f0', color: '#666' },
  paid:            { bg: '#e8f5e0', color: '#3d6b2e' },
  created:         { bg: '#fff4e0', color: '#9a6200' },
  failed:          { bg: '#fdecea', color: '#b0281e' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f0f0f0', color: '#555' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #e4e4dc',
  borderRadius: 10, fontSize: 14, background: '#fafaf7', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s',
};

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '22px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      borderLeft: `4px solid ${accent}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#1a2e1a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#999' }}>{sub}</div>}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ stats, subscriptions, orders }) {
  const recentOrders = orders.slice(0, 8);
  const upcomingSubs = subscriptions
    .filter((s) => s.status === 'active')
    .slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="Active Subscribers" value={stats.activeSubs} sub="Current paying subscribers" accent="#4a7c59" icon="🌱" />
        <StatCard label="Paused" value={stats.pausedSubs} sub="Will resume when unpaused" accent="#5c7aaa" icon="⏸️" />
        <StatCard label="This Sunday" value={stats.deliveriesThisSunday} sub={`Deliveries on ${fmtDateShort(stats.nextSundayStr)}`} accent="#f0a500" icon="📦" />
        <StatCard label="Total Revenue" value={inr(stats.totalRevenue)} sub="From paid orders" accent="#7ab55c" icon="💰" />
        <StatCard label="Pending Payment" value={stats.pendingPayments} sub="Orders awaiting payment" accent="#e07b39" icon="⏳" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Active subscribers */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#333' }}>Active Subscribers</h3>
          {upcomingSubs.length === 0
            ? <p style={{ color: '#aaa', fontSize: 13 }}>No active subscribers yet.</p>
            : upcomingSubs.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f0', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#222' }}>{s.profiles?.full_name || s.profiles?.email?.split('@')[0] || '—'}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{s.plans?.name} · {s.plans?.audience}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#888' }}>Next: {fmtDateShort(s.next_delivery_date)}</div>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Recent orders */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#333' }}>Recent Orders</h3>
          {recentOrders.length === 0
            ? <p style={{ color: '#aaa', fontSize: 13 }}>No orders yet.</p>
            : recentOrders.map((o) => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f0', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#222' }}>{inr(o.amount_inr)}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{fmtDate(o.created_at)}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── Subscribers Tab ───────────────────────────────────────────────────────
function SubscribersTab({ subscriptions }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchStatus = filter === 'all' || s.status === filter;
      const q = search.toLowerCase();
      const matchSearch = !q
        || s.profiles?.email?.toLowerCase().includes(q)
        || s.profiles?.full_name?.toLowerCase().includes(q)
        || s.plans?.name?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [subscriptions, filter, search]);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, width: 240, padding: '9px 14px' }}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {['all', 'active', 'paused', 'pending_payment', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: filter === s ? '#4a7c59' : '#f0f0ea',
              color: filter === s ? '#fff' : '#555',
            }}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#999' }}>{filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f9f6' }}>
              {['Customer', 'Plan', 'Audience', 'Status', 'Variety', 'Next Delivery', 'Started', 'Price'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#bbb', fontSize: 14 }}>No subscribers match this filter.</td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#222' }}>{s.profiles?.full_name || '—'}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{s.profiles?.email}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#444' }}>{s.plans?.name || '—'}</td>
                <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: '#666' }}>{s.plans?.audience || '—'}</td>
                <td style={{ padding: '12px 14px' }}><StatusBadge status={s.status} /></td>
                <td style={{ padding: '12px 14px', color: '#666', fontSize: 12 }}>
                  <div style={{ textTransform: 'capitalize' }}>{s.variety_type?.replace(/_/g, ' ') || '—'}</div>
                  {s.variety_choices?.length > 0 && (
                    <div style={{ color: '#aaa' }}>{s.variety_choices.join(', ')}</div>
                  )}
                </td>
                <td style={{ padding: '12px 14px', color: s.status === 'paused' ? '#aaa' : '#444', whiteSpace: 'nowrap' }}>
                  {s.status === 'paused' ? <em>Paused</em> : fmtDate(s.next_delivery_date)}
                </td>
                <td style={{ padding: '12px 14px', color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(s.start_date)}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#4a7c59' }}>{inr(s.plans?.price_inr || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────
function OrdersTab({ orders }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    return filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const totalPaid = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + Number(o.amount_inr || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'paid', 'created', 'failed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: filter === s ? '#4a7c59' : '#f0f0ea',
              color: filter === s ? '#fff' : '#555',
            }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#999' }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Total paid: <strong style={{ color: '#4a7c59' }}>{inr(totalPaid)}</strong>
        </span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f9f6' }}>
              {['Date', 'Amount', 'Status', 'Razorpay Order ID', 'Razorpay Payment ID', 'Paid At'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#bbb', fontSize: 14 }}>No orders.</td></tr>
            ) : filtered.map((o, i) => (
              <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#666' }}>{fmtDate(o.created_at)}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#222' }}>{inr(o.amount_inr)}</td>
                <td style={{ padding: '12px 14px' }}><StatusBadge status={o.status} /></td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{o.razorpay_order_id || '—'}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{o.razorpay_payment_id || '—'}</td>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#888' }}>{o.paid_at ? fmtDate(o.paid_at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Content Tab ───────────────────────────────────────────────────────────
function ContentTab({ content, setContent, dirty, setDirty, busy, setBusy, setMsg }) {
  const [section, setSection] = useState('hero');
  const def = useMemo(() => SECTION_DEFS.find((s) => s.id === section), [section]);

  function setValue(sec, key, value, type) {
    setContent((c) => ({ ...c, [`${sec}.${key}`]: { value, type } }));
    setDirty((d) => ({ ...d, [`${sec}.${key}`]: { section: sec, key, value, type } }));
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
      {/* Section list */}
      <div style={{ borderRight: '1px solid #f0f0ea', paddingRight: 16 }}>
        {SECTION_DEFS.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
              border: 'none', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: section === s.id ? '#eef5e6' : 'transparent',
              color: section === s.id ? '#3d5a45' : '#666',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 17, color: '#222' }}>{def.label}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: '#aaa' }}>
          Leave a field empty to use the site&apos;s built-in default.
        </p>
        {def.fields.map((f) => {
          const cur = content[`${section}.${f.key}`];
          const val = cur?.value ?? '';
          return (
            <div key={f.key} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                {f.key.replace(/_/g, ' ')}
                {f.hint && <span style={{ fontWeight: 400, textTransform: 'none', color: '#bbb', letterSpacing: 0 }}> — {f.hint}</span>}
              </label>
              {f.type === 'image' ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input style={inputStyle} value={val} placeholder="Image URL (or upload →)"
                      onChange={(e) => setValue(section, f.key, e.target.value, 'image')} />
                    {val && <img src={val} alt="" style={{ marginTop: 10, maxWidth: 300, maxHeight: 150, borderRadius: 8, border: '1px solid #eee', objectFit: 'contain' }} />}
                  </div>
                  <label style={{ background: '#7ab55c', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
  );
}

// ── Plans Tab ─────────────────────────────────────────────────────────────
function PlansTab({ plans, setPlans, busy, setBusy, setMsg }) {
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

  const grouped = useMemo(() => {
    const g = { single: [], couple: [], family: [] };
    plans.forEach((p) => { if (g[p.audience]) g[p.audience].push(p); });
    return g;
  }, [plans]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#999' }}>
        Live plans shown on the subscription page. Edits apply immediately after saving each row.
      </p>
      {Object.entries(grouped).map(([audience, audiencePlans]) => (
        <div key={audience}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#4a7c59' }}>
            {audience === 'single' ? '🧍 Single' : audience === 'couple' ? '👫 Couple' : '👨‍👩‍👧 Family'}
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9f9f6' }}>
                  {['Name', 'Price (₹)', 'Deliveries', 'Serving label', 'Varieties label', 'Save %', 'Tag', 'Active', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audiencePlans.map((p) => {
                  const i = plans.findIndex((x) => x.id === p.id);
                  return (
                    <tr key={p.id}>
                      {[['name', 140], ['price_inr', 80], ['deliveries', 70], ['serving_label', 170], ['varieties_label', 170], ['savings_pct', 55], ['tag', 90]].map(([k, w]) => (
                        <td key={k} style={{ padding: '8px 6px' }}>
                          <input style={{ ...inputStyle, padding: '8px 10px', width: w }}
                            value={plans[i]?.[k] ?? ''}
                            onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} />
                        </td>
                      ))}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input type="checkbox" checked={Boolean(plans[i]?.is_active)}
                          onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, is_active: e.target.checked } : x))} />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <button onClick={() => savePlan(plans[i])} disabled={busy}
                          style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          SAVE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pincodes Tab ──────────────────────────────────────────────────────────
function PincodesTab({ pincodes, setPincodes, busy, setBusy, setMsg }) {
  const [newPin, setNewPin] = useState({ pincode: '', city: '', state: 'Andhra Pradesh' });

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
    if (res.ok) setPincodes((p) => p.map((x) => x.pincode === row.pincode ? { ...x, is_active: !row.is_active } : x));
  }

  const active = pincodes.filter((p) => p.is_active);
  const inactive = pincodes.filter((p) => !p.is_active);

  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#999' }}>
        Customers can only order if their pincode is active here. {active.length} active · {inactive.length} disabled.
      </p>

      {/* Add form */}
      <div style={{ background: '#f9f9f6', borderRadius: 14, padding: 18, marginBottom: 24, border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Add Pincode</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...inputStyle, width: 110 }} placeholder="Pincode" maxLength={6} value={newPin.pincode}
            onChange={(e) => setNewPin((n) => ({ ...n, pincode: e.target.value.replace(/\D/g, '') }))} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="City" value={newPin.city}
            onChange={(e) => setNewPin((n) => ({ ...n, city: e.target.value }))} />
          <input style={{ ...inputStyle, width: 160 }} placeholder="State" value={newPin.state}
            onChange={(e) => setNewPin((n) => ({ ...n, state: e.target.value }))} />
          <button onClick={addPincode} disabled={busy}
            style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ADD
          </button>
        </div>
      </div>

      {/* Pincode list */}
      <div style={{ borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
        {pincodes.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 13 }}>No pincodes yet.</p>
        )}
        {pincodes.map((row, i) => (
          <div key={row.pincode} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 16px', fontSize: 14,
            background: i % 2 === 0 ? '#fff' : '#fafaf7',
            borderBottom: i < pincodes.length - 1 ? '1px solid #f0f0ea' : 'none',
          }}>
            <span>
              <strong style={{ fontFamily: 'monospace', fontSize: 15 }}>{row.pincode}</strong>
              <span style={{ color: '#888', marginLeft: 12 }}>{row.city}, {row.state}</span>
            </span>
            <button onClick={() => togglePincode(row)} disabled={busy}
              style={{
                border: 'none', borderRadius: 20, padding: '6px 14px', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                background: row.is_active ? '#e8f5e0' : '#fdecea',
                color: row.is_active ? '#3d6b2e' : '#b0281e',
              }}>
              {row.is_active ? '✓ Active' : '✗ Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Admin Editor ─────────────────────────────────────────────────────
export default function AdminEditor({
  initialContent, initialPlans, initialPincodes,
  initialSubscriptions, initialOrders, stats, adminEmail,
}) {
  const [tab, setTab] = useState('overview');
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

  const dirtyCount = Object.keys(dirty).length;

  const TABS = [
    { id: 'overview',   label: 'Overview',        icon: '📊' },
    { id: 'subscribers',label: 'Subscribers',     icon: '🌱' },
    { id: 'orders',     label: 'Orders',           icon: '💳' },
    { id: 'content',    label: 'Page Content',     icon: '✏️' },
    { id: 'plans',      label: 'Plans & Pricing',  icon: '📋' },
    { id: 'pincodes',   label: 'Delivery Areas',   icon: '📍' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2ed', fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ background: '#1a2e1a', color: '#fff', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🌱</span>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>№40 TRAY — Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: '#7ab55c', fontWeight: 500 }}>{adminEmail}</span>
          <Link href="/" target="_blank" style={{ color: '#c8e6b0', fontWeight: 700, textDecoration: 'none', fontSize: 12 }}>VIEW SITE ↗</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar nav */}
        <aside style={{ width: 210, background: '#fff', borderRight: '1px solid #eee', padding: '20px 12px', flexShrink: 0 }}>
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => { setTab(id); setMsg(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', textAlign: 'left', padding: '11px 14px',
                border: 'none', borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                fontSize: 13, fontWeight: tab === id ? 700 : 500,
                background: tab === id ? '#eef5e6' : 'transparent',
                color: tab === id ? '#3d5a45' : '#666',
                transition: 'background 0.15s',
              }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
              {id === 'content' && dirtyCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#e07b39', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>{dirtyCount}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>
              {TABS.find((t) => t.id === tab)?.icon} {TABS.find((t) => t.id === tab)?.label}
            </h1>
          </div>

          {/* Flash message */}
          {msg && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600,
              background: msg.type === 'error' ? '#fdecea' : '#eef7e8',
              color: msg.type === 'error' ? '#b0281e' : '#3d6b2e',
              border: `1px solid ${msg.type === 'error' ? '#f5c6c3' : '#c3e6b0'}`,
            }}>
              {msg.text}
            </div>
          )}

          {tab === 'overview' && (
            <OverviewTab stats={stats} subscriptions={initialSubscriptions} orders={initialOrders} />
          )}
          {tab === 'subscribers' && (
            <SubscribersTab subscriptions={initialSubscriptions} />
          )}
          {tab === 'orders' && (
            <OrdersTab orders={initialOrders} />
          )}
          {tab === 'content' && (
            <ContentTab
              content={content} setContent={setContent}
              dirty={dirty} setDirty={setDirty}
              busy={busy} setBusy={setBusy} setMsg={setMsg}
            />
          )}
          {tab === 'plans' && (
            <PlansTab plans={plans} setPlans={setPlans} busy={busy} setBusy={setBusy} setMsg={setMsg} />
          )}
          {tab === 'pincodes' && (
            <PincodesTab pincodes={pincodes} setPincodes={setPincodes} busy={busy} setBusy={setBusy} setMsg={setMsg} />
          )}
        </main>
      </div>

      {/* Sticky save bar — content tab only */}
      {tab === 'content' && dirtyCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a2e1a', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <span style={{ color: '#c8e6b0', fontSize: 13 }}>{dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</span>
          <button onClick={saveContent} disabled={busy}
            style={{ background: '#7ab55c', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {busy ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </div>
      )}
    </div>
  );
}
