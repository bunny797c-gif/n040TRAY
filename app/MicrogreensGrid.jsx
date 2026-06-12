'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart';

const MICROGREENS_DEFAULT = [
  {
    emoji: '🌻',
    image: '/images/mg-sunflower.jpg',
    bg: 'linear-gradient(135deg, #e8f5e0, #c8e6b0)',
    tag: 'BESTSELLER',
    name: 'Sunflower',
    taste: 'Nutty, mild, slightly sweet',
    desc: 'One of the most satisfying microgreens — thick stems with a satisfying crunch. Rich in Vitamin E, selenium, and healthy fats.',
    uses: ['On top of rice', 'With eggs', 'In salads'],
    nutrients: ['Vitamin E', 'Selenium', 'Healthy Fats', 'Zinc'],
    benefits: 'Supports skin health, immune function, and heart health. High antioxidant content helps fight oxidative stress.',
    growTime: '8–12 days',
    servingSize: '60g tray',
    dailyIntake: '15–20g per day',
  },
  {
    emoji: '🌶️',
    image: '/images/mg-radish.jpg',
    bg: 'linear-gradient(135deg, #fdecea, #f5c4c0)',
    tag: 'BOLD FLAVOUR',
    tagClass: 'product-tag--spicy',
    name: 'Radish',
    taste: 'Peppery, sharp, clean finish',
    desc: 'High in folate and Vitamin C. A punchy addition that elevates any dish with colour and character.',
    uses: ['On top of rice', 'With parathas', 'As a fresh garnish'],
    nutrients: ['Folate', 'Vitamin C', 'Potassium', 'Anthocyanins'],
    benefits: 'Supports digestion, detoxification, and immune health. The peppery bite comes from natural glucosinolates.',
    growTime: '6–10 days',
    servingSize: '60g tray',
    dailyIntake: '10–15g per day',
  },
  {
    emoji: '🫛',
    image: '/images/mg-pea.jpg',
    bg: 'linear-gradient(135deg, #e0f0e8, #b8dfc8)',
    tag: 'FAMILY FRIENDLY',
    tagClass: 'product-tag--mild',
    name: 'Pea Shoots',
    taste: 'Sweet, fresh, garden-like',
    desc: 'Delicate and versatile. High in Vitamins A, C, and folate. A gentle flavour that works well with almost any meal.',
    uses: ['Eaten fresh', 'On top of any meal', 'With curd rice'],
    nutrients: ['Vitamin A', 'Vitamin C', 'Folate', 'Plant Protein'],
    benefits: 'Supports eye health, immunity, and cell growth. Mild enough for children and elderly — a true family staple.',
    growTime: '10–14 days',
    servingSize: '60g tray',
    dailyIntake: '20–30g per day',
  },
  {
    emoji: '🥦',
    image: '/images/mg-broccoli.jpg',
    bg: 'linear-gradient(135deg, #e8f5e0, #a8d890)',
    tag: 'HIGH NUTRITION',
    name: 'Broccoli',
    taste: 'Mild, earthy, clean',
    desc: 'Among the most studied microgreens for sulforaphane content. An effortless way to add nutrition to smoothies and bowls.',
    uses: ['On top of eggs', 'In smoothies', 'Eaten fresh'],
    nutrients: ['Sulforaphane', 'Vitamin K', 'Vitamin C', 'Glucoraphanin'],
    benefits: 'One of the most researched microgreens. Sulforaphane supports detox pathways, reduces inflammation, and may support cellular health.',
    growTime: '7–10 days',
    servingSize: '60g tray',
    dailyIntake: '15–20g per day',
  },
  {
    emoji: '🌾',
    image: '/images/mg-wheatgrass.jpg',
    bg: 'linear-gradient(135deg, #fdf6e0, #f0e0a0)',
    tag: 'DETOX FAVOURITE',
    tagClass: 'product-tag--spicy',
    name: 'Wheatgrass',
    taste: 'Earthy, grassy, intense',
    desc: 'Traditionally consumed as a shot or in juices. Contains chlorophyll, iron, and enzymes that support digestion and energy.',
    uses: ['Morning juice shot', 'In smoothies', 'Detox drink'],
    nutrients: ['Chlorophyll', 'Iron', 'Enzymes', 'Vitamin B12'],
    benefits: 'Supports blood purification, energy levels, and digestion. Rich in chlorophyll which alkalises the body and supports liver function.',
    growTime: '7–12 days',
    servingSize: '60g tray',
    dailyIntake: '30ml juice per day',
  },
  {
    emoji: '🌿',
    image: '/images/mg-fenugreek.jpg',
    bg: 'linear-gradient(135deg, #f0ede0, #d8c890)',
    tag: 'INDIAN KITCHEN',
    tagClass: 'product-tag--mild',
    name: 'Fenugreek',
    taste: 'Slightly bitter, aromatic',
    desc: 'A familiar flavour in Indian cooking. Supports blood sugar balance and digestion. Pairs naturally with traditional meals.',
    uses: ['Sprinkled on meals', 'With curd', 'Eaten fresh'],
    nutrients: ['Fiber', 'Iron', 'Diosgenin', 'Galactomannan'],
    benefits: 'Traditionally used in Ayurveda. Supports blood sugar regulation, digestion, and lactation. A natural fit for Indian cuisine.',
    growTime: '7–10 days',
    servingSize: '60g tray',
    dailyIntake: '10–15g per day',
  },
];

