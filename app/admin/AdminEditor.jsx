'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

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
  const recentOrders = orders.slice(0, 8);
  const upcomingSubs = subscriptions.filter((s) => s.status === 'active').slice(0, 8);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="Active Subscribers" value={stats.activeSubs} sub="Current paying subscribers" accent="#4a7c59" icon="🌱" />
        <StatCard label="Paused" value={stats.pausedSubs} sub="Will resume when unpaused" accent="#5c7aaa" icon="⏸️" />
        <StatCard label="This Sunday" value={stats.deliveriesThisSunday} sub={`Deliveries on ${fmtDateShort(stats.nextSundayStr)}`} accent="#f0a500" icon="📦" />
        <StatCard label="Total Revenue" value={inr(stats.totalRevenue)} sub="From paid orders" accent="#7ab55c" icon="💰" />
        <StatCard label="Pending Payment" value={stats.pendingPayments} sub="Orders awaiting payment" accent="#e07b39" icon="⏳" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#333' }}>Active Subscribers</h3>
          {upcomingSubs.length === 0
            ? <p style={{ color: '#aaa', fontSize: 13 }}>No active subscribers yet.</p>
            : upcomingSubs.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f0', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#222' }}>{s.profiles?.full_name || s.profiles?.email?.split('@')[0] || '—'}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{s.plans?.name} · {s.plans?.audience}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#888' }}>Next: {fmtDateShort(s.next_delivery_date)}</div>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#333' }}>Recent Orders</h3>
          {recentOrders.length === 0
            ? <p style={{ color: '#aaa', fontSize: 13 }}>No orders yet.</p>
            : recentOrders.map((o) => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f0', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#222' }}>{inr(o.amount_inr)}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{fmtDate(o.created_at)}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
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
              {['Customer','Plan','Audience','Status','Variety','Next Delivery','Started','Price'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#bbb', fontSize: 14 }}>No subscribers match this filter.</td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#222' }}>{s.profiles?.full_name || '—'}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{s.profiles?.email}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#444' }}>{s.plans?.name || '—'}</td>
                <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: '#666' }}>{s.plans?.audience || '—'}</td>
                <td style={{ padding: '12px 14px' }}><StatusBadge status={s.status} /></td>
                <td style={{ padding: '12px 14px', color: '#666', fontSize: 12 }}>
                  <div style={{ textTransform: 'capitalize' }}>{s.variety_type?.replace(/_/g, ' ') || '—'}</div>
                  {s.variety_choices?.length > 0 && <div style={{ color: '#aaa' }}>{s.variety_choices.join(', ')}</div>}
                </td>
                <td style={{ padding: '12px 14px', color: s.status === 'paused' ? '#aaa' : '#444', whiteSpace: 'nowrap' }}>{s.status === 'paused' ? <em>Paused</em> : fmtDate(s.next_delivery_date)}</td>
                <td style={{ padding: '12px 14px', color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(s.start_date)}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#4a7c59' }}>{inr(s.plans?.price_inr || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────
function OrdersTab({ orders }) {
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => filter === 'all' ? orders : orders.filter((o) => o.status === filter), [orders, filter]);
  const totalPaid = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + Number(o.amount_inr || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all','paid','created','failed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: filter === s ? '#4a7c59' : '#f0f0ea', color: filter === s ? '#fff' : '#555' }}>
            {s === 'all' ? 'All' : s}
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
              {['Date','Amount','Status','Razorpay Order ID','Razorpay Payment ID','Paid At'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#bbb', fontSize: 14 }}>No orders.</td></tr>
            ) : filtered.map((o, i) => (
              <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#666' }}>{fmtDate(o.created_at)}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#222' }}>{inr(o.amount_inr)}</td>
                <td style={{ padding: '12px 14px' }}><StatusBadge status={o.status} /></td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{o.razorpay_order_id || '—'}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{o.razorpay_payment_id || '—'}</td>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#888' }}>{o.paid_at ? fmtDate(o.paid_at) : '—'}</td>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, margin: '-28px', height: 'calc(100vh - 56px)' }}>

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

      {/* Body: iframe left + edit panel right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', flex: 1, overflow: 'hidden' }}>

        {/* Left: live site iframe */}
        <div style={{ position: 'relative', borderRight: '1px solid #eee', background: '#f0f0ea' }}>
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
        <div style={{ overflowY: 'auto', background: '#fafaf7', padding: 24 }}>
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
                      {[['name',140],['price_inr',80],['deliveries',70],['serving_label',170],['varieties_label',170],['savings_pct',55],['tag',90]].map(([k, w]) => (
                        <td key={k} style={{ padding: '8px 6px' }}>
                          <input style={{ ...inputStyle, padding: '8px 10px', width: w }}
                            value={plans[i]?.[k] ?? ''}
                            onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} />
                        </td>
                      ))}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input type="checkbox" checked={Boolean(plans[i]?.is_active)}
                          onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, is_active: e.target.checked } : x))} />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
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

// ── Main Admin Editor ─────────────────────────────────────────────────────
export default function AdminEditor({ initialContent, initialPlans, initialPincodes, initialSubscriptions, initialOrders, stats, adminEmail }) {
  const [tab, setTab] = useState('overview');
  const [content, setContent] = useState(() => {
    const map = {};
    initialContent.forEach((r) => { map[`${r.section}.${r.key}`] = { value: r.value, type: r.type }; });
    return map;
  });
  const [plans, setPlans] = useState(initialPlans);
  const [pincodes, setPincodes] = useState(initialPincodes);
  const [dirty, setDirty] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

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
    { id: 'subscribers', label: 'Subscribers',    icon: '🌱' },
    { id: 'orders',      label: 'Orders',          icon: '💳' },
    { id: 'content',     label: 'Page Content',    icon: '✏️' },
    { id: 'plans',       label: 'Plans & Pricing', icon: '📋' },
    { id: 'pincodes',    label: 'Delivery Areas',  icon: '📍' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2ed', fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: '#1a2e1a', color: '#fff', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🌱</span>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>№40 TRAY — Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: '#7ab55c', fontWeight: 500 }}>{adminEmail}</span>
          <Link href="/" target="_blank" style={{ color: '#c8e6b0', fontWeight: 700, textDecoration: 'none', fontSize: 12 }}>VIEW SITE ↗</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 210, background: '#fff', borderRight: '1px solid #eee', padding: '20px 12px', flexShrink: 0 }}>
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => { setTab(id); setMsg(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none', borderRadius: 10, marginBottom: 4, cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 700 : 500, background: tab === id ? '#eef5e6' : 'transparent', color: tab === id ? '#3d5a45' : '#666', transition: 'background 0.15s' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
              {id === 'content' && dirtyCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#e07b39', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>{dirtyCount}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
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

          {tab === 'overview'    && <OverviewTab stats={stats} subscriptions={initialSubscriptions} orders={initialOrders} />}
          {tab === 'subscribers' && <SubscribersTab subscriptions={initialSubscriptions} />}
          {tab === 'orders'      && <OrdersTab orders={initialOrders} />}
          {tab === 'content'     && <ContentTab content={content} setContent={setContent} dirty={dirty} setDirty={setDirty} busy={busy} setBusy={setBusy} setMsg={setMsg} />}
          {tab === 'plans'       && <PlansTab plans={plans} setPlans={setPlans} busy={busy} setBusy={setBusy} setMsg={setMsg} />}
          {tab === 'pincodes'    && <PincodesTab pincodes={pincodes} setPincodes={setPincodes} busy={busy} setBusy={setBusy} setMsg={setMsg} />}
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
