// Rebuilt versions of the four previously image-based homepage sections.
// Live HTML/CSS so text stays crisp, responsive, and accessible on every display.

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const Icons = {
  sprout: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z" />
      <path d="M12 10c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z" />
    </svg>
  ),
  flask: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M10 3h4M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M8.5 15h7" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7z" />
      <path d="M3 8.5l9 4.5 9-4.5M12 13v7" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />
    </svg>
  ),
  seeds: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M4 14a8 8 0 0 0 16 0c0-2-1-3-2-3H6c-1 0-2 1-2 3z" />
      <circle cx="9" cy="7" r="1.3" /><circle cx="14" cy="5.5" r="1.3" /><circle cx="17" cy="8" r="1.3" />
    </svg>
  ),
  tray: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M3 14h18l-1.5 5h-15L3 14z" />
      <path d="M7 14v-2M12 14V9M17 14v-3M12 9c0-2.5-2-4.5-4.5-4.5C7.5 7 9.5 9 12 9zM12 11c0-2.5 2-4.5 4.5-4.5C16.5 9 14.5 11 12 11z" />
    </svg>
  ),
  droplet: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
    </svg>
  ),
  thermometer: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M10 4a2 2 0 0 1 4 0v9.5a4.5 4.5 0 1 1-4 0V4z" />
      <circle cx="12" cy="17.5" r="1.6" />
    </svg>
  ),
  scissors: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" />
      <path d="M8.2 7.5 20 18M8.2 16.5 20 6" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M2 7h11v9H2zM13 10h4l3 3v3h-7v-6z" />
      <circle cx="6.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6M14 9v6" />
    </svg>
  ),
  leafCheck: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M20 4C10 4 4 10 4 20c10 0 16-6 16-16z" />
      <path d="M4 20C9 15 13 11 17 7" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />
    </svg>
  ),
  dumbbell: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M7.5 9v6M16.5 9v6M4.5 10.5v3M19.5 10.5v3M7.5 12h9" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" /><circle cx="16.5" cy="9.5" r="2" />
      <path d="M3.5 20v-2a4.5 4.5 0 0 1 9 0v2M13.5 20v-1.5a3.5 3.5 0 0 1 6 0V20" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </svg>
  ),
  chef: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M7 13a4 4 0 1 1 1-7.9 4.5 4.5 0 0 1 8 0A4 4 0 1 1 17 13v5H7v-5z" />
      <path d="M7 18h10M10 13v2.5M14 13v2.5" />
    </svg>
  ),
  lotus: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M12 19c-3 0-8-2-8-7 2.5 0 4.5 1 5.5 2C9 11 10 7 12 5c2 2 3 6 2.5 9 1-1 3-2 5.5-2 0 5-5 7-8 7z" />
    </svg>
  ),
};

function SectionHeader({ label, title, highlight, subtitle, light }) {
  return (
    <header className={`ns-header${light ? ' ns-header--light' : ''}`} data-reveal>
      <p className="section-label">{label}</p>
      <h2 className="section-title">
        {title} {highlight && <em className="ns-highlight">{highlight}</em>}
      </h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </header>
  );
}

/* ── Why Choose Us ── */
const WHY_ITEMS = [
  { icon: 'sprout', title: 'Grown Fresh', text: 'Harvested within 24 hours of delivery so you get maximum nutrients every time.' },
  { icon: 'flask', title: '100% Chemical Free', text: 'No pesticides, no herbicides. Just clean water, quality seeds, and sunlight.' },
  { icon: 'box', title: 'Farm to Door', text: 'Delivered weekly straight from our farm to your doorstep — no middlemen.' },
  { icon: 'bolt', title: 'Up to 40x Nutrients', text: 'Microgreens pack up to 40x more nutrients than their full-grown counterparts.', badge: 'UP TO 40x' },
];

