'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AccountSidebar({ active }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="account-side">
      <Link href="/account" className={active === 'overview' ? 'active' : ''}>Overview</Link>
      <Link href="/subscription" className={active === 'plans' ? 'active' : ''}>Browse Plans</Link>
      <button className="signout-btn" onClick={signOut}>Sign Out</button>
    </aside>
  );
}