// Normalise a DB row to the shape the component expects
function normaliseDbVariety(v) {
  return {
    emoji: '🌿',
    image: v.image_url || null,
    bg: 'linear-gradient(135deg, #e8f5e0, #c8e6b0)',
    tag: v.tag || '',
    tagClass: v.tag_class || '',
    name: v.name,
    taste: v.taste || '',
    desc: v.description || '',
    uses: v.uses || [],
    nutrients: v.nutrients || [],
    benefits: v.benefits || '',
    growTime: v.grow_time || '',
    servingSize: v.serving_size || '60g tray',
    dailyIntake: v.daily_intake || '',
  };
}

export default function MicrogreensGrid({ label, title, subtitle, varieties: dbVarieties }) {
  const items = dbVarieties && dbVarieties.length > 0
    ? dbVarieties.map(normaliseDbVariety)
    : MICROGREENS_DEFAULT;
  const [selected, setSelected] = useState(null);
  const [addedName, setAddedName] = useState(null);
  const { addItem } = useCart();

  function handleAddToCart(item) {
    addItem(item);
    setAddedName(item.name);
    setTimeout(() => setAddedName(null), 1800);
  }

  return (
    <>
      <section className="products-section" id="microgreens">
        <div className="products-inner">
          <p className="section-label">{label}</p>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
          <div className="products-grid">
            {items.map((p) => (
              <div
                className="product-card"
                key={p.name}
                onClick={() => setSelected(p)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-card-top" style={{ background: p.bg, position: 'relative', overflow: 'hidden' }}>
                  {p.image
                    ? <Image src={p.image} alt={p.name} width={800} height={533} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span className="product-emoji">{p.emoji}</span>}
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

      {/* Popup */}
      {selected && (
        <div className="mg-overlay" onClick={() => setSelected(null)}>
          <div className="mg-popup" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
            <button className="mg-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>

            <div className="mg-popup-top" style={{ background: selected.bg, overflow: 'hidden', padding: selected.image ? 0 : undefined }}>
              {selected.image
                ? <Image src={selected.image} alt={selected.name} width={800} height={533} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
                : <span className="mg-popup-emoji">{selected.emoji}</span>}
              <div className={`product-tag ${selected.tagClass || ''}`} style={{ margin: '12px auto 0' }}>{selected.tag}</div>
            </div>

            <div className="mg-popup-body">
              <h2 className="mg-popup-name">{selected.name}</h2>
              <p className="mg-popup-taste">✦ Taste: {selected.taste}</p>
              <p className="mg-popup-desc">{selected.desc}</p>

              <div className="mg-popup-section">
                <h4>Benefits</h4>
                <p>{selected.benefits}</p>
              </div>

              <div className="mg-popup-section">
                <h4>Key Nutrients</h4>
                <div className="mg-nutrients">
                  {selected.nutrients.map((n) => <span key={n}>{n}</span>)}
                </div>
              </div>

              <div className="mg-popup-meta">
                <div><span>🕐 Grow Time</span><strong>{selected.growTime}</strong></div>
                <div><span>📦 Tray Size</span><strong>{selected.servingSize}</strong></div>
                <div><span>🥗 Daily Intake</span><strong>{selected.dailyIntake}</strong></div>
              </div>

              <div className="mg-popup-uses">
                <h4>Best Used In</h4>
                <div className="product-uses">
                  {selected.uses.map((u) => <span key={u}>{u}</span>)}
                </div>
              </div>

              <div className="mg-popup-actions">
                <Link href="/subscription" className="btn-primary mg-subscribe-btn" onClick={() => setSelected(null)}>
                  <span>START A SUBSCRIPTION</span>
                </Link>
                <button
                  className={`mg-cart-btn ${addedName === selected.name ? 'mg-cart-btn--added' : ''}`}
                  onClick={() => handleAddToCart(selected)}
                >
                  {addedName === selected.name ? '✓ ADDED' : '🛒 ADD TO CART'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
