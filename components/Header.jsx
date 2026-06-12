'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/lib/cart';
import BubbleMenu from './BubbleMenu';
import CartDrawer from './CartDrawer';

export default function Header() {
  const [user, setUser] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalCount } = useCart();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const navItems = [
    { label: 'SUBSCRIPTION PLANS', href: '/subscription', ariaLabel: 'Subscription Plans', rotation: -6, hoverStyles: { bgColor: '#4a7c59', textColor: '#ffffff' } },
    { label: 'MICROGREENS', href: '/#microgreens', ariaLabel: 'Microgreens', rotation: 6, hoverStyles: { bgColor: '#7ab55c', textColor: '#ffffff' } },
    { label: 'SEEDS', href: '/#', ariaLabel: 'Seeds', rotation: -6, hoverStyles: { bgColor: '#a8c98c', textColor: '#ffffff' } },
  ];

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <Link href="/"><Image src="/logo/logo.png" alt="№40 TRAY" width={160} height={60} priority /></Link>
          </div>
          {/* Desktop nav */}
          <nav className="nav">
            <Link href="/subscription">SUBSCRIPTION PLANS</Link>
            <Link href="/#microgreens">MICROGREENS</Link>
            <Link href="/#">SEEDS</Link>
            {user ? (
              <Link href="/account">MY ACCOUNT</Link>
            ) : (
              <Link href="/login">SIGN IN</Link>
            )}
          </nav>
          {/* Right side: cart + auth + hamburger */}
          <div className="header-right">
            <button
              className="cart-icon-btn"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
            >
              <Image src="/images/carticon.png" alt="Cart" width={32} height={32} />
              {totalCount > 0 && (
                <span className="cart-badge">{totalCount > 9 ? '9+' : totalCount}</span>
              )}
            </button>
            {user ? (
              <Link href="/account" className="mobile-auth-btn">MY ACCOUNT</Link>
            ) : (
              <Link href="/login" className="mobile-auth-btn">SIGN IN</Link>
            )}
            <div className="mobile-bubble-wrap">
              <BubbleMenu
                items={navItems}
                menuAriaLabel="Toggle navigation"
                menuBg="#4a7c59"
                menuContentColor="#c8d4a6"
                useFixedPosition={true}
                animationEase="back.out(1.5)"
                animationDuration={0.4}
                staggerDelay={0.12}
              />
            </div>
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
