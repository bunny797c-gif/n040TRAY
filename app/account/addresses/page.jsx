import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import AccountSidebar from '../AccountSidebar';
import AddressManager from './AddressManager';

export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/addresses');

  const [{ data: profile }, { data: addresses = [] }, { data: subs = [] }, { data: refCode }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('id, status, address_id').eq('user_id', user.id),
    supabase.from('referral_codes').select('is_active').eq('user_id', user.id).maybeSingle(),
  ]);

  const name = profile?.full_name || user.email.split('@')[0];
  const hasActivePlan = subs.some((s) => ['active', 'paused', 'pending_payment'].includes(s.status));
  const hasReferral = !!(refCode?.is_active);
  const lockedAddressIds = subs.filter((s) => ['active', 'paused', 'pending_payment'].includes(s.status)).map((s) => s.address_id);

  return (
    <>
      <Header />
      <div className="acct-shell">
        <div className="acct-inner">
          <header className="acct-header">
            <h1>Your Addresses</h1>
            <p>Saved delivery addresses. Set one as default — that's where new orders go.</p>
          </header>
          <div className="acct-layout">
            <AccountSidebar active="addresses" name={name} hasActivePlan={hasActivePlan} hasReferral={hasReferral} />
            <main className="acct-main">
              <AddressManager
                initialAddresses={addresses || []}
                lockedAddressIds={lockedAddressIds}
                defaultPhone={profile?.verified_phone || profile?.phone || ''}
              />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
