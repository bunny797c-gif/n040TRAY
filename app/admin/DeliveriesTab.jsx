'use client';

import { useState, useEffect, useCallback } from 'react';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

const STATUS_STYLE = {
  scheduled:  { bg: '#f0f7ea', color: '#3a6b28', label: 'Scheduled' },
  delivered:  { bg: '#e6f4ea', color: '#1a7c3a', label: '✅ Delivered' },
  skipped:    { bg: '#fff4e6', color: '#c07a00', label: '⏭ Skipped' },
};

function packLabel(audience) {
  if (audience === 'single') return '4 var · 25g each';
  if (audience === 'couple') return '4 var · 50g each';
  if (audience === 'family') return '4 var · 100g each';
  return '—';
}

export default function DeliveriesTab() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // upcoming | past | all
  const [updating, setUpdating] = useState({});
  const [backfilling, setBackfilling] = useState({});
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
    // Real-time: refresh every 30s
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function markStatus(d, status) {
    setUpdating((p) => ({ ...p, [d.id]: status }));
    await fetch('/api/admin/deliveries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, status }),
    });
    await load(true);
    setUpdating((p) => { const n = { ...p }; delete n[d.id]; return n; });
  }

  async function backfill(subId) {
    setBackfilling((p) => ({ ...p, [subId]: true }));
    await fetch('/api/admin/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_id: subId }),
    });
    await load(true);
    setBackfilling((p) => { const n = { ...p }; delete n[subId]; return n; });
  }

  const today = todayStr();

  const filtered = deliveries.filter((d) => {
    if (filter === 'upcoming') return d.scheduled_date >= today && d.status !== 'delivered';
    if (filter === 'past') return d.scheduled_date < today || d.status === 'delivered';
    return true;
  });

  // Group by scheduled_date
  const grouped = filtered.reduce((acc, d) => {
    const key = d.scheduled_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  // Summary stats
  const totalScheduled = deliveries.filter((d) => d.status === 'scheduled').length;
  const totalDelivered = deliveries.filter((d) => d.status === 'delivered').length;
  const totalSkipped   = deliveries.filter((d) => d.status === 'skipped').length;

  // Find subscriptions with 0 scheduled deliveries (need backfill)
  const subsWithDeliveries = new Set(deliveries.map((d) => d.subscription_id));

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Upcoming', value: totalScheduled, bg: '#f0f7ea', color: '#3a6b28' },
          { label: 'Delivered', value: totalDelivered, bg: '#e6f4ea', color: '#1a7c3a' },
          { label: 'Skipped', value: totalSkipped, bg: '#fff4e6', color: '#c07a00' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color, opacity: 0.75, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['upcoming', 'past', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid', fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize', background: filter === f ? '#1a2e1a' : '#fff', color: filter === f ? '#fff' : '#555', borderColor: filter === f ? '#1a2e1a' : '#ddd' }}
          >
            {f}
          </button>
        ))}
        <button onClick={() => load()} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 20, border: '1.5px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555', fontWeight: 600 }}>
          ↻ Refresh
        </button>
        {lastRefresh && (
          <span style={{ fontSize: 11, color: '#aaa' }}>
            Last updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading deliveries…</div>
      ) : sortedDates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <p style={{ color: '#888' }}>No deliveries found for this filter.</p>
        </div>
      ) : (
        sortedDates.map((date) => {
          const rows = grouped[date];
          const isPast = date < today;
          const isToday = date === today;
          const allDone = rows.every((d) => d.status === 'delivered');

          return (
            <div key={date} style={{ marginBottom: 28 }}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: isPast && !allDone ? '#c0392b' : '#1a2e1a' }}>
                  📅 {fmtDate(date)}
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: allDone ? '#e6f4ea' : isPast ? '#fdecea' : isToday ? '#fff4e6' : '#f0f7ea', color: allDone ? '#1a7c3a' : isPast ? '#c0392b' : isToday ? '#c07a00' : '#3a6b28' }}>
                  {allDone ? '✅ All Delivered' : isPast ? '⚠ Past — Pending' : isToday ? 'Today' : 'Upcoming'}
                </span>
                <span style={{ fontSize: 12, color: '#aaa' }}>{rows.length} box{rows.length !== 1 ? 'es' : ''}</span>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
                {rows.map((d, i) => {
                  const sub = d.subscriptions;
                  const addr = sub?.addresses;
                  const plan = sub?.plans;
                  const profile = sub?.profiles;
                  const name = addr?.full_name || profile?.full_name || '—';
                  const phone = addr?.phone || '—';
                  const addrLine = [addr?.line1, addr?.line2].filter(Boolean).join(', ');
                  const style = STATUS_STYLE[d.status] || STATUS_STYLE.scheduled;
                  const busy = updating[d.id];
                  const noSub = !subsWithDeliveries.has(d.subscription_id);

                  return (
                    <div
                      key={d.id}
                      data-label={name}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', background: i % 2 === 0 ? '#fff' : '#fafaf7', borderBottom: i < rows.length - 1 ? '1px solid #f5f5f0' : 'none', flexWrap: 'wrap' }}
                    >
                      {/* Number */}
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0f7ea', color: '#3a6b28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>
                        {i + 1}
                      </div>

                      {/* Customer */}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, color: '#1a2e1a', fontSize: 14 }}>{name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📞 {phone}</div>
                        {addrLine && <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{addrLine}{addr?.pincode ? `, ${addr.pincode}` : ''}</div>}
                        {d.notes && <div style={{ fontSize: 11, color: '#e07b39', marginTop: 2 }}>📝 {d.notes}</div>}
                      </div>

                      {/* Plan badge */}
                      <div style={{ fontSize: 11, fontWeight: 700, background: '#f0f7ea', color: '#3a6b28', padding: '3px 10px', borderRadius: 8, whiteSpace: 'nowrap', alignSelf: 'center' }}>
                        {plan?.audience?.toUpperCase()} · {packLabel(plan?.audience)}
                      </div>

                      {/* Status + actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: style.bg, color: style.color }}>
                          {style.label}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {d.status !== 'delivered' && (
                            <button
                              onClick={() => markStatus(d, 'delivered')}
                              disabled={!!busy}
                              style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8, border: '1.5px solid #4a7c59', background: '#fff', color: '#4a7c59', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              {busy === 'delivered' ? '…' : '✓ Delivered'}
                            </button>
                          )}
                          {d.status === 'scheduled' && (
                            <button
                              onClick={() => markStatus(d, 'skipped')}
                              disabled={!!busy}
                              style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', color: '#888', cursor: 'pointer' }}
                            >
                              {busy === 'skipped' ? '…' : 'Skip'}
                            </button>
                          )}
                          {d.status !== 'scheduled' && (
                            <button
                              onClick={() => markStatus(d, 'scheduled')}
                              disabled={!!busy}
                              style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', color: '#888', cursor: 'pointer' }}
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
          );
        })
      )}
    </div>
  );
}
