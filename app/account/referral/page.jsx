import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import AccountSidebar from '../AccountSidebar';
import ReferralDashboard from './ReferralDashboard';

export const dynamic = 'force-dynamic';

export default async function ReferralPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/referral');

  const [{ data: profile }, { data: subs = [] }, { data: codeRow }] = await Promise.all([
    supabase.from('profiles').select('full_name, wallet_coins').eq('id', user.id).maybeSingle(),
    supabase.from('subscriptions').select('id, status').eq('user_id', user.id),
    supabase.from('referral_codes').select('code, is_active, uses_count, max_uses').eq('user_id', user.id).maybeSingle(),
  ]);

  const name = profile?.full_name || user.email.split('@')[0];
  const hasActivePlan = subs.some((s) => ['active', 'paused', 'pending_payment'].includes(s.status));

  // If not selected for referral program, redirect to account
  if (!codeRow || !codeRow.is_active) {
    redirect('/account');
  }

  return (
    <>
      <Header />
      <div className="acct-shell">
        <div className="acct-inner">
          <header className="acct-header">
            <h1>Referral Program</h1>
            <p>Share your code, earn coins. 500 coins = ₹50 off your next renewal.</p>
          </header>
          <div className="acct-layout">
            <AccountSidebar active="referral" name={name} hasActivePlan={hasActivePlan} hasReferral={true} />
            <main className="acct-main">
              <ReferralDashboard
                code={codeRow.code}
                usesCount={codeRow.uses_count}
                maxUses={codeRow.max_uses}
                walletCoins={profile?.wallet_coins || 0}
              />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
