'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReferralsTab from './ReferralsTab';
import DeliveriesTab from './DeliveriesTab';

// Editable sections — matches what page.jsx actually reads via t()
const SECTION_DEFS = [
  {
    id: 'hero',
    label: 'Hero',
    icon: '🏠',
    fields: [
      { key: 'label',         type: 'text',  hint: 'Small label above title (leave blank for №40 logo)' },
      { key: 'title',         type: 'text',  hint: 'Main heading — use | for line breaks' },
      { key: 'subtitle',      type: 'text',  hint: 'Paragraph under the heading — use | for line breaks' },
      { key: 'primary_cta',   type: 'text',  hint: 'Primary (green) button text' },
      { key: 'secondary_cta', type: 'text',  hint: 'Secondary (outline) button text' },
      { key: 'image',         type: 'image', hint: 'Hero product photo (right side)' },
    ],
    defaults: {
      label: '',
      title: 'Harvested Today.|On Your Plate|Tomorrow.',
      subtitle: 'Fresh, nutrient-dense microgreens grown with care|and delivered at peak freshness.',
      primary_cta: 'START A SUBSCRIPTION',
      secondary_cta: 'SHOP MICROGREENS',
      image: '/images/img-1.jpg',
    },
  },
  {
    id: 'varieties',
    label: 'Varieties Section',
    icon: '🌱',
    fields: [
      { key: 'label',    type: 'text', hint: 'Small label above title' },
      { key: 'title',    type: 'text', hint: 'Section heading' },
      { key: 'subtitle', type: 'text', hint: 'Description below heading' },
    ],
    defaults: {
      label: 'OUR VARIETIES',
      title: 'Microgreens We Grow',
      subtitle: 'Each variety is grown in a dedicated batch, harvested at peak flavour, and packed the same day.',
    },
  },
  {
    id: 'cta',
    label: 'Final CTA',
    icon: '📣',
    fields: [
      { key: 'label',    type: 'text', hint: 'Small label above title' },
      { key: 'title',    type: 'text', hint: 'CTA heading — use | for line breaks' },
      { key: 'subtitle', type: 'text', hint: 'Subtext under the heading' },
    ],
    defaults: {
      label: 'READY TO START?',
      title: 'Your First Box,|Harvested Tomorrow.',
      subtitle: 'Join 200+ households receiving fresh microgreens every week. No commitment required on your first order.',
    },
  },
];

// Non-editable sections shown in the page map for context
const STATIC_SECTIONS = [
  { id: 'banner',       label: 'Banner Image',        icon: '🖼️',  desc: 'Full-width banner photo — hardcoded' },
  { id: 'why_micro',    label: 'Why Microgreens?',    icon: '💡',  desc: '4-point benefits layout — hardcoded' },
  { id: 'why_choose',   label: 'Why Choose Us',       icon: '✅',  desc: '4 feature cards — hardcoded' },
  { id: 'our_standards',label: 'Our Standards',       icon: '🏅',  desc: '6-step standards grid — hardcoded' },
  { id: 'nutrition',    label: 'Nutritional Value',   icon: '🧬',  desc: 'Nutrition stats section — hardcoded' },
  { id: 'how_it_works', label: 'How It Works',        icon: '⚙️',  desc: '4-step process — hardcoded' },
  { id: 'who_we_serve', label: 'Who We Serve',        icon: '👥',  desc: '6 audience cards — hardcoded' },
  { id: 'testimonials', label: 'Customer Stories',    icon: '⭐',  desc: '4 testimonial cards — hardcoded' },
  { id: 'faq',          label: 'FAQ',                 icon: '❓',  desc: '7 questions — hardcoded' },
];

// Full page order for the visual map
const PAGE_MAP = [
  { type: 'editable', id: 'hero' },
  { type: 'static',   id: 'banner' },
  { type: 'static',   id: 'why_micro' },
  { type: 'static',   id: 'why_choose' },
  { type: 'editable', id: 'varieties' },
  { type: 'static',   id: 'our_standards' },
  { type: 'static',   id: 'nutrition' },
  { type: 'static',   id: 'how_it_works' },
  { type: 'static',   id: 'who_we_serve' },
  { type: 'static',   id: 'testimonials' },
  { type: 'static',   id: 'faq' },
  { type: 'editable', id: 'cta' },
];

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const STATUS_COLORS = {
  active:          { bg: '#e8f5e0', color: '#3d6b2e' },
  paused:          { bg: '#e8edf5', color: '#3a5080' },
  pending_payment: { bg: '#fff4e0', color: '#9a6200' },
  cancelled:       { bg: '#fdecea', color: '#b0281e' },
  expired:         { bg: '#f0f0f0', color: '#666' },
  paid:            { bg: '#e8f5e0', color: '#3d6b2e' },
  created:         { bg: '#fff4e0', color: '#9a6200' },
  failed:          { bg: '#fdecea', color: '#b0281e' },
  packed:          { bg: '#e8edf5', color: '#3a5080' },
  out_for_delivery:{ bg: '#fff4e0', color: '#9a6200' },
  delivered:       { bg: '#1a2e1a', color: '#c8e6b0' },
  missed:          { bg: '#fdecea', color: '#b0281e' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f0f0f0', color: '#555' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #e4e4dc',
  borderRadius: 10, fontSize: 14, background: '#fafaf7', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
};

// ── Helpers ──────────────────────────────────────────────────────────────
function getVal(content, section, key, defaults) {
  return content[`${section}.${key}`]?.value ?? defaults?.[key] ?? '';
}

function lines(text) {
  return String(text).split('|').map((p, i, arr) => (
    <span key={i}>{p}{i < arr.length - 1 ? <br /> : null}</span>
  ));
}

// ── Section Previews ─────────────────────────────────────────────────────
function HeroPreview({ content }) {
  const v = (k) => getVal(content, 'hero', k, SECTION_DEFS[0].defaults);
  const img = v('image');
  const title = v('title') || 'Harvested Today.|On Your Plate|Tomorrow.';
  const subtitle = v('subtitle') || 'Fresh, nutrient-dense microgreens grown with care|and delivered at peak freshness.';
  const cta1 = v('primary_cta') || 'START A SUBSCRIPTION';
  const cta2 = v('secondary_cta') || 'SHOP MICROGREENS';

  return (
    <div style={{ background: '#f7fbf3', borderRadius: 16, overflow: 'hidden', border: '1px solid #e0ead8' }}>
      <div style={{ background: '#4a7c59', display: 'flex', gap: 0, minHeight: 200 }}>
        {/* Left */}
        <div style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {v('label') ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c8d4a6', letterSpacing: 1 }}>{v('label')}</span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c8d4a6', letterSpacing: 1 }}>№40 TRAY <span style={{ fontSize: 9 }}>(logo)</span></span>
          )}
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{lines(title)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{lines(subtitle)}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <span style={{ background: '#7ab55c', color: '#fff', fontSize: 10, fontWeight: 700, padding: '6px 12px', borderRadius: 20 }}>{cta1}</span>
            <span style={{ border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '6px 12px', borderRadius: 20 }}>{cta2}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {['7–14 Days', 'Up To 40x', '100%', 'Farm Fresh'].map((s) => (
              <div key={s} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '4px 8px', fontSize: 9, color: '#c8d4a6', textAlign: 'center' }}>{s}</div>
            ))}
          </div>
        </div>
        {/* Right image */}
        <div style={{ width: 130, flexShrink: 0, overflow: 'hidden' }}>
          {img
            ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>No image</div>}
        </div>
      </div>
    </div>
  );
}

