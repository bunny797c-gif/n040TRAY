import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import AccountSidebar from './AccountSidebar';
import SubscriptionActions from './SubscriptionActions';

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateWithDay(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
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

  return (
    <>
      <Header />
      <div className="app-shell">
        <div className="app-inner">
          <h1 className="app-title">Welcome, {profile?.full_name || user.email.split('@')[0]}</h1>
          <p className="app-subtitle">Manage your subscriptions, track orders, and update your delivery details.</p>

          <div className="account-grid">
            <AccountSidebar active="overview" />

            <div className="account-main">

              {/* Active Subscription */}
              <div className="card">
                <h2>Current Subscription</h2>
                {!activeSub ? (
                  <>
                    <p className="empty">You don't have any active subscriptions yet.</p>
                    <div style={{textAlign:'center', marginTop:8}}>
                      <Link href="/subscription" className="btn-primary" style={{display:'inline-flex'}}><span>BROWSE PLANS</span></Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row">
                      <div>
                        <strong>{activeSub.plans?.name} — {activeSub.plans?.audience?.toUpperCase()}</strong>
                        <small>{activeSub.plans?.serving_label}</small>
                      </div>
                      <span className={`status-badge ${activeSub.status}`}>{activeSub.status.replace('_',' ')}</span>
                    </div>
                    <div className="row">
                      <div><strong>Plan price</strong></div>
                      <div>{inr(activeSub.plans?.price_inr || 0)}</div>
                    </div>
                    <div className="row">
                      <div><strong>Started</strong></div>
                      <div>{fmtDate(activeSub.start_date)}</div>
                    </div>
                    <div className="row">
                      <div>
                        <strong>Next delivery</strong>
                        <small>Deliveries every Sunday</small>
                      </div>
                      <div>
                        {activeSub.status === 'paused'
                          ? <em style={{color:'#888'}}>Paused — resume to schedule</em>
                          : fmtDateWithDay(activeSub.next_delivery_date)}
                      </div>
                    </div>
                    <div className="row">
                      <div><strong>Deliveries included</strong></div>
                      <div>{activeSub.plans?.deliveries}</div>
                    </div>
                    {(activeSub.status === 'active' || activeSub.status === 'paused') && (
                      <SubscriptionActions
                        subscriptionId={activeSub.id}
                        status={activeSub.status}
                        nextDeliveryDate={activeSub.next_delivery_date}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Recent Orders */}
              <div className="card">
                <h2>Recent Orders</h2>
                {orders.length === 0 ? (
                  <p className="empty">No orders yet.</p>
                ) : (
                  orders.map((o) => (
                    <div className="row" key={o.id}>
                      <div>
                        <strong>{inr(o.amount_inr)}</strong>
                        <small>{fmtDate(o.created_at)} · {o.razorpay_order_id || 'pending'}</small>
                      </div>
                      <span className={`status-badge ${o.status}`}>{o.status}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Delivery Address */}
              <div className="card">
                <h2>Delivery Address</h2>
                {addresses.length === 0 ? (
                  <p className="empty">No address saved yet. Add one when you place your first order.</p>
                ) : (
                  addresses.map((a) => (
                    <div className="row" key={a.id}>
                      <div>
                        <strong>{a.full_name} · {a.label}</strong>
                        <small>{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</small>
                        <small>{a.phone}</small>
                      </div>
                      {a.is_default && <span className="status-badge active">Default</span>}
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
