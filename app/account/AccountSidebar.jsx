'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AccountSidebar({ active, name, hasActivePlan }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const initial = name?.[0]?.toUpperCase() || '?';

  return (
    <>
      {/* Desktop/tablet sidebar */}
      <aside className="acct-sidebar">
        <div className="acct-sidebar-profile">
          <div className="acct-avatar">{initial}</div>
          <div>
            <p className="acct-sidebar-name">{name}</p>
            <p className="acct-sidebar-role">Subscriber</p>
          </div>
        </div>
        <nav className="acct-sidebar-nav">
          <Link href="/account" className={`acct-nav-link${active === 'overview' ? ' acct-nav-link--active' : ''}`}>
            <span>🌱</span> My Subscription
          </Link>
          <Link href="/account/addresses" className={`acct-nav-link${active === 'addresses' ? ' acct-nav-link--active' : ''}`}>
            <span>📍</span> Addresses
          </Link>
          {!hasActivePlan && (
            <Link href="/subscription" className={`acct-nav-link${active === 'plans' ? ' acct-nav-link--active' : ''}`}>
              <span>📋</span> Browse Plans
            </Link>
          )}
          <Link href="/microgreens" className="acct-nav-link">
            <span>🥬</span> Shop Microgreens
          </Link>
          <Link href="/" className="acct-nav-link">
            <span>🏠</span> Home
          </Link>
        </nav>
        <button className="acct-signout" onClick={signOut}>
          <span>↩</span> Sign Out
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="acct-bottom-nav">
        <Link href="/account" className={`acct-bottom-tab${active === 'overview' ? ' acct-bottom-tab--active' : ''}`}>
          <span>🌱</span>
          <span>Account</span>
        </Link>
        <Link href="/account/addresses" className={`acct-bottom-tab${active === 'addresses' ? ' acct-bottom-tab--active' : ''}`}>
          <span>📍</span>
          <span>Address</span>
        </Link>
        {!hasActivePlan && (
          <Link href="/subscription" className="acct-bottom-tab">
            <span>📋</span>
            <span>Plans</span>
          </Link>
        )}
        <Link href="/microgreens" className="acct-bottom-tab">
          <span>🥬</span>
          <span>Shop</span>
        </Link>
        <Link href="/" className="acct-bottom-tab">
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <button className="acct-bottom-tab" onClick={signOut}>
          <span>↩</span>
          <span>Sign Out</span>
        </button>
      </nav>
    </>
  );
}
