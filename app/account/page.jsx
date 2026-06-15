import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import AccountSidebar from './AccountSidebar';
import SubscriptionActions from './SubscriptionActions';
import { todayIST } from '@/lib/dates';

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function heroDate(d) {
  if (!d) return null;
  const date = new Date(d + 'T00:00:00');
  return {
    day: date.toLocaleDateString('en-IN', { weekday: 'long' }),
    date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

// Build the Sunday-by-Sunday delivery schedule from the subscription.
// Skipped Sundays (between today and next_delivery_date) don't consume a delivery.
function buildSchedule(sub) {
  const total = sub?.plans?.deliveries;
  if (!total || !sub.start_date) return [];

  const start = new Date(sub.start_date.slice(0, 10) + 'T00:00:00');
  const first = new Date(start);
  first.setDate(first.getDate() + ((7 - first.getDay()) % 7 || 7));

  const next = sub.next_delivery_date ? new Date(sub.next_delivery_date.slice(0, 10) + 'T00:00:00') : null;
  const today = new Date(todayIST() + 'T00:00:00');

  const list = [];
  let d = new Date(first);
  let counted = 0;
  let guard = 0;
  while (counted < total && guard < total + 12) {
    let status;
    if (d < today) {
      status = 'delivered';
    } else if (next && d.getTime() === next.getTime()) {
      status = sub.status === 'paused' ? 'paused' : 'next';
    } else if (next && d < next) {
      status = 'skipped';
    } else {
      status = sub.status === 'paused' ? 'paused' : 'upcoming';
    }
    if (status !== 'skipped') counted++;
    list.push({ date: new Date(d), status });
    d.setDate(d.getDate() + 7);
    guard++;
  }
  return list;
}

const SCHED_LABEL = {
  delivered: '✓ Delivered',
  next: 'Next',
  skipped: 'Skipped',
  upcoming: 'Upcoming',
  paused: 'Paused',
};

// Order tracking: how far along the Amazon-style pipeline each status is.
const TRACK_STEPS = ['Ordered', 'Packed', 'Out for delivery', 'Delivered'];
const TRACK_PROGRESS = { paid: 1, packed: 2, out_for_delivery: 3, delivered: 4, missed: 3 };

function arrivalLabel(d) {
  if (!d) return null;
  const date = new Date(d + 'T00:00:00');
  const today = new Date(todayIST() + 'T00:00:00');
  const txt = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  return date.getTime() === today.getTime() ? `Arriving today, ${txt}` : `Arriving ${txt}`;
}

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  const [{ data: profile }, { data: subs = [] }, { data: orders = [] }, { data: addresses = [] }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('subscriptions').select('*, plans(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
  ]);

  const activeSub = subs?.find((s) => s.status === 'active') || subs?.[0];
  const hd = activeSub?.status === 'active' ? heroDate(activeSub.next_delivery_date) : null;
  const name = profile?.full_name || user.email.split('@')[0];
  const hasActivePlan = activeSub?.status === 'active' || activeSub?.status === 'paused';
  const schedule = hasActivePlan ? buildSchedule(activeSub) : [];

  return (
    <>
      <Header />
      <div className="acct-shell">
        <div className="acct-inner">
          <div className="acct-layout">
            <AccountSidebar active="overview" name={name} hasActivePlan={hasActivePlan} />

            <main className="acct-main">

              {/* Hero — next delivery */}
              {activeSub ? (
                <div className={`acct-hero acct-hero--${activeSub.status}`}>
                  <div className="acct-hero-left">
                    <p className="acct-hero-eyebrow">
                      {activeSub.status === 'paused' ? 'Subscription' : 'Next Delivery'}
                    </p>
                    <p className="acct-hero-day">
                      {hd ? hd.day : 'Paused'}
                    </p>
                    <p className="acct-hero-date">
                      {hd ? hd.date : 'Resume to schedule your next box'}
                    </p>
                  </div>
                  <div className="acct-hero-right">
                    <span className={`acct-pill acct-pill--${activeSub.status}`}>
                      {activeSub.status === 'pending_payment' ? 'Pending' : activeSub.status}
                    </span>
                    <p className="acct-hero-plan">{activeSub.plans?.name}</p>
                    <p className="acct-hero-serving">{activeSub.plans?.serving_label}</p>
                  </div>
                </div>
              ) : (
                <div className="acct-no-sub">
                  <span>🌱</span>
                  <p>No active subscription yet.</p>
                  <Link href="/subscription" className="btn-primary" style={{ display: 'inline-flex' }}>
                    <span>BROWSE PLANS</span>
                  </Link>
                </div>
              )}

              {/* Subscription card */}
              {activeSub && (
                <div className="acct-card">
                  <div className="acct-card-hd"><h2>Subscription</h2></div>
                  <div className="acct-detail-grid">
                    <div className="acct-detail-cell">
                      <span className="acct-detail-lbl">Plan</span>
                      <span className="acct-detail-val">{activeSub.plans?.name}</span>
                    </div>
                    <div className="acct-detail-cell">
                      <span className="acct-detail-lbl">Price</span>
                      <span className="acct-detail-val">{inr(activeSub.plans?.price_inr || 0)}</span>
                    </div>
                    <div className="acct-detail-cell">
                      <span className="acct-detail-lbl">Started</span>
                      <span className="acct-detail-val">{fmtDate(activeSub.start_date)}</span>
                    </div>
                    <div className="acct-detail-cell">
                      <span className="acct-detail-lbl">Deliveries</span>
                      <span className="acct-detail-val">{activeSub.plans?.deliveries} included</span>
                    </div>
                  </div>
                  {(activeSub.status === 'active' || activeSub.status === 'paused') && (
                    <SubscriptionActions
                      subscriptionId={activeSub.id}
                      status={activeSub.status}
                      nextDeliveryDate={activeSub.next_delivery_date}
                    />
                  )}
                </div>
              )}

              {/* Delivery schedule */}
              {schedule.length > 0 && (
                <div className="acct-card">
                  <div className="acct-card-hd">
                    <h2>Delivery Schedule</h2>
                  </div>
                  <div className="acct-sched-list">
                    {schedule.map((s, i) => (
                      <div className={`acct-sched-row acct-sched-row--${s.status}`} key={i}>
                        <div className="acct-sched-dot" />
                        <div className="acct-sched-body">
                          <strong>
                            {s.date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                          </strong>
                        </div>
                        <span className={`acct-sched-tag acct-sched-tag--${s.status}`}>
                          {SCHED_LABEL[s.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="acct-sched-note">
                    Deliveries arrive every Sunday morning. Skipped Sundays don't use up a delivery.
                  </p>
                </div>
              )}

              {/* Orders */}
              <div className="acct-card">
                <div className="acct-card-hd"><h2>Orders</h2></div>
                {orders.length === 0 ? (
                  <p className="acct-empty">No orders yet.</p>
                ) : (
                  <div className="acct-order-list">
                    {orders.map((o) => {
                      const progress = TRACK_PROGRESS[o.status] ?? 0;
                      const trackable = progress > 0 && o.delivery_date;
                      const arriving = o.status !== 'delivered' ? arrivalLabel(o.delivery_date) : null;
                      return (
                        <div className="acct-order" key={o.id}>
                          <div className="acct-order-top">
                            <div>
                              <strong>{inr(o.amount_inr)}</strong>
                              <small>Ordered {fmtDate(o.created_at)}</small>
                            </div>
                            <span className={`acct-badge acct-badge--${o.status}`}>
                              {o.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {Array.isArray(o.items) && o.items.length > 0 && (
                            <div className="acct-order-items">
                              {o.items.map((it, i) => (
                                <div className="acct-order-item" key={i}>
                                  <span>🌿 {it.name}{it.pack ? ` · ${it.pack}` : ''} × {it.qty}</span>
                                  <span>{inr(it.qty * it.price)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {trackable && (
                            <>
                              <div className="acct-track">
                                {TRACK_STEPS.map((step, i) => (
                                  <div className={`acct-track-step${i < progress ? ' acct-track-step--done' : ''}${i === progress - 1 ? ' acct-track-step--current' : ''}`} key={step}>
                                    <div className="acct-track-dot">{i < progress ? '✓' : ''}</div>
                                    {i < TRACK_STEPS.length - 1 && <div className="acct-track-line" />}
                                    <span className="acct-track-lbl">{step}</span>
                                  </div>
                                ))}
                              </div>
                              {arriving && o.status !== 'missed' && <p className="acct-order-arrival">📦 {arriving}</p>}
                              {o.status === 'delivered' && o.delivery_date && (
                                <p className="acct-order-arrival acct-order-arrival--done">✓ Delivered on {fmtDate(o.delivery_date)}</p>
                              )}
                              {o.status === 'missed' && (
                                <p className="acct-order-arrival acct-order-arrival--missed">⚠ We couldn't deliver this order — no one was home on the scheduled day. Contact us if this is wrong.</p>
                              )}
                            </>
                          )}
                          {o.status === 'created' && (
                            <p className="acct-order-arrival acct-order-arrival--pending">⏳ Payment pending — complete payment to confirm this order.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="acct-card">
                <div className="acct-card-hd">
                  <h2>Delivery Address</h2>
                  <Link href="/account/addresses" className="acct-card-link">Manage →</Link>
                </div>
                {addresses.length === 0 ? (
                  <div style={{ padding: '0 20px 20px' }}>
                    <p className="acct-empty">No address saved yet.</p>
                    <Link href="/account/addresses" className="addr-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 8 }}>+ Add address</Link>
                  </div>
                ) : (
                  <div className="acct-addr-list">
                    {addresses.slice(0, 2).map((a) => (
                      <div className="acct-addr-row" key={a.id}>
                        <div className="acct-addr-icon">📍</div>
                        <div className="acct-addr-body">
                          <strong>{a.full_name}</strong>
                          <span>{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</span>
                          <span>{a.phone}</span>
                        </div>
                        {a.is_default && <span className="acct-default-tag">Default</span>}
                      </div>
                    ))}
                    {addresses.length > 2 && (
                      <Link href="/account/addresses" className="acct-card-link" style={{ padding: '8px 20px 4px', display: 'block' }}>
                        + {addresses.length - 2} more →
                      </Link>
                    )}
                  </div>
                )}
              </div>

            </main>
          </div>
        </div>
      </div>
    </>
  );
}