function VarietiesPreview({ content }) {
  const v = (k) => getVal(content, 'varieties', k, SECTION_DEFS[1].defaults);
  return (
    <div style={{ background: '#f7fbf3', borderRadius: 16, padding: '28px 24px', border: '1px solid #e0ead8' }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>{v('label') || 'OUR VARIETIES'}</p>
      <h3 style={{ margin: '0 0 8px', fontSize: 22, color: '#1a2e1a' }}>{v('title') || 'Microgreens We Grow'}</h3>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#5f6d5c', maxWidth: 500 }}>{v('subtitle') || 'Each variety is grown in a dedicated batch, harvested at peak flavour, and packed the same day.'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {[
          { emoji: '🌻', name: 'Sunflower', bg: '#e8f5e0' },
          { emoji: '🌶️', name: 'Radish',    bg: '#fdecea' },
          { emoji: '🫛', name: 'Pea',       bg: '#e0f0e8' },
          { emoji: '🥦', name: 'Broccoli',  bg: '#e8f5e0' },
          { emoji: '🌾', name: 'Wheat',     bg: '#fdf6e0' },
          { emoji: '🌿', name: 'Fenugreek', bg: '#f0ede0' },
        ].map((p) => (
          <div key={p.name} style={{ background: p.bg, borderRadius: 10, padding: '12px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>{p.emoji}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#333', marginTop: 4 }}>{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaPreview({ content }) {
  const v = (k) => getVal(content, 'cta', k, SECTION_DEFS[2].defaults);
  const title = v('title') || 'Your First Box,|Harvested Tomorrow.';
  return (
    <div style={{ background: '#1a2e1a', borderRadius: 16, padding: '32px 28px', textAlign: 'center', border: '1px solid #2a4a2a' }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>{v('label') || 'READY TO START?'}</p>
      <h3 style={{ margin: '0 0 10px', fontSize: 26, color: '#fff', lineHeight: 1.2 }}>{lines(title)}</h3>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>{v('subtitle') || 'Join 200+ households receiving fresh microgreens every week.'}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <span style={{ background: '#7ab55c', color: '#fff', fontSize: 11, fontWeight: 700, padding: '10px 20px', borderRadius: 24 }}>START A SUBSCRIPTION</span>
        <span style={{ border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '10px 20px', borderRadius: 24 }}>SHOP SINGLE ORDER</span>
      </div>
    </div>
  );
}

function StaticPreview({ section }) {
  const previews = {
    banner: (
      <div style={{ background: 'linear-gradient(135deg, #c8d4a6, #7ab55c)', borderRadius: 16, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#3a6347', fontWeight: 600, border: '1px solid #b0c890' }}>
        🖼️ Full-width Banner Image
      </div>
    ),
    why_micro: (
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>WHY MICROGREENS?</p>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#1a2e1a' }}>Tiny Greens. Powerful Nutrition.</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Nutrient-dense', 'Rich in vitamins', 'Easy to consume', 'Supports wellness'].map((t) => (
            <div key={t} style={{ flex: 1, background: '#f7fbf3', borderRadius: 8, padding: '8px 6px', fontSize: 9, color: '#555', textAlign: 'center', border: '1px solid #e0ead8' }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    why_choose: (
      <div style={{ background: '#f7fbf3', borderRadius: 16, padding: '20px 24px', border: '1px solid #e0ead8' }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>WHY CHOOSE US</p>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#1a2e1a' }}>Why Our <em>Microgreens?</em></h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Grown Fresh', '100% Chemical Free', 'Farm to Door', 'Up to 40x Nutrients'].map((t) => (
            <div key={t} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#333', border: '1px solid #eee' }}>✅ {t}</div>
          ))}
        </div>
      </div>
    ),
    our_standards: (
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>OUR STANDARDS</p>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#1a2e1a' }}>What You <em>Get</em></h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {['01 Trusted Seeds','02 Grown Clean','03 Pure Water','04 Perfect Conditions','05 Peak Nutrition','06 Delivered Fresh'].map((s) => (
            <div key={s} style={{ background: '#f7fbf3', borderRadius: 8, padding: '8px', fontSize: 9, color: '#555', fontWeight: 600 }}>{s}</div>
          ))}
        </div>
      </div>
    ),
    nutrition: (
      <div style={{ background: '#1a2e1a', borderRadius: 16, padding: '20px 24px', border: '1px solid #2a4a2a' }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>NUTRITIONAL VALUE</p>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#fff' }}>Small Portion. <br/>Significant Impact.</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[['40x','More nutrients'],['7–14','Days to harvest'],['6+','Vitamins/serving'],['0','Pesticides']].map(([n,l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#7ab55c' }}>{n}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    how_it_works: (
      <div style={{ background: '#f7fbf3', borderRadius: 16, padding: '20px 24px', border: '1px solid #e0ead8' }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>HOW IT WORKS</p>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#1a2e1a' }}>Fresh Greens, On a Schedule <em>You Control</em></h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['1','Choose Plan'],['2','We Grow'],['3','Delivered'],['4','Pause Anytime']].map(([n,l]) => (
            <div key={l} style={{ flex: 1, textAlign: 'center', background: '#fff', borderRadius: 10, padding: '10px 6px', border: '1px solid #eee' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4a7c59', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>{n}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#333' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    who_we_serve: (
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>WHO WE SERVE</p>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#1a2e1a' }}>Built for People Who Take <em>Food Seriously</em></h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {['Health Conscious','Fitness Enthusiasts','Families','Working Professionals','Restaurants','Wellness Practitioners'].map((a) => (
            <div key={a} style={{ background: '#f7fbf3', borderRadius: 8, padding: '8px', fontSize: 9, fontWeight: 600, color: '#555' }}>{a}</div>
          ))}
        </div>
      </div>
    ),
    testimonials: (
      <div style={{ background: '#f7fbf3', borderRadius: 16, padding: '20px 24px', border: '1px solid #e0ead8' }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>CUSTOMER STORIES</p>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#1a2e1a' }}>From Our Customers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['★★★★★ Priya S. — Bengaluru','★★★★★ Arjun Nair — Kochi','★★★★☆ Ravi M. — Chennai','★★★★★ Sudha R. — Hyderabad'].map((t) => (
            <div key={t} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', fontSize: 9, color: '#555', border: '1px solid #eee' }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    faq: (
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7ab55c', letterSpacing: 1 }}>COMMON QUESTIONS</p>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#1a2e1a' }}>Before You Order</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['How long do microgreens last?','How should I store them?','Which days do you deliver?','Can I pause my subscription?'].map((q) => (
            <div key={q} style={{ background: '#f7fbf3', borderRadius: 8, padding: '8px 12px', fontSize: 10, color: '#555', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              {q} <span style={{ color: '#aaa' }}>›</span>
            </div>
          ))}
        </div>
      </div>
    ),
  };
  return previews[section.id] || null;
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '22px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      borderLeft: `4px solid ${accent}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#1a2e1a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#999' }}>{sub}</div>}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ stats, subscriptions, orders }) {
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryUpdating, setDeliveryUpdating] = useState({});

  useEffect(() => {
    fetch('/api/admin/deliveries').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setDeliveries(d);
    });
    const t = setInterval(() => {
      fetch('/api/admin/deliveries').then((r) => r.json()).then((d) => {
        if (Array.isArray(d)) setDeliveries(d);
      });
    }, 30000);
    return () => clearInterval(t);
  }, []);

  async function markDelivery(id, status) {
    setDeliveryUpdating((p) => ({ ...p, [id]: true }));
    await fetch('/api/admin/deliveries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const res = await fetch('/api/admin/deliveries');
    const d = await res.json();
    if (Array.isArray(d)) setDeliveries(d);
    setDeliveryUpdating((p) => { const n = { ...p }; delete n[id]; return n; });
  }

  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const daysUntilSunday = (7 - new Date().getDay()) % 7 || 7;
  const nextSun = new Date();
  nextSun.setDate(nextSun.getDate() + daysUntilSunday);
  const nextSundayStr = nextSun.toLocaleDateString('en-CA');

  const activeSubs   = subscriptions.filter((s) => s.status === 'active').length;
  const pausedSubs   = subscriptions.filter((s) => s.status === 'paused').length;
  const totalRevenue = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + Number(o.amount_inr || 0), 0);
  const pendingPayments = orders.filter((o) => o.status === 'created').length;

  // This Sunday deliveries from subscriptions
  const thisSundayDeliveries = deliveries.filter((d) => d.scheduled_date === nextSundayStr);
  const upcomingDeliveries   = deliveries.filter((d) => d.scheduled_date > nextSundayStr && d.status === 'scheduled').slice(0, 6);

  const sundayDateLabel = new Date(nextSundayStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  function packBadge(audience) {
    const map = { single: '#eef5e6', couple: '#e8f0ff', family: '#fff4e6' };
    const col = { single: '#3d6b2e', couple: '#2e4a8a', family: '#8a5a2e' };
    return { bg: map[audience] || '#f5f5f0', color: col[audience] || '#555' };
  }

  const recentOrders = orders.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="Active Subscribers" value={activeSubs} sub="Paying now" accent="#4a7c59" icon="🌱" />
        <StatCard label="Paused" value={pausedSubs} sub="Will resume" accent="#5c7aaa" icon="⏸️" />
        <StatCard label="This Sunday" value={thisSundayDeliveries.length} sub={fmtDateShort(nextSundayStr)} accent="#f0a500" icon="📦" />
        <StatCard label="Total Revenue" value={inr(totalRevenue)} sub="Paid orders" accent="#7ab55c" icon="💰" />
        <StatCard label="Pending Payment" value={pendingPayments} sub="Awaiting payment" accent="#e07b39" icon="⏳" />
      </div>

      {/* ── This Sunday section ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
        <div style={{ background: '#1a2e1a', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c8e6b0', textTransform: 'uppercase', letterSpacing: 1 }}>📦 This Sunday</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 2 }}>{sundayDateLabel}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 800, fontSize: 20 }}>
            {thisSundayDeliveries.length} <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>boxes</span>
          </div>
        </div>

        {thisSundayDeliveries.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
            📭 No deliveries scheduled for this Sunday.
          </div>
        ) : (
          <div>
            {thisSundayDeliveries.map((d, i) => {
              const sub  = d.subscriptions;
              const addr = sub?.addresses;
              const plan = sub?.plans;
              const name = addr?.full_name || sub?.profiles?.full_name || '—';
              const phone = addr?.phone || '—';
              const { bg, color } = packBadge(plan?.audience);
              const isDone = d.status === 'delivered';
              const busy   = deliveryUpdating[d.id];
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', background: i % 2 === 0 ? '#fff' : '#fafaf7', borderBottom: '1px solid #f0f0ea', flexWrap: 'wrap' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a' }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>📞 {phone}{addr?.city ? ` · ${addr.city}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: bg, color, padding: '3px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>
                    {plan?.audience?.toUpperCase()}
                  </span>
                  {isDone ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a7c3a' }}>✅ Delivered</span>
                  ) : (
                    <button
                      onClick={() => markDelivery(d.id, 'delivered')}
                      disabled={busy}
                      style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #4a7c59', background: '#fff', color: '#4a7c59', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {busy ? '…' : '✓ Mark Delivered'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom 2-col: Upcoming deliveries + Recent orders ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

        {/* Upcoming deliveries */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1a2e1a' }}>📅 Upcoming Deliveries</h3>
            <span style={{ fontSize: 11, color: '#aaa' }}>After this Sunday</span>
          </div>
          {upcomingDeliveries.length === 0 ? (
            <div style={{ padding: '24px 18px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>No upcoming deliveries.</div>
          ) : (
            upcomingDeliveries.map((d, i) => {
              const sub  = d.subscriptions;
              const addr = sub?.addresses;
              const name = addr?.full_name || sub?.profiles?.full_name || '—';
              const { bg, color } = packBadge(sub?.plans?.audience);
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: i < upcomingDeliveries.length - 1 ? '1px solid #f5f5f0' : 'none', fontSize: 13 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a7c59', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1a2e1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{sub?.plans?.name}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#f0f7ea', color: '#3a6b28', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                    {fmtDateShort(d.scheduled_date)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Recent orders */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0ea' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1a2e1a' }}>💳 Recent Orders</h3>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ padding: '24px 18px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>No orders yet.</div>
          ) : (
            recentOrders.map((o, i) => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '11px 18px', borderBottom: i < recentOrders.length - 1 ? '1px solid #f5f5f0' : 'none', fontSize: 13, gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1a2e1a' }}>{o.profiles?.full_name || '—'}</div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 1 }}>✉ {o.profiles?.email || '—'}</div>
                  <div style={{ color: '#aaa', fontSize: 11, marginTop: 1 }}>{fmtDate(o.created_at)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: '#4a7c59' }}>{inr(o.amount_inr)}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subscribers Tab ───────────────────────────────────────────────────────
function SubscribersTab({ subscriptions }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => subscriptions.filter((s) => {
    const matchStatus = filter === 'all' || s.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || s.profiles?.email?.toLowerCase().includes(q) || s.profiles?.full_name?.toLowerCase().includes(q) || s.plans?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [subscriptions, filter, search]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...inputStyle, width: 240, padding: '9px 14px' }} placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {['all','active','paused','pending_payment','cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: filter === s ? '#4a7c59' : '#f0f0ea', color: filter === s ? '#fff' : '#555' }}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#999' }}>{filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f9f6' }}>
              {['Customer','Plan','Audience','Status','Next Delivery','Started','Price'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#bbb', fontSize: 14 }}>No subscribers match this filter.</td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                <td data-label="Customer" style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#222' }}>{s.profiles?.full_name || '—'}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{s.profiles?.email}</div>
                </td>
                <td data-label="Plan" style={{ padding: '12px 14px', color: '#444' }}>{s.plans?.name || '—'}</td>
                <td data-label="Audience" style={{ padding: '12px 14px', textTransform: 'capitalize', color: '#666' }}>{s.plans?.audience || '—'}</td>
                <td data-label="Status" style={{ padding: '12px 14px' }}><StatusBadge status={s.status} /></td>
                <td data-label="Next Delivery" style={{ padding: '12px 14px', color: s.status === 'paused' ? '#aaa' : '#444', whiteSpace: 'nowrap' }}>{s.status === 'paused' ? <em>Paused</em> : fmtDate(s.next_delivery_date)}</td>
                <td data-label="Started" style={{ padding: '12px 14px', color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(s.start_date)}</td>
                <td data-label="Price" style={{ padding: '12px 14px', fontWeight: 700, color: '#4a7c59' }}>{inr(s.plans?.price_inr || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────
function OrdersTab({ orders, setOrders, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.profiles?.email?.toLowerCase().includes(q) ||
        o.profiles?.full_name?.toLowerCase().includes(q) ||
        o.razorpay_order_id?.toLowerCase().includes(q) ||
        o.razorpay_payment_id?.toLowerCase().includes(q) ||
        (Array.isArray(o.items) && o.items.some((it) => it.name?.toLowerCase().includes(q)))
      );
    });
  }, [orders, filter, search]);
  const totalPaid = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + Number(o.amount_inr || 0), 0);

  async function setStatus(o, status, okText) {
    const prev = o.status;
    setOrders((all) => all.map((x) => x.id === o.id ? { ...x, status } : x));
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: o.id, status }),
    });
    if (!res.ok) {
      setOrders((all) => all.map((x) => x.id === o.id ? { ...x, status: prev } : x));
      setMsg({ type: 'error', text: 'Failed to update order.' });
    } else {
      setMsg({ type: 'ok', text: okText });
      onRefresh();
    }
    setTimeout(() => setMsg(null), 3000);
  }

  function cancelOrder(o) { setStatus(o, 'cancelled', 'Order cancelled.'); }

  // Delivery pipeline: paid → packed → out_for_delivery → delivered
  const NEXT_STEP = {
    paid:             { status: 'packed',           label: '📦 Mark Packed' },
    packed:           { status: 'out_for_delivery', label: '🛵 Out for Delivery' },
    out_for_delivery: { status: 'delivered',        label: '✅ Mark Delivered' },
  };

  async function deleteOrder(id) {
    setOrders((all) => all.filter((x) => x.id !== id));
    setConfirmDelete(null);
    const res = await fetch('/api/admin/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      setMsg({ type: 'error', text: 'Failed to delete order.' });
    } else {
      setMsg({ type: 'ok', text: 'Order deleted.' });
      onRefresh();
    }
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div>
      {msg && (
        <div style={{ marginBottom: 14, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: msg.type === 'ok' ? '#eef5e6' : '#fdecea', color: msg.type === 'ok' ? '#3d6b3d' : '#b0281e' }}>
          {msg.type === 'ok' ? '✅' : '⚠'} {msg.text}
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', maxWidth: 360, width: '90%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#222' }}>Delete this order?</h3>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: '#777' }}>This will permanently remove the order record. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f0', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555' }}>Cancel</button>
              <button onClick={() => deleteOrder(confirmDelete)} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#c0392b', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, width: 220, padding: '9px 14px' }}
          placeholder="Search name, email, item, Razorpay ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {['all','paid','packed','out_for_delivery','delivered','missed','created','failed','cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: filter === s ? '#4a7c59' : '#f0f0ea', color: filter === s ? '#fff' : '#555' }}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#999' }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Total paid: <strong style={{ color: '#4a7c59' }}>{inr(totalPaid)}</strong>
        </span>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f9f6' }}>
              {['Date','Customer','Amount / Items','Status','Razorpay Order ID','Paid At','Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#bbb', fontSize: 14 }}>No orders.</td></tr>
            ) : filtered.map((o, i) => (
              <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                <td data-label="Date" style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#666' }}>{fmtDate(o.created_at)}</td>
                <td data-label="Customer" style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#222' }}>{o.profiles?.full_name || '—'}</div>
                  <div style={{ color: '#999', fontSize: 11 }}>{o.profiles?.email || ''}</div>
                </td>
                <td data-label="Amount" style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, color: '#222' }}>{inr(o.amount_inr)}</div>
                  {Array.isArray(o.items) && o.items.length > 0 ? (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#888', lineHeight: 1.4 }}>
                      {o.items.map((it, j) => (
                        <div key={j}>🌿 {it.name}{it.pack ? ` · ${it.pack}` : ''} × {it.qty}</div>
                      ))}
                    </div>
                  ) : o.subscription_id ? (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#aaa' }}>Subscription</div>
                  ) : null}
                </td>
                <td data-label="Status" style={{ padding: '12px 14px' }}><StatusBadge status={o.status} /></td>
                <td data-label="Razorpay ID" style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{o.razorpay_order_id || '—'}</td>
                <td data-label="Paid At" style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#888' }}>{o.paid_at ? fmtDate(o.paid_at) : '—'}</td>
                <td data-label="Actions" style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {NEXT_STEP[o.status] && (
                      <button
                        onClick={() => setStatus(o, NEXT_STEP[o.status].status, `Order moved to ${NEXT_STEP[o.status].status.replace(/_/g, ' ')}.`)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#4a7c59', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {NEXT_STEP[o.status].label}
                      </button>
                    )}
                    {o.status === 'out_for_delivery' && (
                      <button
                        onClick={() => setStatus(o, 'missed', 'Marked as missed — customer not home.')}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #b0281e', background: '#fff5f5', color: '#b0281e', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        title="Customer not home / delivery failed"
                      >
                        ✗ Missed
                      </button>
                    )}
                    {o.status !== 'cancelled' && o.status !== 'paid' && o.status !== 'delivered' && !NEXT_STEP[o.status] && (
                      <button
                        onClick={() => cancelOrder(o)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e07b39', background: '#fff8f3', color: '#e07b39', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(o.id)}
                      style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e0392b', background: '#fff5f5', color: '#c0392b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// All page sections in order — editable ones link to a SECTION_DEF
const ALL_SECTIONS = [
  { num: 1,  domId: 's-hero',         label: 'Hero',           icon: '🏠', defId: 'hero' },
  { num: 2,  domId: 's-banner',        label: 'Banner',         icon: '🖼️', defId: null },
  { num: 3,  domId: 's-why-micro',     label: 'Why Microgreens',icon: '💡', defId: null },
  { num: 4,  domId: 's-why-choose',    label: 'Why Choose Us',  icon: '✅', defId: null },
  { num: 5,  domId: 's-varieties',     label: 'Varieties',      icon: '🌱', defId: 'varieties' },
  { num: 6,  domId: 's-standards',     label: 'Our Standards',  icon: '🏅', defId: null },
  { num: 7,  domId: 's-nutrition',     label: 'Nutrition',      icon: '🧬', defId: null },
  { num: 8,  domId: 's-how-it-works',  label: 'How It Works',   icon: '⚙️', defId: null },
  { num: 9,  domId: 's-who-we-serve',  label: 'Who We Serve',   icon: '👥', defId: null },
  { num: 10, domId: 's-testimonials',  label: 'Testimonials',   icon: '⭐', defId: null },
  { num: 11, domId: 's-faq',           label: 'FAQ',            icon: '❓', defId: null },
  { num: 12, domId: 's-cta',           label: 'Final CTA',      icon: '📣', defId: 'cta' },
];

// ── Content Tab — iframe page editor ─────────────────────────────────────
function ContentTab({ content, setContent, dirty, setDirty, busy, setBusy, setMsg }) {
  const [selected, setSelected] = useState(ALL_SECTIONS[0]);
  const iframeRef = useRef(null);
  const iframeReady = useRef(false);

  const selectedDef = selected.defId ? SECTION_DEFS.find((s) => s.id === selected.defId) : null;

  // Scroll iframe to the section when ready / when selection changes
  const scrollToSection = useCallback((domId) => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;
      const el = iframe.contentDocument.getElementById(domId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
  }, []);

  function handleIframeLoad() {
    iframeReady.current = true;
    scrollToSection(selected.domId);
  }

  function selectSection(sec) {
    setSelected(sec);
    scrollToSection(sec.domId);
  }

  function setValue(sec, key, value, type) {
    setContent((c) => ({ ...c, [`${sec}.${key}`]: { value, type } }));
    setDirty((d) => ({ ...d, [`${sec}.${key}`]: { section: sec, key, value, type } }));
  }

  async function uploadImage(sec, key, file) {
    if (!file) return;
    setBusy(true); setMsg(null);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Upload failed' });
    setValue(sec, key, data.url, 'image');
    setMsg({ type: 'ok', text: 'Image uploaded — click Save changes to apply it.' });
  }

  return (
    <div className="admin-content-tab">

      {/* Top: numbered section chips */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', marginRight: 6 }}>Sections:</span>
        {ALL_SECTIONS.map((sec) => {
          const isActive = selected.num === sec.num;
          return (
            <button
              key={sec.num}
              onClick={() => selectSection(sec)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700,
                background: isActive ? '#4a7c59' : sec.defId ? '#eef5e6' : '#f4f4f0',
                color: isActive ? '#fff' : sec.defId ? '#3d5a45' : '#888',
                outline: isActive ? '2px solid #4a7c59' : 'none',
                outlineOffset: 2,
                transition: 'all 0.15s',
              }}>
              <span style={{ background: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.08)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{sec.num}</span>
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
              {sec.defId && <span style={{ fontSize: 9, opacity: 0.7 }}>✏️</span>}
            </button>
          );
        })}
      </div>

      {/* Body: iframe left + edit panel right (stacked on mobile) */}
      <div className="admin-content-body">

        {/* Left: live site iframe */}
        <div className="admin-content-preview">
          {/* Section highlight label overlay */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: '#1a2e1a', color: '#c8e6b0', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{selected.icon}</span>
            <span>Section {selected.num}: {selected.label}</span>
            {selected.defId
              ? <span style={{ background: '#7ab55c', color: '#fff', fontSize: 9, padding: '1px 6px', borderRadius: 10 }}>EDITABLE</span>
              : <span style={{ background: 'rgba(255,255,255,0.15)', fontSize: 9, padding: '1px 6px', borderRadius: 10 }}>VIEW ONLY</span>}
          </div>
          <iframe
            ref={iframeRef}
            src="/"
            onLoad={handleIframeLoad}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title="Site Preview"
          />
        </div>

        {/* Right: edit panel */}
        <div className="admin-content-panel">
          {selectedDef ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{selected.icon}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a2e1a' }}>Section {selected.num}: {selected.label}</h2>
                    <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>Changes preview live on the site after saving.</p>
                  </div>
                </div>
              </div>

              {selectedDef.fields.map((f) => {
                const cur = content[`${selected.defId}.${f.key}`];
                const val = cur?.value ?? '';
                const isDirty = Boolean(dirty[`${selected.defId}.${f.key}`]);
                return (
                  <div key={f.key} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      {f.key.replace(/_/g, ' ')}
                      {isDirty && <span style={{ background: '#e07b39', color: '#fff', fontSize: 9, padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>UNSAVED</span>}
                    </label>
                    {f.hint && <p style={{ margin: '0 0 6px', fontSize: 11, color: '#aaa' }}>{f.hint}</p>}
                    {selectedDef.defaults?.[f.key] && f.type !== 'image' && (
                      <p style={{ margin: '0 0 6px', fontSize: 11, color: '#bbb' }}>Default: <em style={{ color: '#999' }}>{selectedDef.defaults[f.key]}</em></p>
                    )}

                    {f.type === 'image' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input style={inputStyle} value={val} placeholder="Image URL (or upload below)"
                          onChange={(e) => setValue(selected.defId, f.key, e.target.value, 'image')} />
                        {val && <img src={val} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #eee' }} />}
                        <label style={{ background: '#7ab55c', color: '#fff', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                          📁 UPLOAD IMAGE
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={(e) => uploadImage(selected.defId, f.key, e.target.files?.[0])} />
                        </label>
                      </div>
                    ) : (f.key === 'subtitle' || f.key === 'title') ? (
                      <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                        value={val}
                        placeholder={selectedDef.defaults?.[f.key] || ''}
                        onChange={(e) => setValue(selected.defId, f.key, e.target.value, f.type)} />
                    ) : (
                      <input style={inputStyle} value={val}
                        placeholder={selectedDef.defaults?.[f.key] || ''}
                        onChange={(e) => setValue(selected.defId, f.key, e.target.value, f.type)} />
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{selected.icon}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#333' }}>Section {selected.num}: {selected.label}</h3>
              <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                This section is hardcoded in the source — its text and layout are fixed and cannot be changed from the admin panel.
              </p>
              <div style={{ background: '#f4f4f0', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#888', textAlign: 'left' }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>To edit this section:</strong>
                Edit the source file <code style={{ background: '#e8e8e4', padding: '1px 5px', borderRadius: 4 }}>app/page.jsx</code> or the relevant component in <code style={{ background: '#e8e8e4', padding: '1px 5px', borderRadius: 4 }}>app/HomeSections.jsx</code>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Plans Tab ─────────────────────────────────────────────────────────────
function PlansTab({ plans, setPlans, busy, setBusy, setMsg }) {
  async function savePlan(plan) {
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Save failed' });
    setMsg({ type: 'ok', text: `Plan "${plan.name}" saved.` });
  }

  const grouped = useMemo(() => {
    const g = { single: [], couple: [], family: [] };
    plans.forEach((p) => { if (g[p.audience]) g[p.audience].push(p); });
    return g;
  }, [plans]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#999' }}>Live plans shown on the subscription page. Edits apply immediately after saving each row.</p>
      {Object.entries(grouped).map(([audience, audiencePlans]) => (
        <div key={audience}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#4a7c59' }}>
            {audience === 'single' ? '🧍 Single' : audience === 'couple' ? '👫 Couple' : '👨‍👩‍👧 Family'}
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9f9f6' }}>
                  {['Name','Price (₹)','Deliveries','Serving label','Varieties label','Save %','Tag','Active',''].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audiencePlans.map((p) => {
                  const i = plans.findIndex((x) => x.id === p.id);
                  return (
                    <tr key={p.id}>
                      {[['name','Name',140],['price_inr','Price',80],['deliveries','Deliveries',70],['serving_label','Serving',170],['varieties_label','Varieties',170],['savings_pct','Save %',55],['tag','Tag',90]].map(([k, label, w]) => (
                        <td key={k} data-label={label} style={{ padding: '8px 6px' }}>
                          <input style={{ ...inputStyle, padding: '8px 10px', width: w, maxWidth: '100%' }}
                            value={plans[i]?.[k] ?? ''}
                            onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} />
                        </td>
                      ))}
                      <td data-label="Active" style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input type="checkbox" checked={Boolean(plans[i]?.is_active)}
                          onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, is_active: e.target.checked } : x))} />
                      </td>
                      <td data-label="" style={{ padding: '8px 10px' }}>
                        <button onClick={() => savePlan(plans[i])} disabled={busy}
                          style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          SAVE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pincodes Tab ──────────────────────────────────────────────────────────
function PincodesTab({ pincodes, setPincodes, busy, setBusy, setMsg }) {
  const [newPin, setNewPin] = useState({ pincode: '', city: '', state: 'Andhra Pradesh' });

  async function addPincode() {
    if (!/^\d{6}$/.test(newPin.pincode) || !newPin.city) return setMsg({ type: 'error', text: 'Enter a 6-digit pincode and a city.' });
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/pincodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', ...newPin }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Failed' });
    setPincodes((p) => [...p.filter((x) => x.pincode !== newPin.pincode), data.row].sort((a, b) => a.pincode.localeCompare(b.pincode)));
    setNewPin({ pincode: '', city: '', state: newPin.state });
    setMsg({ type: 'ok', text: 'Pincode added.' });
  }

  async function togglePincode(row) {
    setBusy(true);
    const res = await fetch('/api/admin/pincodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', pincode: row.pincode, is_active: !row.is_active }) });
    setBusy(false);
    if (res.ok) setPincodes((p) => p.map((x) => x.pincode === row.pincode ? { ...x, is_active: !row.is_active } : x));
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#999' }}>
        Customers can only order if their pincode is active here. {pincodes.filter(p => p.is_active).length} active · {pincodes.filter(p => !p.is_active).length} disabled.
      </p>
      <div style={{ background: '#f9f9f6', borderRadius: 14, padding: 18, marginBottom: 24, border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Add Pincode</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...inputStyle, width: 110 }} placeholder="Pincode" maxLength={6} value={newPin.pincode} onChange={(e) => setNewPin((n) => ({ ...n, pincode: e.target.value.replace(/\D/g, '') }))} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="City" value={newPin.city} onChange={(e) => setNewPin((n) => ({ ...n, city: e.target.value }))} />
          <input style={{ ...inputStyle, width: 160 }} placeholder="State" value={newPin.state} onChange={(e) => setNewPin((n) => ({ ...n, state: e.target.value }))} />
          <button onClick={addPincode} disabled={busy} style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>ADD</button>
        </div>
      </div>
      <div style={{ borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
        {pincodes.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 13 }}>No pincodes yet.</p>}
        {pincodes.map((row, i) => (
          <div key={row.pincode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', fontSize: 14, background: i % 2 === 0 ? '#fff' : '#fafaf7', borderBottom: i < pincodes.length - 1 ? '1px solid #f0f0ea' : 'none' }}>
            <span>
              <strong style={{ fontFamily: 'monospace', fontSize: 15 }}>{row.pincode}</strong>
              <span style={{ color: '#888', marginLeft: 12 }}>{row.city}, {row.state}</span>
            </span>
            <button onClick={() => togglePincode(row)} disabled={busy}
              style={{ border: 'none', borderRadius: 20, padding: '6px 14px', fontWeight: 700, fontSize: 11, cursor: 'pointer', background: row.is_active ? '#e8f5e0' : '#fdecea', color: row.is_active ? '#3d6b2e' : '#b0281e' }}>
              {row.is_active ? '✓ Active' : '✗ Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Varieties Tab ─────────────────────────────────────────────────────────
const FAMILY_COLORS = {
  Asteraceae:    { bg: '#fdf6e0', color: '#7a5c00' },
  Brassicaceae:  { bg: '#e8f5e0', color: '#3d6b2e' },
  Fabaceae:      { bg: '#e0f0e8', color: '#1e5e44' },
  Poaceae:       { bg: '#f0ede0', color: '#6b5a2e' },
  Amaranthaceae: { bg: '#fde8f5', color: '#7a2e60' },
  Apiaceae:      { bg: '#e8edf5', color: '#2e4a80' },
  Lamiaceae:     { bg: '#f5e8f0', color: '#6b2e5a' },
  Polygonaceae:  { bg: '#fdecea', color: '#8b2020' },
  Tropaeolaceae: { bg: '#fff4e0', color: '#8b5e00' },
  Amaryllidaceae:{ bg: '#e8f0f5', color: '#2e5a70' },
  Mixed:         { bg: '#f0f0f0', color: '#555' },
};

function VarietiesTab() {
  const [varieties, setVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [showOnlyHome, setShowOnlyHome] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [newV, setNewV] = useState({ name: '', family: '', taste: '', description: '', price_100g: 249, price_200g: 449, price_500g: 999 });
  const [editingPrices, setEditingPrices] = useState({}); // { id: { price_100g, price_200g, price_500g } }
  const [editingFields, setEditingFields] = useState({}); // { id: { name, family, taste, ... } }
  const [savingFields, setSavingFields] = useState(null);

  useEffect(() => {
    fetch('/api/admin/microgreens')
      .then((r) => r.json())
      .then((d) => { setVarieties(d.varieties || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const families = useMemo(() => {
    const s = new Set(varieties.map((v) => v.family).filter(Boolean));
    return ['all', ...Array.from(s).sort()];
  }, [varieties]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return varieties.filter((v) => {
      const matchSearch = !q || v.name.toLowerCase().includes(q) || v.family?.toLowerCase().includes(q) || v.taste?.toLowerCase().includes(q);
      const matchFamily = familyFilter === 'all' || v.family === familyFilter;
      const matchHome = !showOnlyHome || v.show_on_home;
      return matchSearch && matchFamily && matchHome;
    });
  }, [varieties, search, familyFilter, showOnlyHome]);

  const visibleOnHome = varieties.filter((v) => v.show_on_home).length;

  async function patch(id, updates) {
    const res = await fetch('/api/admin/microgreens', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) {
      const d = await res.json();
      setMsg({ type: 'error', text: d.error || 'Update failed' });
      return false;
    }
    return true;
  }

  async function toggleHome(v) {
    const next = !v.show_on_home;
    setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, show_on_home: next } : x));
    const ok = await patch(v.id, { show_on_home: next });
    if (!ok) setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, show_on_home: v.show_on_home } : x));
    else setMsg({ type: 'ok', text: `${v.name} ${next ? 'added to catalog ✅' : 'removed from catalog'}.` });
  }

  async function toggleFeatured(v) {
    const next = !v.featured_home;
    setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, featured_home: next } : x));
    const ok = await patch(v.id, { featured_home: next });
    if (!ok) setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, featured_home: v.featured_home } : x));
    else setMsg({ type: 'ok', text: `${v.name} ${next ? 'now showing on the homepage ✅' : 'removed from the homepage'}.` });
  }

  async function toggleOos(v) {
    const next = !v.out_of_stock;
    setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, out_of_stock: next } : x));
    const ok = await patch(v.id, { out_of_stock: next });
    if (!ok) setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, out_of_stock: v.out_of_stock } : x));
    else setMsg({ type: 'ok', text: `${v.name} marked as ${next ? 'out of stock ✗' : 'in stock ✅'}.` });
  }

  async function uploadImage(v, file) {
    if (!file) return;
    setUploading(v.id);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    setUploading(null);
    if (!res.ok) { setMsg({ type: 'error', text: data.error || 'Upload failed' }); return; }
    const ok = await patch(v.id, { image_url: data.url });
    if (ok) {
      setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, image_url: data.url } : x));
      setMsg({ type: 'ok', text: `Image uploaded for ${v.name}.` });
    }
  }

  async function addVariety() {
    if (!newV.name.trim()) return;
    setAddBusy(true);
    const res = await fetch('/api/admin/microgreens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newV),
    });
    const data = await res.json();
    setAddBusy(false);
    if (!res.ok) { setMsg({ type: 'error', text: data.error || 'Failed to add variety' }); return; }
    setVarieties((prev) => [...prev, data.variety]);
    setNewV({ name: '', family: '', taste: '', description: '', price_100g: 249, price_200g: 449, price_500g: 999 });
    setShowAddForm(false);
    setMsg({ type: 'ok', text: `${data.variety.name} added! Upload an image and enable it in the catalog.` });
  }

  async function savePrices(v) {
    const ep = editingPrices[v.id];
    if (!ep) return;
    const ok = await patch(v.id, { price_100g: Number(ep.price_100g), price_200g: Number(ep.price_200g), price_500g: Number(ep.price_500g) });
    if (ok) {
      setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, ...ep } : x));
      setEditingPrices((prev) => { const n = { ...prev }; delete n[v.id]; return n; });
      setMsg({ type: 'ok', text: `Prices updated for ${v.name}.` });
    }
  }

  async function saveFields(v) {
    const ef = editingFields[v.id];
    if (!ef) return;
    setSavingFields(v.id);
    const ok = await patch(v.id, ef);
    setSavingFields(null);
    if (ok) {
      setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, ...ef } : x));
      setEditingFields((prev) => { const n = { ...prev }; delete n[v.id]; return n; });
      setMsg({ type: 'ok', text: `${ef.name || v.name} updated.` });
    }
  }

  const [confirmDelete, setConfirmDelete] = useState(null);

  async function deleteVariety(id) {
    setConfirmDelete(null);
    const res = await fetch('/api/admin/microgreens', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const d = await res.json();
      setMsg({ type: 'error', text: d.error || 'Delete failed' });
      return;
    }
    setVarieties((prev) => prev.filter((x) => x.id !== id));
    setMsg({ type: 'ok', text: 'Variety removed.' });
  }

  function startEditing(v) {
    setEditingFields((prev) => ({
      ...prev,
      [v.id]: { name: v.name || '', family: v.family || '', taste: v.taste || '', description: v.description || '', benefits: v.benefits || '', grow_time: v.grow_time || '', daily_intake: v.daily_intake || '', tag: v.tag || '' },
    }));
    setExpandedId(v.id);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>Loading varieties…</div>;

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ background: '#eef5e6', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#3d6b2e' }}>
          🌱 {varieties.length} varieties in catalog
        </div>
        <div style={{ background: '#fff4e0', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#9a6200' }}>
          ✅ {visibleOnHome} showing in catalog
        </div>
        <div style={{ background: '#fdecea', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#b0281e' }}>
          ✗ {varieties.filter((v) => v.out_of_stock).length} out of stock
        </div>
        <div style={{ background: '#e8edf5', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#3a5080' }}>
          🏠 {varieties.filter((v) => v.featured_home).length} on homepage
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{ marginLeft: 'auto', background: '#1a2e1a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3 }}
        >
          + Add Variety
        </button>
        {msg && (
          <div style={{ flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: msg.type === 'error' ? '#fdecea' : '#eef7e8', color: msg.type === 'error' ? '#b0281e' : '#3d6b2e', border: `1px solid ${msg.type === 'error' ? '#f5c6c3' : '#c3e6b0'}` }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Add Variety Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#1a2e1a' }}>Add New Variety</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Name *', key: 'name', placeholder: 'e.g. Basil' },
                { label: 'Family', key: 'family', placeholder: 'e.g. Herb' },
                { label: 'Taste', key: 'taste', placeholder: 'e.g. Sweet, aromatic' },
                { label: 'Description', key: 'description', placeholder: 'Short description…' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input
                    value={newV[key]}
                    onChange={(e) => setNewV((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 6 }}>Prices (₹)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[['100g', 'price_100g'], ['200g', 'price_200g'], ['500g', 'price_500g']].map(([label, key]) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>{label}</div>
                      <input
                        type="number"
                        value={newV[key]}
                        onChange={(e) => setNewV((p) => ({ ...p, [key]: e.target.value }))}
                        style={{ ...inputStyle, width: '100%', padding: '8px 10px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #ddd', background: '#f5f5f0', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555' }}>Cancel</button>
              <button onClick={addVariety} disabled={addBusy || !newV.name.trim()} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: '#4a7c59', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800, opacity: addBusy || !newV.name.trim() ? 0.6 : 1 }}>
                {addBusy ? 'Adding…' : 'Add Variety'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#aaa' }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search varieties, family, taste…"
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
        <select
          value={familyFilter}
          onChange={(e) => setFamilyFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '10px 14px', cursor: 'pointer' }}
        >
          {families.map((f) => <option key={f} value={f}>{f === 'all' ? 'All families' : f}</option>)}
        </select>
        <button
          onClick={() => setShowOnlyHome((x) => !x)}
          style={{ padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: showOnlyHome ? '#4a7c59' : '#f0f0ea', color: showOnlyHome ? '#fff' : '#666' }}
        >
          ✅ Active only
        </button>
        <span style={{ fontSize: 13, color: '#aaa', marginLeft: 4 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map((v) => {
          const fc = FAMILY_COLORS[v.family] || { bg: '#f0f0f0', color: '#555' };
          const isExpanded = expandedId === v.id;
          const isUploading = uploading === v.id;
          const ef = editingFields[v.id];
          const isEditing = Boolean(ef);
          return (
            <div key={v.id} style={{ background: '#fff', borderRadius: 16, border: `2px solid ${isEditing ? '#4a7c59' : v.out_of_stock ? '#f5c6a0' : v.show_on_home ? '#7ab55c' : '#eee'}`, overflow: 'hidden', boxShadow: v.show_on_home ? '0 2px 12px rgba(74,124,89,0.12)' : '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>

              {/* Image area */}
              <div style={{ height: 140, background: '#f7fbf3', position: 'relative', overflow: 'hidden' }}>
                {v.image_url
                  ? <img src={v.image_url} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#bbb' }}>
                      <span style={{ fontSize: 32 }}>🌿</span>
                      <span style={{ fontSize: 11 }}>No image yet</span>
                    </div>}
                {/* Upload button overlay */}
                <label style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(26,46,26,0.85)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isUploading ? '⏳ Uploading…' : '📷 Upload'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={isUploading} onChange={(e) => uploadImage(v, e.target.files[0])} />
                </label>
                {/* Status badges */}
                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {v.show_on_home && (
                    <div style={{ background: '#7ab55c', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10, letterSpacing: 0.3 }}>
                      ✅ IN CATALOG
                    </div>
                  )}
                  {v.featured_home && (
                    <div style={{ background: '#5c7aaa', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10, letterSpacing: 0.3 }}>
                      🏠 ON HOMEPAGE
                    </div>
                  )}
                  {v.out_of_stock && (
                    <div style={{ background: '#e07b39', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10, letterSpacing: 0.3 }}>
                      ✗ OUT OF STOCK
                    </div>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing
                      ? <input value={ef.name} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], name: e.target.value } }))} style={{ ...inputStyle, fontSize: 15, fontWeight: 800, width: '100%', marginBottom: 6 }} />
                      : <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a2e1a' }}>{v.name}</h3>
                    }
                    {isEditing
                      ? <input value={ef.family} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], family: e.target.value } }))} placeholder="Family" style={{ ...inputStyle, fontSize: 11, padding: '3px 8px', width: '100%' }} />
                      : <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: fc.bg, color: fc.color }}>{v.family}</span>
                    }
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    {isEditing
                      ? <>
                          <button onClick={() => saveFields(v)} disabled={savingFields === v.id} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#4a7c59', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                            {savingFields === v.id ? '…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingFields((p) => { const n = { ...p }; delete n[v.id]; return n; })} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#f5f5f0', color: '#666', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </>
                      : <button onClick={() => startEditing(v)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d0e4c8', background: '#f7fbf3', color: '#4a7c59', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                          ✏️ Edit
                        </button>
                    }
                  </div>
                </div>

                {isEditing
                  ? <>
                      <input value={ef.taste} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], taste: e.target.value } }))} placeholder="Taste / flavour notes" style={{ ...inputStyle, width: '100%', fontSize: 12, marginBottom: 6 }} />
                      <input value={ef.tag} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], tag: e.target.value } }))} placeholder="Tag (e.g. SPICY, MILD)" style={{ ...inputStyle, width: '100%', fontSize: 12, marginBottom: 6 }} />
                      <input value={ef.grow_time} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], grow_time: e.target.value } }))} placeholder="Grow time (e.g. 7–10 days)" style={{ ...inputStyle, width: '100%', fontSize: 12, marginBottom: 6 }} />
                      <input value={ef.daily_intake} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], daily_intake: e.target.value } }))} placeholder="Daily intake (e.g. 20–30g)" style={{ ...inputStyle, width: '100%', fontSize: 12, marginBottom: 6 }} />
                      <textarea value={ef.description} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], description: e.target.value } }))} placeholder="Description" rows={2} style={{ ...inputStyle, width: '100%', fontSize: 12, marginBottom: 6, resize: 'vertical' }} />
                      <textarea value={ef.benefits} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], benefits: e.target.value } }))} placeholder="Benefits" rows={2} style={{ ...inputStyle, width: '100%', fontSize: 12, resize: 'vertical' }} />
                    </>
                  : <p style={{ margin: '0 0 10px', fontSize: 12, color: '#666', fontStyle: 'italic' }}>✦ {v.taste}</p>
                }

                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10, background: '#f9f9f6', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>Show in catalog</span>
                    <button
                      onClick={() => toggleHome(v)}
                      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: v.show_on_home ? '#7ab55c' : '#ddd', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                    >
                      <span style={{ position: 'absolute', top: 3, left: v.show_on_home ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>Show on homepage</span>
                    <button
                      onClick={() => toggleFeatured(v)}
                      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: v.featured_home ? '#5c7aaa' : '#ddd', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                    >
                      <span style={{ position: 'absolute', top: 3, left: v.featured_home ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>Out of stock</span>
                    <button
                      onClick={() => toggleOos(v)}
                      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: v.out_of_stock ? '#e07b39' : '#ddd', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                    >
                      <span style={{ position: 'absolute', top: 3, left: v.out_of_stock ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                </div>

                {/* Grow time + intake */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, background: '#f7fbf3', borderRadius: 8, padding: '7px 10px', fontSize: 11 }}>
                    <div style={{ color: '#aaa', marginBottom: 2 }}>Grow time</div>
                    <div style={{ fontWeight: 700, color: '#333' }}>{v.grow_time}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f7fbf3', borderRadius: 8, padding: '7px 10px', fontSize: 11 }}>
                    <div style={{ color: '#aaa', marginBottom: 2 }}>Daily intake</div>
                    <div style={{ fontWeight: 700, color: '#333' }}>{v.daily_intake}</div>
                  </div>
                </div>

                {/* Expand/collapse + delete */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                    style={{ flex: 1, background: '#f0f0ea', border: 'none', borderRadius: 8, padding: '7px', fontSize: 12, fontWeight: 700, color: '#555', cursor: 'pointer' }}
                  >
                    {isExpanded ? '▲ Less info' : '▼ Full details'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(v)}
                    style={{ background: '#fff5f5', border: '1px solid #f0c8c8', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, color: '#c0392b', cursor: 'pointer' }}
                    title="Delete this variety"
                  >
                    🗑️
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
                      <p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}>{v.description}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Benefits</div>
                      <p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}>{v.benefits}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 6 }}>Key Nutrients</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {v.nutrients?.map((n) => <span key={n} style={{ background: '#eef5e6', color: '#3d6b2e', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{n}</span>)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 6 }}>Best Uses</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {v.uses?.map((u) => <span key={u} style={{ background: '#f7fbf3', color: '#555', fontSize: 11, padding: '3px 8px', borderRadius: 20, border: '1px solid #e0ead8' }}>{u}</span>)}
                      </div>
                    </div>
                    {/* Price editing */}
                    <div style={{ background: '#f7fbf3', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 8 }}>Prices (₹)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[['100g', 'price_100g'], ['200g', 'price_200g'], ['500g', 'price_500g']].map(([label, key]) => {
                          const ep = editingPrices[v.id];
                          const val = ep ? ep[key] : (v[key] ?? '');
                          return (
                            <div key={key}>
                              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{label}</div>
                              <input
                                type="number"
                                value={val}
                                onChange={(e) => setEditingPrices((prev) => ({
                                  ...prev,
                                  [v.id]: { price_100g: v.price_100g ?? 249, price_200g: v.price_200g ?? 449, price_500g: v.price_500g ?? 999, ...(prev[v.id] || {}), [key]: e.target.value }
                                }))}
                                style={{ width: '100%', padding: '7px 8px', borderRadius: 7, border: '1px solid #d0e4c8', fontSize: 13, fontWeight: 700, textAlign: 'center' }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      {editingPrices[v.id] && (
                        <button
                          onClick={() => savePrices(v)}
                          style={{ marginTop: 10, width: '100%', background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Save Prices
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#222' }}>Delete "{confirmDelete.name}"?</h3>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: '#777' }}>
              This permanently removes the variety from your catalog. Existing orders that reference it stay intact.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f0', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555' }}>Cancel</button>
              <button onClick={() => deleteVariety(confirmDelete.id)} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#c0392b', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sunday Packing Tab ───────────────────────────────────────────────────
function SundayPackingTab({ subscriptions, stats }) {
  const nextSunday = stats.nextSundayStr;
  const [deliveredIds, setDeliveredIds] = useState({});
  const [advancingIds, setAdvancingIds] = useState({});

  async function markDelivered(sub) {
    setDeliveredIds((p) => ({ ...p, [sub.id]: 'loading' }));
    const res = await fetch('/api/admin/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, action: 'deliver' }),
    });
    if (res.ok) setDeliveredIds((p) => ({ ...p, [sub.id]: 'done' }));
    else setDeliveredIds((p) => ({ ...p, [sub.id]: 'error' }));
  }

  async function advanceDate(sub) {
    setAdvancingIds((p) => ({ ...p, [sub.id]: 'loading' }));
    const res = await fetch('/api/admin/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, action: 'advance' }),
    });
    if (res.ok) setAdvancingIds((p) => ({ ...p, [sub.id]: 'done' }));
    else setAdvancingIds((p) => ({ ...p, [sub.id]: 'error' }));
  }

  // Split into delivering vs skipped/paused
  const delivering = subscriptions.filter(
    (s) => s.status === 'active' && s.next_delivery_date === nextSunday
  );

  function printAddressLabels() {
    const dateStr = new Date(nextSunday + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    function packLabel(audience) {
      if (audience === 'single') return 'Single · 4 varieties × 25g';
      if (audience === 'couple') return 'Couple · 4 varieties × 50g';
      if (audience === 'family') return 'Family · 4 varieties × 100g';
      return '';
    }

    const labels = delivering.map((s) => {
      const addr = s.addresses;
      const name = addr?.full_name || s.profiles?.full_name || '—';
      const phone = addr?.phone || '—';
      const line1 = addr?.line1 || '';
      const line2 = addr?.line2 || '';
      const city = addr?.city || '';
      const state = addr?.state || '';
      const pincode = addr?.pincode || '';
      const addrLine = [line1, line2].filter(Boolean).join(', ');
      const cityLine = [city, state, pincode].filter(Boolean).join(', ');
      const pack = packLabel(s.plans?.audience);
      return `
        <div class="label">
          <div class="brand">№40 TRAY — Microgreens</div>
          <div class="name">${name}</div>
          <div class="phone">📞 ${phone}</div>
          ${addrLine ? `<div class="addr">${addrLine}</div>` : ''}
          ${cityLine ? `<div class="addr">${cityLine}</div>` : ''}
          <div class="pack">${pack}</div>
          <div class="date">Delivery: ${dateStr}</div>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Address Labels — ${dateStr}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff; }
  .page { display: flex; flex-wrap: wrap; gap: 0; padding: 10mm; }
  .label {
    width: 90mm;
    min-height: 50mm;
    border: 1.5px solid #333;
    border-radius: 4px;
    padding: 8mm 8mm 6mm;
    margin: 3mm;
    display: flex;
    flex-direction: column;
    gap: 3px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .brand { font-size: 7pt; color: #888; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
  .name { font-size: 13pt; font-weight: 800; color: #111; }
  .phone { font-size: 9pt; color: #444; margin-top: 1px; }
  .addr { font-size: 9pt; color: #555; line-height: 1.4; }
  .pack { font-size: 8pt; font-weight: 700; color: #3a6b28; background: #eef5e6; padding: 2px 7px; border-radius: 10px; display: inline-block; margin-top: 5px; }
  .date { font-size: 7pt; color: #aaa; margin-top: 4px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 5mm; }
    @page { margin: 5mm; size: A4; }
  }
</style>
</head>
<body>
<div class="page">${labels}</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(html);
    w.document.close();
  }
  const paused = subscriptions.filter((s) => s.status === 'paused');
  const notThisSunday = subscriptions.filter(
    (s) => s.status === 'active' && s.next_delivery_date !== nextSunday
  );

  // Packing summary counts
  const single = delivering.filter((s) => s.plans?.audience === 'single').length;
  const couple = delivering.filter((s) => s.plans?.audience === 'couple').length;
  const family = delivering.filter((s) => s.plans?.audience === 'family').length;

  // Group by city for routing
  const byCity = delivering.reduce((acc, s) => {
    const city = s.addresses?.city || 'Unknown';
    if (!acc[city]) acc[city] = [];
    acc[city].push(s);
    return acc;
  }, {});

  function packLabel(audience) {
    if (audience === 'single') return '4 varieties · 25g each';
    if (audience === 'couple') return '4 varieties · 50g each';
    if (audience === 'family') return '4 varieties · 100g each';
    return '—';
  }

  function packBg(audience) {
    if (audience === 'single') return '#eef5e6';
    if (audience === 'couple') return '#e8f0ff';
    if (audience === 'family') return '#fff4e6';
    return '#f5f5f0';
  }

  function packColor(audience) {
    if (audience === 'single') return '#3d6b2e';
    if (audience === 'couple') return '#2e4a8a';
    if (audience === 'family') return '#8a5a2e';
    return '#555';
  }

  const dateLong = new Date(nextSunday + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalGrams = single * 100 + couple * 200 + family * 400;
  const audienceRows = [
    { key: 'single', label: 'Single', count: single, per: '25g', total: '100g', color: '#3d6b2e', bg: '#eef5e6', icon: '🧑' },
    { key: 'couple', label: 'Couple', count: couple, per: '50g', total: '200g', color: '#2e4a8a', bg: '#e8f0ff', icon: '👫' },
    { key: 'family', label: 'Family', count: family, per: '100g', total: '400g', color: '#8a5a2e', bg: '#fff4e6', icon: '👨‍👩‍👧‍👦' },
  ];

  return (
    <div className="sunday-tab" style={{ maxWidth: 900 }}>
      {/* Hero card */}
      <div className="sunday-hero">
        <div className="sunday-hero-top">
          <div className="sunday-hero-label">📦 Next Delivery</div>
          <span className="sunday-hero-count">
            <strong>{delivering.length}</strong>
            <span>box{delivering.length !== 1 ? 'es' : ''}</span>
          </span>
        </div>
        <h1 className="sunday-hero-date">Sunday, {dateLong}</h1>
        <button
          onClick={printAddressLabels}
          disabled={delivering.length === 0}
          className="sunday-hero-print"
        >
          🖨️ Print Address Labels
        </button>
      </div>

      {/* Packing summary — compact rows */}
      <div className="sunday-section">
        <div className="sunday-section-head">
          <h3>Packing Summary</h3>
          {totalGrams > 0 && <span className="sunday-total">{totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(1)} kg` : `${totalGrams}g`} total</span>}
        </div>
        <div className="sunday-pack-rows">
          {audienceRows.map(({ key, label, count, per, total, color, bg, icon }) => (
            <div key={key} className={`sunday-pack-row${count === 0 ? ' sunday-pack-row--empty' : ''}`} style={{ '--row-bg': bg, '--row-color': color }}>
              <span className="sunday-pack-icon">{icon}</span>
              <div className="sunday-pack-body">
                <div className="sunday-pack-label">{label}</div>
                <div className="sunday-pack-sub">4 varieties · {per} each · {total} per box</div>
              </div>
              <div className="sunday-pack-count">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery list grouped by city */}
      {delivering.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15, color: '#888' }}>No deliveries scheduled for this Sunday.</p>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Delivery List — {delivering.length} box{delivering.length !== 1 ? 'es' : ''} · grouped by area
          </h3>
          {Object.entries(byCity).sort().map(([city, subs]) => (
            <div key={city} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#4a7c59', textTransform: 'uppercase', letterSpacing: 0.8, padding: '6px 0', borderBottom: '2px solid #e8f0e0', marginBottom: 8 }}>
                📍 {city} — {subs.length} box{subs.length !== 1 ? 'es' : ''}
              </div>
              {subs.map((s, i) => {
                const addr = s.addresses;
                const name = addr?.full_name || s.profiles?.full_name || '—';
                const phone = addr?.phone || '—';
                const line = [addr?.line1, addr?.line2].filter(Boolean).join(', ');
                const pincode = addr?.pincode || '';
                const audience = s.plans?.audience;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px', background: i % 2 === 0 ? '#fff' : '#fafaf7', borderRadius: 10, marginBottom: 4, border: '1px solid #f0f0ea' }}>
                    {/* Box number */}
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: packBg(audience), color: packColor(audience), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>
                      {i + 1}
                    </div>
                    {/* Customer info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a' }}>{name}</span>
                        <span style={{ background: packBg(audience), color: packColor(audience), fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                          {audience}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>📞 {phone}</div>
                      {line && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{line}{pincode ? `, ${pincode}` : ''}</div>}
                    </div>
                    {/* What to pack + Mark Delivered */}
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: packColor(audience), background: packBg(audience), padding: '4px 10px', borderRadius: 8 }}>
                        {packLabel(audience)}
                      </div>
                      {deliveredIds[s.id] === 'done' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4a7c59' }}>✅ Delivered</span>
                      ) : (
                        <button
                          onClick={() => markDelivered(s)}
                          disabled={deliveredIds[s.id] === 'loading'}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1.5px solid #4a7c59', background: '#fff', color: '#4a7c59', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {deliveredIds[s.id] === 'loading' ? '…' : '✓ Mark Delivered'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Paused / skipping this week */}
      {(paused.length > 0 || notThisSunday.length > 0) && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Not Delivering This Sunday
          </h3>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
            {[...paused, ...notThisSunday].map((s, i) => {
              const name = s.addresses?.full_name || s.profiles?.full_name || '—';
              const isStale = s.status === 'active' && s.next_delivery_date < nextSunday;
              const reason = s.status === 'paused' ? '⏸ Paused' : `⏭ Next: ${fmtDate(s.next_delivery_date)}`;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: i % 2 === 0 ? '#fff' : '#fafaf7', borderBottom: '1px solid #f0f0ea', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16 }}>{s.status === 'paused' ? '⏸️' : '⏭️'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>{name}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>{s.plans?.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.status === 'paused' ? '#5c7aaa' : isStale ? '#c0392b' : '#888', background: s.status === 'paused' ? '#e8edf5' : isStale ? '#fdecea' : '#f5f5f0', padding: '3px 10px', borderRadius: 8 }}>
                    {reason}
                  </span>
                  {isStale && (
                    advancingIds[s.id] === 'done' ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#4a7c59' }}>✓ Updated</span>
                    ) : (
                      <button
                        onClick={() => advanceDate(s)}
                        disabled={advancingIds[s.id] === 'loading'}
                        style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 8, border: '1.5px solid #c0392b', background: '#fff', color: '#c0392b', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {advancingIds[s.id] === 'loading' ? '…' : '⟳ Fix Date'}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Editor ─────────────────────────────────────────────────────
export default function AdminEditor({ initialContent, initialPlans, initialPincodes, initialSubscriptions, initialOrders, stats, adminEmail }) {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [content, setContent] = useState(() => {
    const map = {};
    initialContent.forEach((r) => { map[`${r.section}.${r.key}`] = { value: r.value, type: r.type }; });
    return map;
  });
  const [plans, setPlans] = useState(initialPlans);
  const [pincodes, setPincodes] = useState(initialPincodes);
  const [orders, setOrders] = useState(initialOrders);
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [refreshing, setRefreshing] = useState(false);
  const [dirty, setDirty] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function fetchLatest() {
    setRefreshing(true);
    try {
      const [ordersRes, subsRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/subscriptions'),
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (subsRes.ok) setSubscriptions(await subsRes.json());
    } finally {
      setRefreshing(false);
    }
  }

  // Fetch fresh data on mount
  useEffect(() => { fetchLatest(); }, []);

  async function saveContent() {
    const rows = Object.values(dirty);
    if (!rows.length) return;
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Save failed' });
    setDirty({});
    setMsg({ type: 'ok', text: `Saved ${data.saved} change${data.saved > 1 ? 's' : ''}. Refresh the site to see them.` });
  }

  const dirtyCount = Object.keys(dirty).length;

  const TABS = [
    { id: 'overview',    label: 'Overview',       icon: '📊' },
    { id: 'deliveries',  label: 'Deliveries',     icon: '🚚' },
    { id: 'subscribers', label: 'Subscribers',    icon: '🌱' },
    { id: 'orders',      label: 'Orders',          icon: '💳' },
    { id: 'content',     label: 'Page Content',    icon: '✏️' },
    { id: 'varieties',   label: 'Varieties',       icon: '🥬' },
    { id: 'plans',       label: 'Plans & Pricing', icon: '📋' },
    { id: 'pincodes',    label: 'Delivery Areas',  icon: '📍' },
    { id: 'referrals',   label: 'Referrals',       icon: '🎟️' },
  ];

  return (
    <div className="admin-root" style={{ fontFamily: 'inherit' }}>
      {/* Top bar */}
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontSize: 20 }}>🌱</span>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>№40 TRAY — Admin</span>
        </div>
        <div className="admin-topbar-right">
          <span className="admin-topbar-email">{adminEmail}</span>
          <button
            onClick={fetchLatest}
            disabled={refreshing}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#c8e6b0', fontSize: 12, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', letterSpacing: 0.3, opacity: refreshing ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {refreshing ? '…' : '↻ Refresh'}
          </button>
          <Link href="/" target="_blank" style={{ color: '#c8e6b0', fontWeight: 700, textDecoration: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>VIEW SITE ↗</Link>
        </div>
      </div>

      <div className="admin-body">
        {/* Sidebar (horizontal tab bar on mobile) */}
        <aside className="admin-sidenav">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => { setTab(id); setMsg(null); }}
              className={`admin-nav-btn${tab === id ? ' admin-nav-btn--active' : ''}`}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
              {id === 'content' && dirtyCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#e07b39', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>{dirtyCount}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="admin-main">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>
              {TABS.find((t) => t.id === tab)?.icon} {TABS.find((t) => t.id === tab)?.label}
            </h1>
          </div>

          {msg && (
            <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600, background: msg.type === 'error' ? '#fdecea' : '#eef7e8', color: msg.type === 'error' ? '#b0281e' : '#3d6b2e', border: `1px solid ${msg.type === 'error' ? '#f5c6c3' : '#c3e6b0'}` }}>
              {msg.text}
            </div>
          )}

          {tab === 'overview'    && <OverviewTab stats={stats} subscriptions={subscriptions} orders={orders} />}
          {tab === 'sunday'      && <SundayPackingTab subscriptions={subscriptions} stats={stats} />}
          {tab === 'deliveries'  && <DeliveriesTab />}
          {tab === 'subscribers' && <SubscribersTab subscriptions={subscriptions} />}
          {tab === 'orders'      && <OrdersTab orders={orders} setOrders={setOrders} onRefresh={fetchLatest} />}
          {tab === 'content'     && <ContentTab content={content} setContent={setContent} dirty={dirty} setDirty={setDirty} busy={busy} setBusy={setBusy} setMsg={setMsg} />}
          {tab === 'varieties'   && <VarietiesTab />}
          {tab === 'plans'       && <PlansTab plans={plans} setPlans={setPlans} busy={busy} setBusy={setBusy} setMsg={setMsg} />}
          {tab === 'pincodes'    && <PincodesTab pincodes={pincodes} setPincodes={setPincodes} busy={busy} setBusy={setBusy} setMsg={setMsg} />}
          {tab === 'referrals'   && <ReferralsTab />}
        </main>
      </div>

      {/* Sticky save bar */}
      {tab === 'content' && dirtyCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a2e1a', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <span style={{ color: '#c8e6b0', fontSize: 13 }}>{dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</span>
          <button onClick={saveContent} disabled={busy} style={{ background: '#7ab55c', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {busy ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </div>
      )}
    </div>
  );
}
