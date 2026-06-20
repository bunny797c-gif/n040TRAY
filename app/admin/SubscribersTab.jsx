'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { inr, fmtDate, inputStyle, StatusBadge, paymentState, todayIST } from './shared';

const AUDIENCES = ['single', 'couple', 'family'];

async function api(method, body) {
  const res = await fetch('/api/admin/subscribers', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, data };
}

// ── Add Subscriber modal ──────────────────────────────────────────────────
function AddSubscriberModal({ plans, onClose, onDone }) {
  const [f, setF] = useState({
    full_name: '', email: '', phone: '', password: '',
    audience: 'single', plan_id: '', amount: '',
    line1: '', line2: '', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const audiencePlans = useMemo(() => plans.filter((p) => p.audience === f.audience), [plans, f.audience]);
  const selectedPlan = plans.find((p) => p.id === f.plan_id);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!f.plan_id) { setErr('Pick a plan.'); return; }
    setBusy(true); setErr(null);
    const { ok, data } = await api('POST', {
      action: 'create',
      full_name: f.full_name, email: f.email, phone: f.phone, password: f.password,
      plan_id: f.plan_id, amount: f.amount || undefined,
      address: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
    });
    setBusy(false);
    if (!ok) { setErr(data.error || 'Could not create subscriber.'); return; }
    onDone(data.reused
      ? 'Existing customer subscribed (cash) ✅'
      : 'Subscriber created — login + subscription + delivery schedule are live ✅');
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal admin-modal--wide">
        <div className="admin-modal-head">
          <h3>➕ Add Subscriber <span style={{ fontWeight: 500, color: '#888', fontSize: 13 }}>· cash / manual</span></h3>
          <button onClick={onClose} className="admin-modal-x">×</button>
        </div>
        <form onSubmit={submit} className="admin-modal-body">
          {err && <div className="admin-form-error">{err}</div>}

          <div className="admin-form-grid">
            <label>Full name *<input style={inputStyle} required value={f.full_name} onChange={(e) => upd('full_name', e.target.value)} placeholder="Customer name" /></label>
            <label>Email *<input style={inputStyle} type="email" required value={f.email} onChange={(e) => upd('email', e.target.value)} placeholder="name@email.com" /></label>
            <label>Phone<input style={inputStyle} maxLength={10} value={f.phone} onChange={(e) => upd('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" /></label>
            <label>Login password<input style={inputStyle} value={f.password} onChange={(e) => upd('password', e.target.value)} placeholder="Blank = auto-generated" /></label>
          </div>

          <div className="admin-form-divider">Plan</div>
          <div className="admin-form-grid">
            <label>Audience
              <select style={inputStyle} value={f.audience} onChange={(e) => { upd('audience', e.target.value); upd('plan_id', ''); }}>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
              </select>
            </label>
            <label>Plan *
              <select style={inputStyle} required value={f.plan_id} onChange={(e) => upd('plan_id', e.target.value)}>
                <option value="">Select a plan…</option>
                {audiencePlans.map((p) => <option key={p.id} value={p.id}>{p.name} — {inr(p.price_inr)} · {p.deliveries} deliveries</option>)}
              </select>
            </label>
            <label>Amount received (₹)<input style={inputStyle} type="number" value={f.amount} onChange={(e) => upd('amount', e.target.value)} placeholder={selectedPlan ? String(selectedPlan.price_inr) : 'Plan price'} /></label>
          </div>

          <div className="admin-form-divider">Delivery address</div>
          <div className="admin-form-grid">
            <label className="admin-form-full">Address line 1 *<input style={inputStyle} required value={f.line1} onChange={(e) => upd('line1', e.target.value)} placeholder="Flat, building, street" /></label>
            <label className="admin-form-full">Address line 2<input style={inputStyle} value={f.line2} onChange={(e) => upd('line2', e.target.value)} placeholder="Landmark, area (optional)" /></label>
            <label>Pincode *<input style={inputStyle} required maxLength={6} value={f.pincode} onChange={(e) => upd('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 digits" /></label>
            <label>City<input style={inputStyle} value={f.city} onChange={(e) => upd('city', e.target.value)} /></label>
            <label>State<input style={inputStyle} value={f.state} onChange={(e) => upd('state', e.target.value)} /></label>
          </div>

          <div className="admin-modal-actions">
            <button type="button" onClick={onClose} className="admin-btn-ghost">Cancel</button>
            <button type="submit" disabled={busy} className="admin-btn-primary">{busy ? 'Creating…' : 'Create subscriber'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Subscriber modal (details + address + status + password) ─────────
function EditSubscriberModal({ sub, onClose, onDone }) {
  const p = sub.profiles || {};
  const a = sub.addresses || {};
  const [f, setF] = useState({
    full_name: p.full_name || '', email: p.email || '', phone: p.phone || '',
    line1: a.line1 || '', line2: a.line2 || '', city: a.city || 'Tirupati', state: a.state || 'Andhra Pradesh', pincode: a.pincode || '',
    status: sub.status, password: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const payload = {
      subscription_id: sub.id,
      profile: { full_name: f.full_name, phone: f.phone },
      address: { full_name: f.full_name, phone: f.phone, line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
      status: f.status !== sub.status ? f.status : undefined,
    };
    if (f.email && f.email !== p.email) payload.profile.email = f.email;
    if (f.password) payload.password = f.password;
    const { ok, data } = await api('PATCH', payload);
    setBusy(false);
    if (!ok) { setErr(data.error || 'Could not save changes.'); return; }
    onDone('Subscriber updated ✅');
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal admin-modal--wide">
        <div className="admin-modal-head">
          <h3>✏️ Edit {p.full_name || 'subscriber'}</h3>
          <button onClick={onClose} className="admin-modal-x">×</button>
        </div>
        <form onSubmit={submit} className="admin-modal-body">
          {err && <div className="admin-form-error">{err}</div>}

          <div className="admin-form-grid">
            <label>Full name<input style={inputStyle} value={f.full_name} onChange={(e) => upd('full_name', e.target.value)} /></label>
            <label>Email<input style={inputStyle} type="email" value={f.email} onChange={(e) => upd('email', e.target.value)} /></label>
            <label>Phone<input style={inputStyle} maxLength={10} value={f.phone} onChange={(e) => upd('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} /></label>
            <label>Status
              <select style={inputStyle} value={f.status} onChange={(e) => upd('status', e.target.value)}>
                {['active', 'paused', 'cancelled', 'pending_payment'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label className="admin-form-full">New password <span style={{ color: '#aaa', fontWeight: 400 }}>(leave blank to keep)</span><input style={inputStyle} value={f.password} onChange={(e) => upd('password', e.target.value)} placeholder="Set a new login password" /></label>
          </div>

          <div className="admin-form-divider">Delivery address</div>
          <div className="admin-form-grid">
            <label className="admin-form-full">Address line 1<input style={inputStyle} value={f.line1} onChange={(e) => upd('line1', e.target.value)} /></label>
            <label className="admin-form-full">Address line 2<input style={inputStyle} value={f.line2} onChange={(e) => upd('line2', e.target.value)} /></label>
            <label>Pincode<input style={inputStyle} maxLength={6} value={f.pincode} onChange={(e) => upd('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
            <label>City<input style={inputStyle} value={f.city} onChange={(e) => upd('city', e.target.value)} /></label>
            <label>State<input style={inputStyle} value={f.state} onChange={(e) => upd('state', e.target.value)} /></label>
          </div>

          <div className="admin-modal-actions">
            <button type="button" onClick={onClose} className="admin-btn-ghost">Cancel</button>
            <button type="submit" disabled={busy} className="admin-btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────
function DeleteModal({ sub, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function run(deleteUser) {
    setBusy(true); setErr(null);
    const { ok, data } = await api('DELETE', { subscription_id: sub.id, delete_user: deleteUser });
    setBusy(false);
    if (!ok) { setErr(data.error || 'Delete failed.'); return; }
    onDone(deleteUser ? 'Customer deleted entirely.' : 'Subscription removed.');
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal">
        <div className="admin-modal-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🗑️</div>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#222' }}>Remove {sub.profiles?.full_name || 'this subscriber'}?</h3>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: '#777', lineHeight: 1.5 }}>
            Choose what to delete. Deleting the customer entirely also removes their login, orders, and addresses.
          </p>
          {err && <div className="admin-form-error">{err}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => run(false)} disabled={busy} className="admin-btn-warn">Delete this subscription only</button>
            <button onClick={() => run(true)} disabled={busy} className="admin-btn-danger">Delete customer entirely</button>
            <button onClick={onClose} disabled={busy} className="admin-btn-ghost">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────
export default function SubscribersTab({ subscriptions, plans, onRefresh, setMsg }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [recording, setRecording] = useState(null); // subscription id being recorded
  const checkedRef = useRef(false);
  const today = todayIST();

  // Auto-pause lapsed subscriptions once per mount.
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    api('POST', { action: 'check_overdue' }).then(({ ok, data }) => {
      if (ok && data.paused > 0) { onRefresh(); setMsg?.({ type: 'ok', text: `${data.paused} overdue subscription${data.paused > 1 ? 's' : ''} auto-paused (payment due).` }); }
    });
  }, [onRefresh, setMsg]);

  const filtered = useMemo(() => subscriptions.filter((s) => {
    const ps = paymentState(s, today);
    const matchStatus =
      filter === 'all' ? true :
      filter === 'payment_due' ? ps === 'payment_due' :
      filter === 'manual' ? s.is_manual : s.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || s.profiles?.email?.toLowerCase().includes(q) || s.profiles?.full_name?.toLowerCase().includes(q) || s.profiles?.phone?.includes(q) || s.plans?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [subscriptions, filter, search, today]);

  const counts = useMemo(() => {
    const c = { all: subscriptions.length, active: 0, paused: 0, payment_due: 0, cancelled: 0, manual: 0 };
    subscriptions.forEach((s) => {
      if (s.is_manual) c.manual++;
      const ps = paymentState(s, today);
      if (ps === 'payment_due') c.payment_due++;
      else if (s.status === 'active') c.active++;
      else if (s.status === 'paused') c.paused++;
      else if (s.status === 'cancelled') c.cancelled++;
    });
    return c;
  }, [subscriptions, today]);

  async function recordPayment(sub) {
    setRecording(sub.id);
    const { ok, data } = await api('POST', { action: 'record_payment', subscription_id: sub.id });
    setRecording(null);
    if (ok) { setMsg?.({ type: 'ok', text: `Payment recorded — paid until ${fmtDate(data.paid_until)}.` }); onRefresh(); }
    else setMsg?.({ type: 'error', text: data.error || 'Could not record payment.' });
  }

  function done(text) {
    setAdding(false); setEditing(null); setDeleting(null);
    setMsg?.({ type: 'ok', text });
    onRefresh();
  }

  const FILTERS = [
    ['all', 'All'], ['active', 'Active'], ['payment_due', 'Payment due'],
    ['paused', 'Paused'], ['cancelled', 'Cancelled'], ['manual', 'Cash / manual'],
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...inputStyle, width: 240, padding: '9px 14px' }} placeholder="Search name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => setAdding(true)} className="admin-btn-primary" style={{ marginLeft: 'auto' }}>+ Add Subscriber</button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: filter === key ? '#4a7c59' : '#f0f0ea', color: filter === key ? '#fff' : '#555' }}>
            {label} <span style={{ opacity: 0.7 }}>{counts[key] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f9f6' }}>
              {['Customer', 'Plan', 'Payment', 'Next Delivery', 'Paid Until', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#bbb', fontSize: 14 }}>No subscribers match this filter.</td></tr>
            ) : filtered.map((s, i) => {
              const ps = paymentState(s, today);
              const due = ps === 'payment_due';
              return (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                  <td data-label="Customer" style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#222', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.profiles?.full_name || '—'}
                      {s.is_manual && <span style={{ fontSize: 9, fontWeight: 800, background: '#fff4e0', color: '#9a6200', padding: '1px 6px', borderRadius: 8 }}>CASH</span>}
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>{s.profiles?.email}</div>
                    {s.profiles?.phone && <div style={{ color: '#aaa', fontSize: 11 }}>📞 {s.profiles.phone}</div>}
                  </td>
                  <td data-label="Plan" style={{ padding: '12px 14px', color: '#444' }}>
                    {s.plans?.name || '—'}
                    <div style={{ fontSize: 11, color: '#aaa', textTransform: 'capitalize' }}>{s.plans?.audience}</div>
                  </td>
                  <td data-label="Payment" style={{ padding: '12px 14px' }}><StatusBadge status={ps} /></td>
                  <td data-label="Next Delivery" style={{ padding: '12px 14px', color: s.status === 'paused' ? '#aaa' : '#444', whiteSpace: 'nowrap' }}>{s.status === 'paused' ? <em>Paused</em> : fmtDate(s.next_delivery_date)}</td>
                  <td data-label="Paid Until" style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: due ? '#b0281e' : '#666', fontWeight: due ? 700 : 400 }}>{fmtDate(s.paid_until)}</td>
                  <td data-label="Actions" style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {(due || s.status === 'paused') && (
                        <button onClick={() => recordPayment(s)} disabled={recording === s.id} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#4a7c59', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {recording === s.id ? '…' : '💵 Record payment'}
                        </button>
                      )}
                      <button onClick={() => setEditing(s)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d0e4c8', background: '#f7fbf3', color: '#4a7c59', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => setDeleting(s)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #f0c8c8', background: '#fff5f5', color: '#c0392b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adding && <AddSubscriberModal plans={plans} onClose={() => setAdding(false)} onDone={done} />}
      {editing && <EditSubscriberModal sub={editing} onClose={() => setEditing(null)} onDone={done} />}
      {deleting && <DeleteModal sub={deleting} onClose={() => setDeleting(null)} onDone={done} />}
    </div>
  );
}
