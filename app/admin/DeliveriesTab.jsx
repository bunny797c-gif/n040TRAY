'use client';

import { useState, useEffect, useCallback } from 'react';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short',
  });
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

const STATUS = {
  scheduled: { bg: '#f0f7ea', color: '#3a6b28', dot: '#4a7c59', label: 'Upcoming' },
  delivered: { bg: '#e6f4ea', color: '#1a7c3a', dot: '#1a7c3a', label: 'Delivered' },
  skipped:   { bg: '#fff4e6', color: '#c07a00', dot: '#e0a020', label: 'Skipped' },
};

function packLabel(audience) {
  if (audience === 'single') return '4 var · 25g each · 100g box';
  if (audience === 'couple') return '4 var · 50g each · 200g box';
  if (audience === 'family') return '4 var · 100g each · 400g box';
  return '—';
}

export default function DeliveriesTab() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // subscription_id
  const [updating, setUpdating] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch('/api/admin/deliveries');
    const data = await res.json();
    setDeliveries(Array.isArray(data) ? data : []);
    setLastRefresh(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function markStatus(id, status) {
    setUpdating((p) => ({ ...p, [id]: status }));
    await fetch('/api/admin/deliveries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await load(true);
    setUpdating((p) => { const n = { ...p }; delete n[id]; return n; });
  }

  const today = todayStr();

  // Group deliveries by subscription
  const bySubscription = deliveries.reduce((acc, d) => {
    const sid = d.subscription_id;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(d);
    return acc;
  }, {});

  // Build customer card list
  const customers = Object.entries(bySubscription).map(([sid, rows]) => {
    const sample = rows[0];
    const sub = sample?.subscriptions;
    const addr = sub?.addresses;
    const plan = sub?.plans;
    const profile = sub?.profiles;
    const name = addr?.full_name || profile?.full_name || '—';
    const phone = addr?.phone || '—';
    const city = addr?.city || '';
    const pincode = addr?.pincode || '';
    const delivered = rows.filter((r) => r.status === 'delivered').length;
    const total = rows.length;
    const next = rows.filter((r) => r.status === 'scheduled').sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
    return { sid, name, phone, city, pincode, plan, profile, addr, delivered, total, next, rows };
  });

  const selectedData = selected ? customers.find((c) => c.sid === selected) : null;
  const panelRows = selectedData ? [...selectedData.rows].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)) : [];

  // Stats
  const totalScheduled = deliveries.filter((d) => d.status === 'scheduled').length;
  const totalDelivered = deliveries.filter((d) => d.status === 'delivered').length;
  const totalSkipped   = deliveries.filter((d) => d.status === 'skipped').length;

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 1100 }}>

      {/* LEFT: customer list */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Upcoming', value: totalScheduled, color: '#3a6b28', bg: '#f0f7ea' },
            { label: 'Delivered', value: totalDelivered, color: '#1a7c3a', bg: '#e6f4ea' },
            { label: 'Skipped', value: totalSkipped, color: '#c07a00', bg: '#fff4e6' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color, opacity: 0.75 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Refresh line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1a2e1a' }}>
            Subscribers ({customers.length})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastRefresh && <span style={{ fontSize: 11, color: '#aaa' }}>Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
            <button onClick={() => load()} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 14, border: '1.5px solid #ddd', background: '#fff', color: '#555', cursor: 'pointer', fontWeight: 600 }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading…</div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 14, border: '1px solid #eee' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <p style={{ color: '#888' }}>No delivery records yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {customers.map((c) => {
              const isSelected = selected === c.sid;
              const allDone = c.delivered === c.total;
              const progress = Math.round((c.delivered / c.total) * 100);

              return (
                <div
                  key={c.sid}
                  onClick={() => setSelected(isSelected ? null : c.sid)}
                  style={{
                    background: isSelected ? '#f0f7ea' : '#fff',
                    border: `1.5px solid ${isSelected ? '#4a7c59' : '#eee'}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1a2e1a', color: '#c8e6b0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                      {c.name[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#1a2e1a' }}>{c.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#f0f7ea', color: '#3a6b28', padding: '2px 8px', borderRadius: 8, textTransform: 'uppercase' }}>
                          {c.plan?.audience}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        📞 {c.phone} · {[c.city, c.pincode].filter(Boolean).join(', ')}
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{c.plan?.name} · {packLabel(c.plan?.audience)}</div>
                    </div>

                    {/* Right side */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: allDone ? '#1a7c3a' : '#1a2e1a' }}>
                        {c.delivered}/{c.total}
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>delivered</div>
                      {c.next && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7c59', background: '#f0f7ea', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                          Next: {fmtDateShort(c.next.scheduled_date)}
                        </div>
                      )}
                      {allDone && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a7c3a' }}>✅ Complete</div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: 10, height: 4, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: allDone ? '#1a7c3a' : '#4a7c59', borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: delivery detail panel */}
      {selectedData && (
        <div style={{ width: 320, flexShrink: 0, background: '#fff', border: '1.5px solid #e4e4dc', borderRadius: 14, overflow: 'hidden', position: 'sticky', top: 20 }}>
          {/* Panel header */}
          <div style={{ background: '#1a2e1a', padding: '16px 18px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedData.name}</div>
                <div style={{ fontSize: 11, color: '#c8e6b0', marginTop: 2 }}>{selectedData.plan?.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>📞 {selectedData.phone}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>×</button>
            </div>
            {/* Address */}
            {selectedData.addr && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                📍 {[selectedData.addr.line1, selectedData.addr.line2, selectedData.addr.city, selectedData.addr.pincode].filter(Boolean).join(', ')}
              </div>
            )}
            {/* Progress */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                <span>{selectedData.delivered}/{selectedData.total} delivered</span>
                <span>{Math.round((selectedData.delivered / selectedData.total) * 100)}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((selectedData.delivered / selectedData.total) * 100)}%`, background: '#c8e6b0', borderRadius: 4 }} />
              </div>
            </div>
          </div>

          {/* Delivery list */}
          <div style={{ padding: '10px 0', maxHeight: 480, overflowY: 'auto' }}>
            {panelRows.map((d, i) => {
              const st = STATUS[d.status] || STATUS.scheduled;
              const isPast = d.scheduled_date < today;
              const busy = updating[d.id];
              return (
                <div key={d.id} style={{ padding: '11px 16px', borderBottom: i < panelRows.length - 1 ? '1px solid #f5f5f0' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Status dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                    {/* Date + label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isPast && d.status === 'scheduled' ? '#c0392b' : '#1a2e1a' }}>
                        {fmtDate(d.scheduled_date)}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '1px 7px', borderRadius: 6 }}>
                        {st.label}
                        {d.notes ? ` · ${d.notes}` : ''}
                      </span>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                      {d.status !== 'delivered' && (
                        <button
                          onClick={() => markStatus(d.id, 'delivered')}
                          disabled={!!busy}
                          style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, border: '1.5px solid #4a7c59', background: '#fff', color: '#4a7c59', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {busy === 'delivered' ? '…' : '✓ Done'}
                        </button>
                      )}
                      {d.status === 'delivered' && (
                        <button
                          onClick={() => markStatus(d.id, 'scheduled')}
                          disabled={!!busy}
                          style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, border: '1.5px solid #ddd', background: '#fff', color: '#888', cursor: 'pointer' }}
                        >
                          {busy === 'scheduled' ? '…' : 'Undo'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
