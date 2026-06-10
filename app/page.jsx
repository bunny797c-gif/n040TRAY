import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomeScripts from './HomeScripts';

export default function HomePage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <div className="hero-bg">
        <section className="hero">
          <div className="hero-left">
            <div className="hero-label">THE TRAY MICROGREENS</div>
            <h1 className="hero-title">Harvested Today.<br/>On Your Plate<br/>Tomorrow.</h1>
            <p className="hero-subtitle">Fresh, nutrient-dense microgreens grown with care<br/>and delivered at peak freshness.</p>
            <div className="button-group">
              <Link href="/subscription" className="btn-primary"><span>START A SUBSCRIPTION</span></Link>
              <Link href="#microgreens" className="btn-secondary"><span>SHOP MICROGREENS</span></Link>
            </div>
            <div className="badges">
              <img src="/images/stats.png" alt="Stats" className="stats-image stats-desktop" />
              <img src="/images/statsvertical.png" alt="Stats" className="stats-image stats-vertical" />
            </div>
          </div>
          <div className="hero-right">
            <div className="product-image">
              <img src="/images/img-1.png" alt="Fresh Microgreens" />
            </div>
            <img src="/images/statsvertical.png" alt="Stats" className="stats-image stats-tab" />
          </div>
        </section>
      </div>

      {/* Banner */}
      <div className="banner-section">
        <img src="/images/bg-1.png" alt="Banner" />
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
            <img src="/images/sec-2.png" alt="Microgreens illustration" />
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
      <section className="why-section">
        <div className="why-inner">
          <div className="why-image">
            <img src="/images/why-choose-us.png" alt="Why Our Microgreens — grown fresh and harvested within 24 hours, 100% chemical free, delivered farm to door, up to 40x more nutrients" />
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="products-section" id="microgreens">
        <div className="products-inner">
          <p className="section-label">OUR VARIETIES</p>
          <h2 className="section-title">Microgreens We Grow</h2>
          <p className="section-subtitle">Each variety is grown in a dedicated batch, harvested at peak flavour, and packed the same day.</p>
          <div className="products-grid">
            {[
              { emoji: '🌻', bg: 'linear-gradient(135deg, #e8f5e0, #c8e6b0)', tag: 'BESTSELLER', name: 'Sunflower', taste: 'Nutty, mild, slightly sweet', desc: 'One of the most satisfying microgreens — thick stems with a satisfying crunch. Rich in Vitamin E, selenium, and healthy fats.', uses: ['Salads','Sandwiches','Wraps'] },
              { emoji: '🌶️', bg: 'linear-gradient(135deg, #fdecea, #f5c4c0)', tag: 'BOLD FLAVOUR', tagClass: 'product-tag--spicy', name: 'Radish', taste: 'Peppery, sharp, clean finish', desc: 'High in folate and Vitamin C. A punchy addition that elevates any dish with colour and character.', uses: ['Tacos','Garnish','Rice bowls'] },
              { emoji: '🫛', bg: 'linear-gradient(135deg, #e0f0e8, #b8dfc8)', tag: 'FAMILY FRIENDLY', tagClass: 'product-tag--mild', name: 'Pea Shoots', taste: 'Sweet, fresh, garden-like', desc: 'Delicate and versatile. High in Vitamins A, C, and folate. A gentle flavour that works well with almost any meal.', uses: ['Soups','Stir-fry','Dal'] },
              { emoji: '🥦', bg: 'linear-gradient(135deg, #e8f5e0, #a8d890)', tag: 'HIGH NUTRITION', name: 'Broccoli', taste: 'Mild, earthy, clean', desc: 'Among the most studied microgreens for sulforaphane content. An effortless way to add nutrition to smoothies and bowls.', uses: ['Smoothies','Bowls','Eggs'] },
              { emoji: '🌾', bg: 'linear-gradient(135deg, #fdf6e0, #f0e0a0)', tag: 'DETOX FAVOURITE', tagClass: 'product-tag--spicy', name: 'Wheatgrass', taste: 'Earthy, grassy, intense', desc: 'Traditionally consumed as a shot or in juices. Contains chlorophyll, iron, and enzymes that support digestion and energy.', uses: ['Juice shots','Smoothies','Detox drinks'] },
              { emoji: '🌿', bg: 'linear-gradient(135deg, #f0ede0, #d8c890)', tag: 'INDIAN KITCHEN', tagClass: 'product-tag--mild', name: 'Fenugreek', taste: 'Slightly bitter, aromatic', desc: 'A familiar flavour in Indian cooking. Supports blood sugar balance and digestion. Pairs naturally with traditional meals.', uses: ['Dal','Roti','Chutneys'] },
            ].map((p) => (
              <div className="product-card" key={p.name}>
                <div className="product-card-top" style={{ background: p.bg }}>
                  <span className="product-emoji">{p.emoji}</span>
                </div>
                <div className="product-card-body">
                  <div className={`product-tag ${p.tagClass || ''}`}>{p.tag}</div>
                  <h3>{p.name}</h3>
                  <p className="product-taste">Taste: {p.taste}</p>
                  <p className="product-desc">{p.desc}</p>
                  <div className="product-uses">
                    {p.uses.map((u) => <span key={u}>{u}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Standards */}
      <section className="process-section">
        <div className="process-inner">
          <div className="process-image">
            <img src="/images/our-standards.png" alt="Our Standards — What You Get: quality-checked seeds, clean soil-free growing, purified water, controlled conditions, hand-harvested at peak nutrition, delivered fresh" />
          </div>
        </div>
      </section>

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
      <section className="howitworks-section">
        <div className="process-inner">
          <div className="process-image">
            <img src="/images/how-it-works.png" alt="How It Works — choose your plan, we grow and harvest the morning of delivery, delivered fresh within hours, pause or modify anytime with 48 hours' notice" />
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="audience-section">
        <div className="audience-inner">
          <div className="audience-image">
            <img src="/images/who-we-serve.png" alt="Who We Serve — health-conscious individuals, fitness enthusiasts, families, working professionals, restaurants and cafes, wellness practitioners" />
          </div>
        </div>
      </section>

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
          <p className="cta-label">READY TO START?</p>
          <h2 className="cta-title">Your First Box,<br/>Harvested Tomorrow.</h2>
          <p className="cta-subtitle">Join 200+ households receiving fresh microgreens every week. No commitment required on your first order.</p>
          <div className="cta-buttons">
            <Link href="/subscription" className="btn-primary cta-primary-btn"><span>START A SUBSCRIPTION</span></Link>
            <Link href="/#microgreens" className="btn-cta-secondary"><span>SHOP SINGLE ORDER</span></Link>
          </div>
          <p className="cta-trust">✓ Harvested same day &nbsp;·&nbsp; ✓ Chemical-free &nbsp;·&nbsp; ✓ Sunday delivery, every week</p>
        </div>
      </section>

      <Footer />
      <HomeScripts />
    </>
  );
}
