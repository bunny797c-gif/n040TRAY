import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage({ searchParams }) {
  const planId = searchParams?.plan;
  if (!planId) redirect('/subscription');

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/checkout?plan=${planId}`);

  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).maybeSingle();
  if (!plan) redirect('/subscription');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const { data: defaultAddress } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .maybeSingle();

  return (
    <>
      <Header />
      <div className="app-shell">
        <div className="app-inner">
          <h1 className="app-title">Checkout</h1>
          <p className="app-subtitle">Complete your subscription order.</p>
          <CheckoutClient
            plan={plan}
            profile={profile}
            defaultAddress={defaultAddress}
            userEmail={user.email}
            verifiedPhone={profile?.verified_phone}
            phoneVerifiedAt={profile?.phone_verified_at}
          />
        </div>
      </div>
    </>
  );
}
