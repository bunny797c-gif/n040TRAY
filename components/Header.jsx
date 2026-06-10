'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <Link href="/"><img src="/logo/logo.png" alt="The Tray Microgreens" /></Link>
        </div>
        <nav className={`nav ${open ? 'nav-open' : ''}`}>
          <Link href="/subscription" onClick={() => setOpen(false)}>SUBSCRIPTION PLANS</Link>
          <Link href="/#microgreens" onClick={() => setOpen(false)}>MICROGREENS</Link>
          <Link href="/#" onClick={() => setOpen(false)}>SEEDS</Link>
          {user ? (
            <Link href="/account" onClick={() => setOpen(false)}>MY ACCOUNT</Link>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>SIGN IN</Link>
          )}
        </nav>
        <div className="header-right">
          <div className="cart-icon">
            <img src="/images/carticon.png" alt="Cart" />
          </div>
          <button
            className={`hamburger ${open ? 'is-open' : ''}`}
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
