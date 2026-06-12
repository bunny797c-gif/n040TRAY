import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MicrogreensPageClient from './MicrogreensPageClient';

export const revalidate = 0;

export const metadata = {
  title: 'Microgreens — №40 TRAY',
  description: 'Browse all available microgreen varieties from №40 TRAY. Fresh, nutrient-dense, harvested to order.',
};

export default async function MicrogreensPage() {
  const supabase = createClient();
  const { data: varieties } = await supabase
    .from('microgreens_catalog')
    .select('*')
    .eq('show_on_home', true)
    .order('home_order')
    .order('name');

  return (
    <>
      <Header />
      <MicrogreensPageClient varieties={varieties || []} />
      <Footer />
    </>
  );
}
