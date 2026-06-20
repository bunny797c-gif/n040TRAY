'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRealtime } from './useRealtime';
import OverviewTab from './OverviewTab';
import SubscribersTab from './SubscribersTab';
import ContentTab from './ContentTab';
import SetupTab from './SetupTab';
import ReferralsTab from './ReferralsTab';
import DeliveryPartnersTab from './DeliveryPartnersTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'subscribers', label: 'Subscribers', icon: '👥' },
  { id: 'partners', label: 'Delivery Partners', icon: '🚚' },
  { id: 'content', label: 'Page Content', icon: '✏️' },
  { id: 'setup', label: 'Setup', icon: '⚙️' },
  { id: 'referrals', label: 'Referrals', icon: '🎟️' },
];

const REALTIME_TABLES = [
  'subscriptions', 'orders', 'deliveries', 'referral_codes',
  'profiles', 'plans', 'microgreens_catalog', 'serviceable_pincodes', 'site_content',
  'delivery_partners',
];

export default function AdminEditor({ initialContent, initialPlans, initialPincodes, initialSubscriptions, initialOrders, adminEmail }) {
  const [tab, setTab] = useState('overview');
  const [plans, setPlans] = useState(initialPlans || []);
  const [pincodes, setPincodes] = useState(initialPincodes || []);
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions || []);
  const [orders, setOrders] = useState(initialOrders || []);
  const [deliveries, setDeliveries] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);
  const [msg, setMsg] = useState(null);

  const refetchAll = useCallback(async (silent = true) => {
    if (!silent) setRefreshing(true);
    try {
      const [s, o, d] = await Promise.all([
        fetch('/api/admin/subscribers'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/deliveries'),
      ]);
      if (s.ok) setSubscriptions(await s.json());
      if (o.ok) setOrders(await o.json());
      if (d.ok) setDeliveries(await d.json());
      setRefreshKey((k) => k + 1);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  // Initial load + live subscription to all admin tables.
  useEffect(() => { refetchAll(); }, [refetchAll]);
  useRealtime(REALTIME_TABLES, () => refetchAll(), setLive);

  // Safety-net poll. Realtime is the primary sync path, but it only delivers
  // cross-customer events once the admin-read RLS policies are applied
  // (supabase/migrations/20260618_admin_read_policies.sql). Until then — and as
  // a fallback if the socket drops — a slow poll keeps the dashboard fresh.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refetchAll();
    }, 25000);
    return () => clearInterval(id);
  }, [refetchAll]);

  // Auto-clear transient messages.
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const activeTab = TABS.find((t) => t.id === tab);

  return (
    <div className="admin-root">
      {/* Top bar */}
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontSize: 20 }}>🌱</span>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>№40 TRAY — Admin</span>
          <span title={live ? 'Live — syncing in real time' : 'Connecting…'} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: live ? '#9be86b' : '#c9a14a', whiteSpace: 'nowrap' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: live ? '#7ed957' : '#e0a020', boxShadow: live ? '0 0 0 3px rgba(126,217,87,0.25)' : 'none' }} />
            {live ? 'LIVE' : '…'}
          </span>
        </div>
        <div className="admin-topbar-right">
          <span className="admin-topbar-email">{adminEmail}</span>
          <button onClick={() => refetchAll(false)} disabled={refreshing} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#c8e6b0', fontSize: 12, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', letterSpacing: 0.3, opacity: refreshing ? 0.6 : 1, whiteSpace: 'nowrap' }}>{refreshing ? '…' : '↻ Refresh'}</button>
          <Link href="/" target="_blank" style={{ color: '#c8e6b0', fontWeight: 700, textDecoration: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>VIEW SITE ↗</Link>
        </div>
      </div>

      <div className="admin-body">
        {/* Sidebar / mobile pill bar */}
        <aside className="admin-sidenav">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => { setTab(id); setMsg(null); }} className={`admin-nav-btn${tab === id ? ' admin-nav-btn--active' : ''}`}>
              <span style={{ fontSize: 16 }}>{icon}</span>{label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="admin-main">
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>{activeTab?.icon} {activeTab?.label}</h1>
          </div>

          {msg && (
            <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600, background: msg.type === 'error' ? '#fdecea' : '#eef7e8', color: msg.type === 'error' ? '#b0281e' : '#3d6b2e', border: `1px solid ${msg.type === 'error' ? '#f5c6c3' : '#c3e6b0'}` }}>{msg.text}</div>
          )}

          {tab === 'overview' && <OverviewTab subscriptions={subscriptions} orders={orders} deliveries={deliveries} onRefresh={refetchAll} setMsg={setMsg} />}
          {tab === 'subscribers' && <SubscribersTab subscriptions={subscriptions} plans={plans} onRefresh={refetchAll} setMsg={setMsg} />}
          {tab === 'content' && <ContentTab initialContent={initialContent} setMsg={setMsg} />}
          {tab === 'setup' && <SetupTab plans={plans} setPlans={setPlans} pincodes={pincodes} setPincodes={setPincodes} setMsg={setMsg} />}
          {tab === 'referrals' && <ReferralsTab refreshKey={refreshKey} setMsg={setMsg} />}
          {tab === 'partners' && <DeliveryPartnersTab setMsg={setMsg} />}
        </main>
      </div>
    </div>
  );
}
