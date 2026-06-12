import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomeScripts from './HomeScripts';
import MicrogreensGrid from './MicrogreensGrid';
import { WhyChooseUs, OurStandards, HowItWorks, WhoWeServe, HeroStats, VineDivider } from './HomeSections';
import PremiumMotion from './PremiumMotion';
import { getSiteContent, t } from '@/lib/content';

export const revalidate = 0;

// Render admin-managed text that uses | as a line break
function lines(text) {
  const parts = String(text).split('|');
  return parts.map((p, i) => (
    <span key={i}>{p}{i < parts.length - 1 ? <br /> : null}</span>
  ));
}

export default async function HomePage() {
  const c = await getSiteContent();
  return (
    <>
      <Header />

      {/* Hero */}
      <div className="hero-bg">
        <section className="hero">
          <div className="hero-left">
            <div className="hero-label">
              {t(c, 'hero.label', '') || <span className="brand-name"><Image src="/logo/n40.png" alt="№40" width={80} height={80} className="hero-logo-img" priority /><span className="brand-tray">TRAY</span></span>}
            </div>
            <h1 className="hero-title">{lines(t(c, 'hero.title', 'Harvested Today.|On Your Plate|Tomorrow.'))}</h1>
            <p className="hero-subtitle">{lines(t(c, 'hero.subtitle', 'Fresh, nutrient-dense microgreens grown with care|and delivered at peak freshness.'))}</p>
            <div className="button-group">
              <Link href="/subscription" className="btn-primary"><span>{t(c, 'hero.primary_cta', 'START A SUBSCRIPTION')}</span></Link>
              <Link href="#microgreens" className="btn-secondary"><span>{t(c, 'hero.secondary_cta', 'SHOP MICROGREENS')}</span></Link>
            </div>
            <div className="badges badges-desktop">
              <HeroStats />
            </div>
          </div>
          <div className="hero-right">
            <div className="product-image">
              <Image src={t(c, 'hero.image', '/images/img-1.jpg')} alt="Fresh Microgreens" width={798} height={1200} priority style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
            </div>
            <div className="badges badges-mobile">
              <HeroStats />
            </div>
          </div>
        </section>
      </div>

      {/* Banner */}
      <div className="banner-section">
        <Image src="/images/bg-1.png" alt="" width={1376} height={768} priority style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      {/* Why Microgreens */}
      <section className="why-micro-section">
        <div className="why-micro-inner">
          <div className="why-micro-left">
            <p className="why-micro-label">WHY MICROGREENS?</p>
            <h2 className="why-micro-title">Tiny Greens.<br/>Powerful<br/>Nutrition.</h2>
            <button className="why-micro-btn">KNOW MORE</button>
          </div>
          <div className="why-micro-center">
            <Image src="/images/sec-2.png" alt="Microgreens illustration" width={752} height={1407} />
          </div>
          <div className="why-micro-right">
            {[
              '1. Nutrient-dense greens harvested young',
              '2. Rich in vitamins, minerals & antioxidants',
              '3. Easy to consume with everyday meals',
              '4. Supports daily wellness & energy',
            ].map((t) => (
              <div className="why-micro-item" key={t}><p>{t}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <WhyChooseUs />
      <VineDivider />

      {/* Products */}
      <MicrogreensGrid
        label={t(c, 'varieties.label', 'OUR VARIETIES')}
        title={t(c, 'varieties.title', 'Microgreens We Grow')}
        subtitle={t(c, 'varieties.subtitle', 'Each variety is grown in a dedicated batch, harvested at peak flavour, and packed the same day.')}
      />

      {/* Our Standards */}
      <OurStandards />

      {/* Nutrition */}
      <section className="nutrition-section">
        <div className="nutrition-inner">
          <div className="nutrition-left">
            <p className="section-label" style={{color:'#c8d4a6'}}>NUTRITIONAL VALUE</p>
            <h2 className="section-title" style={{color:'#fff'}}>Small Portion.<br/>Significant Impact.</h2>
            <p className="section-subtitle" style={{color:'rgba(255,255,255,0.7)', marginBottom:40}}>A single daily serving of microgreens provides meaningful amounts of vitamins and minerals — without changing your diet.</p>
            <div className="nutrition-benefits">
              {[
                ['Rich in Vitamins C, E & K', 'Supports immunity, skin health, and bone density — essential for everyday wellbeing.'],
                ['High Antioxidant Content', 'Helps neutralise free radicals — relevant for anyone managing stress, pollution, or irregular sleep.'],
                ['Supports Gut Health', 'Live enzymes and dietary fibre assist digestion and nutrient absorption at the cellular level.'],
                ['Fitness & Recovery', 'Plant-based protein and amino acids support muscle recovery and sustained energy for active individuals.'],
              ].map(([t, d]) => (
                <div className="nutrition-benefit-item" key={t}>
                  <div className="benefit-dot"></div>
                  <div><h4>{t}</h4><p>{d}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="nutrition-right">
            <div className="nutrition-stats-grid">
              {[['40x','More nutrients vs. mature greens*'],['7–14','Days from seed to harvest'],['6+','Vitamins present per serving'],['0','Pesticides, chemicals or additives']].map(([n, l]) => (
                <div className="nutrition-stat" key={l}>
                  <span className="stat-number">{n}</span>
                  <span className="stat-label">{l}</span>
                </div>
              ))}
            </div>
            <p className="nutrition-disclaimer">*Based on published studies comparing microgreen nutrient density to mature vegetable counterparts. Results vary by variety.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />
      <VineDivider />

      {/* Who We Serve */}
      <WhoWeServe />

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="testimonials-inner">
          <p className="section-label">CUSTOMER STORIES</p>
          <h2 className="section-title">From Our Customers</h2>
          <p className="section-subtitle">Real feedback from people who order regularly — no curated superlatives.</p>
          <div className="testimonials-grid">
            {[
              ['★★★★★', '"I\'ve been receiving the weekly box for about three months. The sunflower microgreens are consistently fresh and the packaging is solid. I add them to my lunch every day — it\'s become a habit I don\'t want to break."', 'P', 'Priya S.', 'Bengaluru · Weekly subscriber, 3 months'],
              ['★★★★★', '"We source microgreens from The Tray for our cafe menu. The harvest-day freshness is noticeable — guests comment on it. Delivery has been reliable every week without us needing to follow up."', 'A', 'Arjun Nair', 'Cafe owner, Kochi · Bulk subscription'],
              ['★★★★☆', '"My nutritionist suggested I add microgreens to my diet after my iron levels were low. I tried a few brands and settled on The Tray because the broccoli variety stays fresh longest and the quantity is honest."', 'R', 'Ravi M.', 'Chennai · Fortnightly subscriber'],
              ['★★★★★', '"Ordered the family box for the first time and was surprised by how simple it was to use. My daughter eats pea shoots without any fuss. The radish variety is now a regular in our sabzi and wraps."', 'S', 'Sudha R.', 'Hyderabad · Family box subscriber'],
            ].map(([stars, text, av, name, meta], i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-stars">{stars}</div>
                <p className="testimonial-text">{text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{av}</div>
                  <div><strong>{name}</strong><span>{meta}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="testimonials-summary">
            <div className="summary-stat"><strong>4.8 / 5</strong><span>Average rating</span></div>
            <div className="summary-divider"></div>
            <div className="summary-stat"><strong>93%</strong><span>Subscribers renew after first month</span></div>
            <div className="summary-divider"></div>
            <div className="summary-stat"><strong>200+</strong><span>Active households served</span></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="faq-inner">
          <div className="faq-left">
            <p className="section-label">COMMON QUESTIONS</p>
            <h2 className="section-title">Before You Order</h2>
            <p className="section-subtitle">Answers to the questions we hear most often.</p>
            <Link href="/subscription" className="btn-primary faq-cta-btn" style={{marginTop:32}}><span>START A SUBSCRIPTION</span></Link>
          </div>
          <div className="faq-right">
            {[
              ['How long do microgreens last after delivery?', 'When stored correctly in the refrigerator, our microgreens last 5–7 days from the delivery date. Because they are harvested the morning of delivery, you receive them at their freshest point.'],
              ['How should I store them?', "Keep the sealed container in your refrigerator's vegetable drawer. Do not wash them until just before use — moisture accelerates wilting. Once opened, consume within 3–4 days."],
              ['On which days do you deliver?', 'We deliver every Sunday across our service areas. This lets you start the week with fresh microgreens, harvested that very morning. Subscription orders placed any day Mon–Sat are delivered the upcoming Sunday.'],
              ['Can I pause my subscription if I am travelling?', "Yes. From your account, pause anytime Mon–Fri before Friday midnight. While paused, no deliveries arrive and none are lost — they continue from the Sunday after you resume. Important: if you forget to pause and aren't home on Sunday, that delivery is lost (no refund or reschedule)."],
              ['Are they safe for children and elderly?', 'Yes. Our microgreens are grown without pesticides or chemical treatments and use RO-purified water. They are safe for all age groups. We recommend rinsing lightly before serving to young children.'],
              ['How do I use microgreens in Indian cooking?', 'Add them raw on top of dal, rice, or roti just before eating. They can also go into salads, raitas, smoothies, or on the side of any meal as a fresh component. Cooking is not recommended as heat reduces nutrient content.'],
              ['Do you supply to restaurants or bulk buyers?', 'Yes. We have a commercial supply arrangement for restaurants, cafes, and wellness centres. Contact us directly at hello@thetraymicrogreens.in to discuss quantity, frequency, and pricing.'],
            ].map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <p className="cta-label">{t(c, 'cta.label', 'READY TO START?')}</p>
          <h2 className="cta-title">{lines(t(c, 'cta.title', 'Your First Box,|Harvested Tomorrow.'))}</h2>
          <p className="cta-subtitle">{t(c, 'cta.subtitle', 'Join 200+ households receiving fresh microgreens every week. No commitment required on your first order.')}</p>
          <div className="cta-buttons">
            <Link href="/subscription" className="btn-primary cta-primary-btn"><span>START A SUBSCRIPTION</span></Link>
            <Link href="/#microgreens" className="btn-cta-secondary"><span>SHOP SINGLE ORDER</span></Link>
          </div>
          <p className="cta-trust">✓ Harvested same day &nbsp;·&nbsp; ✓ Chemical-free &nbsp;·&nbsp; ✓ Sunday delivery, every week</p>
        </div>
      </section>

      <Footer />
      <HomeScripts />
      <PremiumMotion />
    </>
  );
}
