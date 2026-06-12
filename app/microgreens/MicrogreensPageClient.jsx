'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart';

// Pack options: label shown, price in INR
const PACKS = [
  { label: '100g', price: 249 },
  { label: '200g', price: 449 },
  { label: '500g', price: 999 },
];

// Premium varieties cost ₹50 more
const PREMIUM = ['Broccoli', 'Kale', 'Beetroot'];

function packPrice(varietyName, pack) {
  return PREMIUM.includes(varietyName) ? pack.price + 50 : pack.price;
}

export default function MicrogreensPageClient({ varieties }) {
  const [selected, setSelected] = useState(null);
  const [selectedPack, setSelectedPack] = useState(PACKS[0]);
  const [addedKey, setAddedKey] = useState(null);
  const [search, setSearch] = useState('');
  const { addItem } = useCart();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return varieties;
    return varieties.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.taste?.toLowerCase().includes(q) ||
        v.family?.toLowerCase().includes(q) ||
        v.nutrients?.some((n) => n.toLowerCase().includes(q))
    );
  }, [varieties, search]);

  function buildCartItem(v, pack) {
    const price = packPrice(v.name, pack);
    return {
      name: v.name,
      cartKey: `${v.name}__${pack.label}`,
      packLabel: pack.label,
      price,
      image: v.image_url || null,
      tag: v.tag,
      taste: v.taste,
      desc: v.description,
      uses: v.uses || [],
      nutrients: v.nutrients || [],
      benefits: v.benefits,
    };
  }

  function handleAddToCart(v, pack, e) {
    if (e) e.stopPropagation();
    if (v.out_of_stock) return;
    const item = buildCartItem(v, pack);
    addItem(item);
    setAddedKey(item.cartKey);
    setTimeout(() => setAddedKey(null), 1800);
  }

  function handleBuyNow(v, pack, e) {
    if (e) e.stopPropagation();
    if (v.out_of_stock) return;
    const item = buildCartItem(v, pack);
    addItem(item);
    setSelected(null);
    window.dispatchEvent(new CustomEvent('open-cart'));
  }

  function openPopup(v) {
    setSelected(v);
    setSelectedPack(PACKS[0]);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f7fbf3' }}>
      {/* Page header */}
      <div style={{ background: '#1a2e1a', paddingTop: 80, paddingBottom: 48, textAlign: 'center' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#7ab55c', letterSpacing: 2, textTransform: 'uppercase' }}>
          Our Varieties
        </p>
        <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
          Fresh Microgreens
        </h1>
        <p style={{ margin: '0 auto 28px', fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 520, lineHeight: 1.6, padding: '0 20px' }}>
          Harvested the morning of delivery. Every variety grown in-house without pesticides or chemicals.
        </p>
        <div style={{ maxWidth: 400, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 36, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, taste, nutrient…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '13px 18px 13px 42px',
              borderRadius: 40, border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              fontSize: 14, outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <section className="products-section" style={{ background: '#f7fbf3' }}>
        <div className="products-inner">
          {varieties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
              <h2 style={{ margin: '0 0 10px', fontSize: 22, color: '#555' }}>No varieties available yet</h2>
              <p style={{ margin: 0, fontSize: 15 }}>Check back soon — we're adding new varieties regularly.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 15 }}>No varieties match "{search}"</p>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map((v) => {
                const cardKey = `${v.name}__${PACKS[0].label}`;
                const price = packPrice(v.name, PACKS[0]);
                const isAdded = addedKey === cardKey;
                return (
                  <div
                    key={v.id}
                    className="product-card"
                    onClick={() => openPopup(v)}
                    style={{ cursor: 'pointer', opacity: v.out_of_stock ? 0.75 : 1 }}
                  >
                    <div className="product-card-top" style={{ background: 'linear-gradient(135deg, #e8f5e0, #c8e6b0)', position: 'relative', overflow: 'hidden' }}>
                      {v.image_url
                        ? <Image src={v.image_url} alt={v.name} width={800} height={533} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span className="product-emoji">🌿</span>}
                      {v.out_of_stock && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ background: '#fff', color: '#333', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 20, letterSpacing: 0.5 }}>OUT OF STOCK</span>
                        </div>
                      )}
                    </div>
                    <div className="product-card-body">
                      <div className={`product-tag ${v.tag_class || ''}`}>{v.tag || 'MICROGREEN'}</div>
                      <h3>{v.name}</h3>
                      <p className="product-taste">Taste: {v.taste}</p>
                      <p className="product-desc">{v.description}</p>
                      <div className="product-uses">
                        {(v.uses || []).map((u) => <span key={u}>{u}</span>)}
                      </div>
                      {/* Price + quick add to cart */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid #eee' }}>
                        <div>
                          <span style={{ fontSize: 17, fontWeight: 800, color: '#2d4a2d' }}>₹{price}</span>
                          <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>/ 100g</span>
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(v, PACKS[0], e)}
                          disabled={v.out_of_stock}
                          style={{
                            padding: '7px 14px', borderRadius: 20, border: 'none',
                            cursor: v.out_of_stock ? 'not-allowed' : 'pointer',
                            background: isAdded ? '#7ab55c' : '#2d4a2d', color: '#fff',
                            fontSize: 12, fontWeight: 700, transition: 'background 0.2s',
                            opacity: v.out_of_stock ? 0.5 : 1,
                          }}
                        >
                          {isAdded ? '✓ Added' : '+ Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Popup */}
      {selected && (
        <div className="mg-overlay" onClick={() => setSelected(null)}>
          <div className="mg-popup" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
            <button className="mg-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>

            <div className="mg-popup-top" style={{ background: 'linear-gradient(135deg, #e8f5e0, #c8e6b0)', overflow: 'hidden', padding: selected.image_url ? 0 : undefined }}>
              {selected.image_url
                ? <Image src={selected.image_url} alt={selected.name} width={800} height={533} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
                : <span className="mg-popup-emoji">🌿</span>}
              <div className={`product-tag ${selected.tag_class || ''}`} style={{ margin: '12px auto 0' }}>{selected.tag || 'MICROGREEN'}</div>
            </div>

            <div className="mg-popup-body">
              {selected.out_of_stock && (
                <div style={{ background: '#fdecea', color: '#b0281e', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 8, marginBottom: 14, textAlign: 'center', letterSpacing: 0.4 }}>
                  ⚠ Currently Out of Stock — check back soon
                </div>
              )}

              <h2 className="mg-popup-name">{selected.name}</h2>
              <p className="mg-popup-taste">✦ Taste: {selected.taste}</p>
              <p className="mg-popup-desc">{selected.description}</p>

              <div className="mg-popup-section">
                <h4>Benefits</h4>
                <p>{selected.benefits}</p>
              </div>

              <div className="mg-popup-section">
                <h4>Key Nutrients</h4>
                <div className="mg-nutrients">
                  {(selected.nutrients || []).map((n) => <span key={n}>{n}</span>)}
                </div>
              </div>

              <div className="mg-popup-meta">
                <div><span>🕐 Grow Time</span><strong>{selected.grow_time}</strong></div>
                <div><span>📦 Tray Size</span><strong>{selected.serving_size}</strong></div>
                <div><span>🥗 Daily Intake</span><strong>{selected.daily_intake}</strong></div>
              </div>

              <div className="mg-popup-uses">
                <h4>Best Used In</h4>
                <div className="product-uses">
                  {(selected.uses || []).map((u) => <span key={u}>{u}</span>)}
                </div>
              </div>

              {/* Pack size selector */}
              {!selected.out_of_stock && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Pack Size</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {PACKS.map((pack) => {
                      const price = packPrice(selected.name, pack);
                      const isActive = selectedPack.label === pack.label;
                      return (
                        <button
                          key={pack.label}
                          onClick={() => setSelectedPack(pack)}
                          style={{
                            flex: 1, padding: '10px 6px', borderRadius: 10,
                            border: `2px solid ${isActive ? '#4a7c59' : '#e0e0da'}`,
                            background: isActive ? '#eef5e6' : '#fff',
                            cursor: 'pointer', textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? '#2d4a2d' : '#555' }}>{pack.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#4a7c59', marginTop: 2 }}>₹{price}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                {!selected.out_of_stock && (
                  <>
                    <button
                      onClick={(e) => handleBuyNow(selected, selectedPack, e)}
                      style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#2d4a2d', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5 }}
                    >
                      🛒 BUY NOW — ₹{packPrice(selected.name, selectedPack)}
                    </button>
                    <button
                      onClick={(e) => handleAddToCart(selected, selectedPack, e)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 10,
                        border: '2px solid #4a7c59', background: addedKey === `${selected.name}__${selectedPack.label}` ? '#eef5e6' : '#fff',
                        color: '#4a7c59', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {addedKey === `${selected.name}__${selectedPack.label}` ? '✓ ADDED TO CART' : '+ ADD TO CART'}
                    </button>
                  </>
                )}
                <Link
                  href="/subscription"
                  onClick={() => setSelected(null)}
                  style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: 10, border: '1px solid #ccc', color: '#555', fontSize: 12, fontWeight: 600, textDecoration: 'none', letterSpacing: 0.3 }}
                >
                  📅 Subscribe & Save More
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