export function WhyChooseUs() {
  return (
    <section className="ns-section ns-why">
      <div className="ns-inner">
        <SectionHeader
          label="WHY CHOOSE US"
          title="Why Our"
          highlight="Microgreens?"
          subtitle="We grow with intention — no shortcuts, no chemicals, just pure nutrition delivered fresh to your door."
        />
        <div className="ns-why-grid" data-reveal-group>
          {WHY_ITEMS.map((item) => (
            <article className="ns-card ns-why-card" key={item.title} data-reveal>
              {item.badge && <span className="ns-badge-40x">{item.badge}<small>NUTRIENTS</small></span>}
              <span className="ns-icon">{Icons[item.icon]}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <p className="ns-strip" data-reveal>
          <span>🌱 Pure. Natural. Powerful.</span>
          <span className="ns-strip-divider" aria-hidden="true" />
          <span>Good for you. Good for the planet.</span>
        </p>
      </div>
    </section>
  );
}

/* ── Our Standards ── */
const STANDARDS = [
  { icon: 'seeds', title: 'Trusted From the Start', text: 'Every batch starts with seeds that pass our quality checks. Only the best make it to your plate.' },
  { icon: 'tray', title: 'Grown Clean', text: 'Our growing protocol keeps your greens safe and pure — no soil, no chemicals, no shortcuts.' },
  { icon: 'droplet', title: 'Pure & Safe Water', text: 'Purified water at every stage. Nothing your greens touch is untested.' },
  { icon: 'thermometer', title: 'Perfect Conditions, Every Time', text: 'We control what matters — light, airflow, temperature, and humidity — for consistency you can count on, 365 days a year.' },
  { icon: 'scissors', title: 'Peak Nutrition, Peak Flavor', text: 'Harvested by hand at peak nutrition using timing we’ve refined over hundreds of harvests.' },
  { icon: 'truck', title: 'Delivered Fresh', text: 'Harvested close to delivery and packed with care to lock in freshness. From our grow shelves to your door, fast.' },
];

const ASSURANCES = [
  ['100% Pesticide-Free', 'Because real food should be clean.'],
  ['Lab-Tested Assurance', 'Regular third-party testing for your peace of mind.'],
  ['Grown in Small Batches', 'More attention. Better taste. Consistently.'],
  ['Harvested Fresh, Delivered Fast', 'Always recent. Never old.'],
];

export function OurStandards() {
  return (
    <section className="ns-section ns-standards">
      <div className="ns-inner">
        <SectionHeader
          label="OUR STANDARDS"
          title="What You"
          highlight="Get"
          subtitle="We obsess over the details so you get microgreens that are fresher, cleaner, and more nutritious."
        />
        <ol className="ns-steps-grid" data-reveal-group>
          {STANDARDS.map((s, i) => (
            <li className="ns-step" key={s.title} data-reveal>
              <span className="ns-step-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="ns-icon ns-icon--lg">{Icons[s.icon]}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="ns-assurance" data-reveal>
          {ASSURANCES.map(([title, text]) => (
            <div className="ns-assurance-item" key={title}>
              <span className="ns-assurance-icon">{Icons.leafCheck}</span>
              <div><strong>{title}</strong><span>{text}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
const HOW_STEPS = [
  { icon: 'calendar', title: 'Choose Your Plan', text: 'Weekly or fortnightly delivery. Select from single-variety boxes or mixed variety packs based on your household size.' },
  { icon: 'tray', title: 'We Grow & Harvest', text: 'Your order is scheduled in our growing cycle. Microgreens are harvested the morning of your delivery date.' },
  { icon: 'truck', title: 'Delivered Fresh', text: 'Packed and dispatched within hours of harvest. Arrives at your door refrigerated and ready to use.' },
  { icon: 'pause', title: 'Pause or Modify Anytime', text: 'Travelling? Stocked up? Pause, reschedule, or change your variety selection with 48 hours’ notice.' },
];

export function HowItWorks() {
  return (
    <section className="ns-section ns-how">
      <div className="ns-inner">
        <SectionHeader
          label="HOW IT WORKS"
          title="Fresh Greens, On a Schedule"
          highlight="You Control"
          subtitle="No complicated setup. Choose your frequency, select your varieties, and we handle the rest."
        />
        <ol className="ns-how-grid" data-reveal-group>
          {HOW_STEPS.map((s, i) => (
            <li className="ns-how-step" key={s.title} data-reveal>
              <div className="ns-how-circle">
                <span className="ns-how-num">{i + 1}</span>
                <span className="ns-icon ns-icon--lg">{Icons[s.icon]}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Who We Serve ── */
const AUDIENCES = [
  { icon: 'heart', title: 'Health-Conscious Individuals', text: 'For those who read labels, cook intentionally, and want food that does more than just fill a plate.' },
  { icon: 'dumbbell', title: 'Fitness Enthusiasts', text: 'Clean fuel for training and recovery. No fillers, no processing — just dense plant nutrition.' },
  { icon: 'family', title: 'Families', text: 'Easy to add to everyday Indian meals. Safe, chemical-free, and gentle enough for children and elderly members.' },
  { icon: 'briefcase', title: 'Working Professionals', text: 'No prep, no washing complexity. Add to any meal in seconds. A genuinely convenient way to eat better.' },
  { icon: 'chef', title: 'Restaurants & Cafes', text: 'Bulk subscriptions available for commercial kitchens. Consistent quality, reliable delivery, and harvest-day freshness.' },
  { icon: 'lotus', title: 'Wellness Practitioners', text: 'Nutritionists, Ayurvedic practitioners, and wellness coaches recommend microgreens to clients seeking food-first health support.' },
];

export function WhoWeServe() {
  return (
    <section className="ns-section ns-serve">
      <div className="ns-inner">
        <SectionHeader
          label="WHO WE SERVE"
          title="Built for People Who Take"
          highlight="Food Seriously"
        />
        <div className="ns-serve-grid" data-reveal-group>
          {AUDIENCES.map((a) => (
            <article className="ns-card ns-serve-card" key={a.title} data-reveal>
              <span className="ns-icon">{Icons[a.icon]}</span>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </article>
          ))}
        </div>
        <p className="ns-strip" data-reveal>
          <span>🌱 Real People.</span>
          <span className="ns-strip-divider" aria-hidden="true" />
          <span>Real Food.</span>
          <span className="ns-strip-divider" aria-hidden="true" />
          <span>Real Impact.</span>
        </p>
      </div>
    </section>
  );
}
