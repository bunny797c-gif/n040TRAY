'use client';

import { useState, useEffect } from 'react';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReferralsTab() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // referrer being drilled into
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Customer search for enabling referral
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [enabling, setEnabling] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/referrals');
    const data = await res.json();
    setReferrals(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function openDetail(r) {
    setSelected(r);
    setDetail(null);
    setDetailLoading(true);
    const res = await fetch(`/api/admin/referrals/detail?referrerId=${r.user_id}`);
    const data = await res.json();
    setDetail(Array.isArray(data) ? data : []);
    setDetailLoading(false);
  }

  async function toggleActive(r) {
    const next = !r.is_active;
    setReferrals((prev) => prev.map((x) => x.id === r.id ? { ...x, is_active: next } : x));
    const res = await fetch('/api/admin/referrals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, is_active: next }),
    });
    if (!res.ok) {
      setReferrals((prev) => prev.map((x) => x.id === r.id ? { ...x, is_active: r.is_active } : x));
      setMsg('Failed to update');
    }
  }

  async function searchCustomers(q) {
    setCustomerSearch(q);
    if (q.length < 2) { setCustomers([]); return; }
    setCustomerLoading(true);
    const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
    setCustomerLoading(false);
  }

  async function enableReferral(userId) {
    setEnabling(userId);
    const res = await fetch('/api/admin/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg('Referral code enabled!');
      setCustomerSearch('');
      setCustomers([]);
      load();
    } else {
      setMsg(data.error || 'Failed');
    }
    setEnabling(null);
    setTimeout(() => setMsg(null), 3000);
  }

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase();
    return !q ||
      r.referrer?.full_name?.toLowerCase().includes(q) ||
      r.referrer?.email?.toLowerCase().includes(q) ||
      r.code?.toLowerCase().includes(q);
  });

  // Already-enabled user IDs for quick lookup
  const enabledIds = new Set(referrals.map((r) => r.user_id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {msg && (
        <div style={{ background: '#e8f5e0', border: '1px solid #b2d8a0', borderRadius: 10, padding: '10px 16px', color: '#2d5a1b', fontSize: 13, fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* Enable referral for a customer */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #e4e4dc' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1a2e1a' }}>Enable Referral for a Customer</h3>
        <div style={{ position: 'relative', maxWidth: 420 }}>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={customerSearch}
            onChange={(e) => searchCustomers(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e4e4dc', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          {customerLoading && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#999' }}>…</div>
          )}
        </div>
        {customers.length > 0 && (
          <div style={{ marginTop: 8, border: '1px solid #e4e4dc', borderRadius: 10, overflow: 'hidden', maxWidth: 420 }}>
            {customers.map((c) => {
              const already = enabledIds.has(c.id);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f0f0e8', background: '#fafaf7' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e1a' }}>{c.full_name || '—'}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{c.email}</div>
                  </div>
                  {already ? (
                    <span style={{ fontSize: 11, color: '#7ab55c', fontWeight: 700 }}>Already enabled</span>
                  ) : (
                    <button
                      onClick={() => enableReferral(c.id)}
                      disabled={enabling === c.id}
                      style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: enabling === c.id ? 0.6 : 1 }}
                    >
                      {enabling === c.id ? '…' : 'Enable'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active referrers list */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #e4e4dc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1a2e1a' }}>
            Referral Codes <span style={{ background: '#e8f5e0', color: '#3d6b2e', borderRadius: 20, fontSize: 12, padding: '2px 10px', marginLeft: 6 }}>{referrals.length}</span>
          </h3>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 14px', border: '1.5px solid #e4e4dc', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 200 }}
          />
        </div>

        {loading ? (
          <div style={{ color: '#999', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#999', fontSize: 14 }}>No referral codes yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0e8' }}>
                  {['Customer', 'Code', 'Uses', 'Coins Issued', 'Wallet Coins', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f0' }}>
                    <td data-label="Customer" style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: '#1a2e1a' }}>{r.referrer?.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{r.referrer?.email}</div>
                    </td>
                    <td data-label="Code" style={{ padding: '10px 12px' }}>
                      <code style={{ background: '#f0f7ea', color: '#3d6b2e', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{r.code}</code>
                    </td>
                    <td data-label="Uses" style={{ padding: '10px 12px', fontWeight: 700, color: '#333' }}>{r.uses_count} / {r.max_uses}</td>
                    <td data-label="Coins Issued" style={{ padding: '10px 12px', color: '#e07b39', fontWeight: 700 }}>🪙 {r.uses_count * 500}</td>
                    <td data-label="Wallet Coins" style={{ padding: '10px 12px', color: '#3d6b2e', fontWeight: 700 }}>🪙 {r.referrer?.wallet_coins || 0}</td>
                    <td data-label="Status" style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => toggleActive(r)}
                        style={{
                          background: r.is_active ? '#e8f5e0' : '#fdecea',
                          color: r.is_active ? '#3d6b2e' : '#b0281e',
                          border: 'none', borderRadius: 20, padding: '4px 12px',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          textTransform: 'uppercase', letterSpacing: 0.4,
                        }}
                      >
                        {r.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => openDetail(r)}
                        style={{ background: '#1a2e1a', color: '#c8e6b0', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        View Referees
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 28, width: '100%', maxWidth: 640, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a2e1a' }}>
                  Referees — {selected.referrer?.full_name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>Code: <strong>{selected.code}</strong> · {selected.uses_count} joined</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>×</button>
            </div>

            {detailLoading ? (
              <div style={{ color: '#999', fontSize: 14 }}>Loading…</div>
            ) : !detail || detail.length === 0 ? (
              <div style={{ color: '#999', fontSize: 14 }}>No one has used this code yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0e8' }}>
                    {['Customer', 'Joined', 'Order Status', 'Coins Given'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f5f5f0' }}>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ fontWeight: 700 }}>{d.referee?.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{d.referee?.email}</div>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#555' }}>{fmtDate(d.created_at)}</td>
                      <td style={{ padding: '10px 10px' }}>
                        {d.order ? (
                          <span style={{
                            background: d.order.status === 'paid' ? '#e8f5e0' : '#fff4e0',
                            color: d.order.status === 'paid' ? '#3d6b2e' : '#9a6200',
                            padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700
                          }}>
                            {d.order.status}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#e07b39', fontWeight: 700 }}>🪙 {d.coins_referee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
