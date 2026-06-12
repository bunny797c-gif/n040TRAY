import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlansSelector from './PlansSelector';

export const revalidate = 60;

export default async function SubscriptionPage() {
  const supabase = createClient();
  const { data: plans = [] } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('audience')
    .order('price_inr');

  return (
    <>
      <Header />

      <section className="sub-hero">
        <div className="sub-hero-inner">
          <p className="section-label">SUBSCRIPTION PLANS</p>
          <h1 className="sub-hero-title">4 Varieties.<br/>Every Sunday.</h1>
          <p className="sub-hero-subtitle">Each delivery is a curated mix — 4 different microgreens, freshly harvested that morning. Try new varieties every week without ordering in bulk. Pause anytime.</p>
        </div>
      </section>

      <PlansSelector plans={plans} />

      <section className="compare-section">
        <div className="compare-inner">
          <p className="section-label">WHAT YOU GET</p>
          <h2 className="section-title">Every Subscription Includes</h2>
          <div className="compare-grid">
            {[
              ['🚚', 'Free Home Delivery', 'No hidden fees. Every box arrives at your door at no extra cost.'],
              ['🌱', '4 Varieties Per Box', 'Each delivery has 4 different microgreens. The only way to get a mix — you can\'t order 25g of each individually.'],
              ['⏭️', 'Skip This Sunday', "Out for the weekend? Skip just one delivery — the next one comes the following Sunday like normal."],
              ['⏸️', 'Pause Indefinitely', "Long trip? Pause anytime Mon–Fri. Deliveries are saved — not lost — and resume the Sunday after you come back."],
              ['🔒', 'Locked-in Pricing', 'Your subscription price is fixed for its duration — no surprises.'],
              ['📅', 'Harvest-Day Freshness', 'Greens are harvested the morning of your delivery — never sooner.'],
              ['💬', 'Dedicated Support', 'WhatsApp support for delivery changes, variety swaps, and queries.'],
            ].map(([i, t, d]) => (
              <div className="compare-item" key={t}>
                <span className="compare-icon">{i}</span>
                <h4>{t}</h4>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sub-faq-section">
        <div className="sub-faq-inner">
          <p className="section-label">FREQUENTLY ASKED</p>
          <h2 className="section-title">Questions About Plans</h2>
          {[
            ['Can I pause my subscription if I am travelling?', "Yes. From your account dashboard you can pause anytime between Monday and Friday midnight. While paused, no deliveries arrive and none are lost — your remaining deliveries simply continue from the Sunday after you resume."],
            ['What happens if I forget to pause and I am not home on Sunday?', "Unfortunately, that delivery is lost — no refund or reschedule. We harvest the morning of delivery, so we cannot re-route or hold the box. Set a calendar reminder to pause before Friday midnight if you'll be away."],
            ['Can I cancel my subscription mid-term?', "Subscriptions run their full term (1, 3, 6 or 12 months) and aren't cancellable mid-way — this lets us plan harvests precisely with zero food waste. You can choose not to renew at the end."],
            ['Can I switch plans?', 'You can upgrade to a longer plan or move up a tier (e.g. Single → Couple) at any time. The new plan starts from your next Sunday delivery, and the remaining value of your current plan is applied as credit.'],
            ["What if I'm not home during delivery?", 'Our delivery team will follow your instructions — leave at the door, hand to security, or reschedule. You can also update your default delivery preference in your account.'],
            ['How are payments processed?', 'We accept UPI, debit/credit cards, and net banking. Monthly plans renew automatically; quarterly and longer plans are billed upfront with the savings applied.'],
            ['Can I gift a subscription?', "Yes. At checkout, select 'Gift this subscription' and enter the recipient's address. We'll handle the delivery — they'll receive a welcome note from you."],
            ['What areas do you currently deliver to?', 'We currently deliver across Tirupati, Renigunta, Chandragiri and Pileru in Andhra Pradesh. Madanapalle and Chittoor are next. Enter your pincode at checkout to confirm availability.'],
          ].map(([q, a]) => (
            <details className="faq-item" key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
