'use client';

import { useState, useMemo } from 'react';
import { inr, fmtDate, fmtDateShort, StatusBadge, packBadge, paymentState, todayIST, nextSundayStr } from './shared';

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderLeft: `4px solid ${accent}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#1a2e1a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#999' }}>{sub}</div>}
    </div>
  );
}

const deliveryBtn = { fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 7, border: '1.5px solid #4a7c59', background: '#fff', color: '#4a7c59', cursor: 'pointer', whiteSpace: 'nowrap' };

// ── Panel 1: This Sunday ──────────────────────────────────────────────────
function ThisSundayPanel({ rows, sundayLabel, onDeliver, busyIds }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4a7c59' }}>📦 {sundayLabel}</div>
        <span style={{ background: '#1a2e1a', color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 14 }}>{rows.length} <span style={{ fontSize: 11, opacity: 0.7 }}>boxes</span></span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '28px 16px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>📭 No deliveries scheduled for this Sunday.</div>
      ) : rows.map((d, i) => {
        const sub = d.subscriptions; const addr = sub?.addresses; const plan = sub?.plans;
        const name = addr?.full_name || sub?.profiles?.full_name || '—';
        const { bg, color } = packBadge(plan?.audience);
        const done = d.status === 'delivered';
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', borderBottom: i < rows.length - 1 ? '1px solid #f0f0ea' : 'none', flexWrap: 'wrap' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: bg, color, fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2e1a' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#888' }}>📞 {addr?.phone || '—'}{addr?.city ? ` · ${addr.city}` : ''}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, background: bg, color, padding: '3px 9px', borderRadius: 8, textTransform: 'uppercase' }}>{plan?.audience}</span>
            {done
              ? <span style={{ fontSize: 11, fontWeight: 700, color: '#1a7c3a' }}>✅ Delivered</span>
              : <button onClick={() => onDeliver(d.id)} disabled={busyIds[d.id]} style={deliveryBtn}>{busyIds[d.id] ? '…' : '✓ Delivered'}</button>}
          </div>
        );
      })}
    </div>
  );
}

// ── Panel 2: Recent Orders (with order pipeline controls) ─────────────────
const NEXT_STEP = {
  paid: { status: 'packed', label: '📦 Packed' },
  packed: { status: 'out_for_delivery', label: '🛵 Out' },
  out_for_delivery: { status: 'delivered', label: '✅ Delivered' },
};

// Payment outcome derived from order status — so the admin can tell at a glance
// whether money was actually collected.
function paymentInfo(status) {
  if (status === 'cancelled' || status === 'failed') return { label: 'Cancelled', bg: '#fdecea', color: '#b0281e', icon: '✕' };
  if (status === 'created') return { label: 'Pending', bg: '#fff4e0', color: '#9a6200', icon: '⏳' };
  return { label: 'Paid', bg: '#e8f5e0', color: '#3d6b2e', icon: '💰' };
}

function RecentOrdersPanel({ orders, onAction, busyIds }) {
  if (orders.length === 0) return <div style={{ padding: '24px 16px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>No completed orders yet.</div>;
  return (
    <div>
      {orders.map((o, i) => (
        <div key={o.id} style={{ padding: '12px 4px', borderBottom: i < orders.length - 1 ? '1px solid #f5f5f0' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#1a2e1a' }}>{o.profiles?.full_name || '—'}</div>
              <div style={{ color: '#888', fontSize: 11 }}>✉ {o.profiles?.email || '—'}</div>
              <div style={{ color: '#aaa', fontSize: 11 }}>{fmtDate(o.created_at)}</div>
              {Array.isArray(o.items) && o.items.length > 0 && (
                <div style={{ marginTop: 3, fontSize: 11, color: '#888' }}>{o.items.map((it, j) => <div key={j}>🌿 {it.name}{it.pack ? ` · ${it.pack}` : ''} × {it.qty}</div>)}</div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontWeight: 800, color: '#4a7c59' }}>{inr(o.amount_inr)}</div>
              {(() => { const p = paymentInfo(o.status); return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: p.bg, color: p.color, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: 0.3 }}>{p.icon} {p.label}</span>
              ); })()}
              <StatusBadge status={o.status} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {NEXT_STEP[o.status] && (
              <button onClick={() => onAction(o, 'status', NEXT_STEP[o.status].status)} disabled={busyIds[o.id]} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#4a7c59', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{NEXT_STEP[o.status].label}</button>
            )}
            {o.status !== 'cancelled' && o.status !== 'delivered' && o.status !== 'paid' && o.status !== 'created' && !NEXT_STEP[o.status] && (
              <span />
            )}
            {['created', 'packed', 'out_for_delivery'].includes(o.status) && (
              <button onClick={() => onAction(o, 'status', 'cancelled')} disabled={busyIds[o.id]} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e07b39', background: '#fff8f3', color: '#e07b39', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            )}
            <button onClick={() => onAction(o, 'delete')} disabled={busyIds[o.id]} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #f0c8c8', background: '#fff5f5', color: '#c0392b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Panel 3: Upcoming deliveries (grouped by customer) ────────────────────
function UpcomingPanel({ customers, selected, setSelected }) {
  if (customers.length === 0) return <div style={{ padding: '24px 16px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>No upcoming deliveries.</div>;
  return (
    <div>
      {customers.map((c, i) => {
        const isOpen = selected === c.sid;
        return (
          <div key={c.sid} style={{ borderBottom: i < customers.length - 1 ? '1px solid #f5f5f0' : 'none' }}>
            <div onClick={() => setSelected(isOpen ? null : c.sid)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a2e1a', color: '#c8e6b0', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.name[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#1a2e1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{c.plan?.name} · {c.rows.length} left</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#f0f7ea', color: '#3a6b28', padding: '2px 8px', borderRadius: 6 }}>Next: {fmtDateShort(c.rows[0]?.scheduled_date)}</span>
                <div style={{ fontSize: 10, color: '#bbb', marginTop: 3 }}>{isOpen ? 'hide ▲' : 'view ▾'}</div>
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: '4px 4px 12px 48px' }}>
                {c.addr && <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>📍 {[c.addr.line1, c.addr.line2, c.addr.city, c.addr.pincode].filter(Boolean).join(', ')}</div>}
                {c.rows.map((d) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4a7c59' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>{fmtDate(d.scheduled_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PanelCard({ title, hint, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1a2e1a' }}>{title}</h3>
        {hint && <span style={{ fontSize: 11, color: '#aaa' }}>{hint}</span>}
      </div>
      <div style={{ padding: '6px 14px 12px' }}>{children}</div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────
export default function OverviewTab({ subscriptions, orders, deliveries, onRefresh, setMsg }) {
  const [upcomingSel, setUpcomingSel] = useState(null);
  const [busyIds, setBusyIds] = useState({});
  const [mobilePanel, setMobilePanel] = useState(null); // 'sunday' | 'orders' | 'upcoming'
  const today = todayIST();
  const sunday = nextSundayStr();

  const setBusy = (id, v) => setBusyIds((p) => { const n = { ...p }; if (v) n[id] = true; else delete n[id]; return n; });

  // Stats
  const activeSubs = subscriptions.filter((s) => paymentState(s, today) === 'active').length;
  const pausedSubs = subscriptions.filter((s) => s.status === 'paused').length;
  const paymentDue = subscriptions.filter((s) => paymentState(s, today) === 'payment_due').length;
  const totalRevenue = orders.filter((o) => o.status === 'paid' || o.status === 'delivered').reduce((s, o) => s + Number(o.amount_inr || 0), 0);

  const thisSunday = useMemo(() => deliveries.filter((d) => d.scheduled_date === sunday), [deliveries, sunday]);

  const upcomingCustomers = useMemo(() => {
    const bySub = {};
    deliveries.filter((d) => d.scheduled_date > sunday && d.status === 'scheduled').forEach((d) => {
      (bySub[d.subscription_id] ||= []).push(d);
    });
    return Object.entries(bySub).map(([sid, rows]) => {
      const sub = rows[0]?.subscriptions;
      return {
        sid, name: sub?.addresses?.full_name || sub?.profiles?.full_name || '—',
        plan: sub?.plans, addr: sub?.addresses,
        rows: rows.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
      };
    }).sort((a, b) => a.rows[0].scheduled_date.localeCompare(b.rows[0].scheduled_date));
  }, [deliveries, sunday]);

  // Only show completed orders: payment done (paid → delivered) or cancelled.
  // Hide bare 'created' (checkout started, never paid) and 'failed' attempts.
  const COMPLETE = ['paid', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  const recentOrders = orders.filter((o) => COMPLETE.includes(o.status)).slice(0, 8);
  const sundayLabel = new Date(sunday + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  async function deliver(id) {
    setBusy(id, true);
    await fetch('/api/admin/deliveries', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'delivered' }) });
    setBusy(id, false);
    onRefresh();
  }

  async function orderAction(o, kind, value) {
    setBusy(o.id, true);
    if (kind === 'delete') {
      await fetch('/api/admin/orders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: o.id }) });
      setMsg?.({ type: 'ok', text: 'Order deleted.' });
    } else {
      await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: o.id, status: value }) });
      setMsg?.({ type: 'ok', text: `Order → ${value.replace(/_/g, ' ')}.` });
    }
    setBusy(o.id, false);
    onRefresh();
  }

  const panels = {
    sunday: <ThisSundayPanel rows={thisSunday} sundayLabel={sundayLabel} onDeliver={deliver} busyIds={busyIds} />,
    orders: <RecentOrdersPanel orders={recentOrders} onAction={orderAction} busyIds={busyIds} />,
    upcoming: <UpcomingPanel customers={upcomingCustomers} selected={upcomingSel} setSelected={setUpcomingSel} />,
  };
  const panelMeta = {
    sunday: { title: `📦 This Sunday`, hint: sundayLabel, count: thisSunday.length },
    orders: { title: '💳 Recent Orders', hint: 'manage status', count: recentOrders.length },
    upcoming: { title: '📅 Upcoming Deliveries', hint: 'after this Sunday', count: upcomingCustomers.length },
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* 5 stat cards */}
      <div className="ov-stat-grid">
        <StatCard label="Active Subscribers" value={activeSubs} sub="Paying now" accent="#4a7c59" icon="🌱" />
        <StatCard label="Paused" value={pausedSubs} sub="Will resume" accent="#5c7aaa" icon="⏸️" />
        <StatCard label="This Sunday" value={thisSunday.length} sub={fmtDateShort(sunday)} accent="#f0a500" icon="📦" />
        <StatCard label="Total Revenue" value={inr(totalRevenue)} sub="Paid orders" accent="#7ab55c" icon="💰" />
        <StatCard label="Payment Due" value={paymentDue} sub="Auto-paused" accent="#e0392b" icon="⏳" />
      </div>

      {/* Mobile launcher buttons */}
      <div className="ov-mobile-launch">
        {['sunday', 'orders', 'upcoming'].map((k) => (
          <button key={k} onClick={() => setMobilePanel(k)}>
            <span>{panelMeta[k].title}</span>
            <span className="ov-launch-count">{panelMeta[k].count}</span>
          </button>
        ))}
      </div>

      {/* Desktop inline panels */}
      <div className="ov-desktop-panels">
        <PanelCard title={panelMeta.sunday.title} hint={panelMeta.sunday.hint}>{panels.sunday}</PanelCard>
        <div className="ov-two-col">
          <PanelCard title={panelMeta.upcoming.title} hint={panelMeta.upcoming.hint}>{panels.upcoming}</PanelCard>
          <PanelCard title={panelMeta.orders.title} hint={panelMeta.orders.hint}>{panels.orders}</PanelCard>
        </div>
      </div>

      {/* Mobile popup */}
      {mobilePanel && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setMobilePanel(null); }}>
          <div className="admin-modal admin-modal--sheet">
            <div className="admin-modal-head">
              <h3>{panelMeta[mobilePanel].title}</h3>
              <button onClick={() => setMobilePanel(null)} className="admin-modal-x">×</button>
            </div>
            <div className="admin-modal-body">{panels[mobilePanel]}</div>
          </div>
        </div>
      )}
    </div>
  );
}
