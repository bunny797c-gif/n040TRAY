import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import AccountSidebar from '../AccountSidebar';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/profile');

  const [{ data: profile }, { data: subs = [] }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('subscriptions').select('id, status').eq('user_id', user.id),
  ]);

  const name = profile?.full_name || user.email.split('@')[0];
  const hasActivePlan = subs.some((s) => ['active', 'paused', 'pending_payment'].includes(s.status));

  return (
    <>
      <Header />
      <div className="acct-shell">
        <div className="acct-inner">
          <header className="acct-header">
            <h1>Your Profile</h1>
            <p>Update your name. Your email and phone are tied to sign-in and OTP — to change either, contact support.</p>
          </header>
          <div className="acct-layout">
            <AccountSidebar active="profile" name={name} hasActivePlan={hasActivePlan} />
            <main className="acct-main">
              <ProfileForm
                email={user.email}
                initialName={profile?.full_name || ''}
                phone={profile?.verified_phone || profile?.phone || ''}
                phoneVerified={!!profile?.phone_verified_at}
              />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
