import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin';
import AdminEditor from './AdminEditor';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { user, isAdmin } = await getAdminUser();
  if (!user) redirect('/login?next=/admin');
  if (!isAdmin) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Not authorized</h1>
          <p className="auth-subtitle">This account does not have admin access.</p>
          <Link href="/" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>BACK TO HOME</Link>
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const [
    { data: content },
    { data: plans },
    { data: pincodes },
    { data: subscriptions },
    { data: orders },
  ] = await Promise.all([
    supabase.from('site_content').select('*').order('section').order('key'),
    supabase.from('plans').select('*').order('audience').order('price_inr'),
    supabase.from('serviceable_pincodes').select('*').order('pincode'),
    supabase
      .from('subscriptions')
      .select('*, plans(name, audience, price_inr, duration, deliveries), profiles(email, full_name, phone), addresses(full_name, phone, line1, line2, city, state, pincode)')
      .order('created_at', { ascending: false })
      .limit(300),
    supabase
      .from('orders')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return (
    <AdminEditor
      initialContent={content || []}
      initialPlans={plans || []}
      initialPincodes={pincodes || []}
      initialSubscriptions={subscriptions || []}
      initialOrders={orders || []}
      adminEmail={user.email}
    />
  );
}
