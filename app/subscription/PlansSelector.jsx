'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const AUDIENCES = [
  { key: 'single', icon: '🧍', label: 'Single', sub: '1 Person' },
  { key: 'couple', icon: '👫', label: 'Couple', sub: '2 People' },
  { key: 'family', icon: '👨‍👩‍👧', label: 'Family', sub: '4 People' },
];

const DURATION_PERIOD = {
  monthly: '/mo',
  quarterly: '/3 mo',
  half_yearly: '/6 mo',
  yearly: '/yr',
};

function inr(n) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function PlansSelector({ plans }) {
  const [audience, setAudience] = useState('single');
  const router = useRouter();

  const filtered = useMemo(
    () => plans.filter((p) => p.audience === audience),
    [plans, audience]
  );

  function subscribe(planId) {
    router.push(`/checkout?plan=${planId}`);
  }

  return (
    <section className="plans-section">
      <div className="plans-inner">
        <div className="audience-tabs">
          {AUDIENCES.map((a) => (
            <button
              key={a.key}
              className={`audience-tab ${audience === a.key ? 'active' : ''}`}
              onClick={() => setAudience(a.key)}
            >
              <span className="tab-icon">{a.icon}</span>
              <span className="tab-label">{a.label}</span>
              <span className="tab-sub">{a.sub}</span>
            </button>
          ))}
        </div>

        <div className="plans-grid" id="plansGrid">
          {filtered.map((p) => {
            const isPopular = p.tag === 'POPULAR';
            const isBest = p.tag === 'BEST VALUE';
            return (
              <div
                key={p.id}
                className={`sub-plan-card ${isPopular ? 'sub-plan-card--featured' : ''}`}
              >
                {p.tag && (
                  <div className={`sub-plan-badge ${isBest ? 'sub-plan-badge--best' : ''}`}>
                    {p.tag}
                  </div>
                )}
                <p className="sub-plan-name">{p.name}</p>
                <div className="sub-plan-price">
                  <span className="sub-plan-amount">{inr(p.price_inr)}</span>
                  <span className="sub-plan-period">{DURATION_PERIOD[p.duration]}</span>
                </div>
                <p className="sub-plan-savings">
                  {p.savings_pct ? `SAVE ${p.savings_pct}% vs monthly` : ' '}
                </p>
                <div className="sub-plan-divider"></div>
                <ul className="sub-plan-perks">
                  <li><span className="check">✓</span> {p.deliveries} fresh deliveries</li>
                  <li><span className="check">✓</span> {p.audience === 'single' ? '4 varieties · 25g each' : p.audience === 'couple' ? '4 varieties · 50g each' : '4 varieties · 100g each'}</li>
                  <li><span className="check">✓</span> Curated weekly mix</li>
                  <li><span className="check">✓</span> Free home delivery</li>
                  <li><span className="check">✓</span> Skip or pause anytime (Mon–Fri)</li>
                </ul>
                <button className="btn-primary sub-plan-btn" onClick={() => subscribe(p.id)}>
                  <span>SUBSCRIBE NOW</span>
                </button>
              </div>
            );
          })}
        </div>

        <p className="plans-note">
          All plans include free Sunday home delivery and variety rotation. Pause anytime Mon–Fri before Friday midnight — paused deliveries are saved, not lost.
        </p>
      </div>
    </section>
  );
}
