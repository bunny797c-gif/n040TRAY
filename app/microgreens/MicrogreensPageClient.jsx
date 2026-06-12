'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart';

export default function MicrogreensPageClient({ varieties }) {
  const [selected, setSelected] = useState(null);
  const [addedName, setAddedName] = useState(null);
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

  function handleAddToCart(v) {
    if (v.out_of_stock) return;
    addItem({
      name: v.name,
      image: v.image_url || null,
      tag: v.tag,
      taste: v.taste,
      desc: v.description,
      uses: v.uses || [],
      nutrients: v.nutrients || [],
      benefits: v.benefits,
      growTime: v.grow_time,
      servingSize: v.serving_size,
      dailyIntake: v.daily_intake,
    });
    setAddedName(v.name);
    setTimeout(() => setAddedName(null), 1800);
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
        {/* Search */}
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
              {filtered.map((v) => (
                <div
                  key={v.id}
                  className="product-card"
                  onClick={() => setSelected(v)}
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
                  </div>
                </div>
              ))}
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

              <div className="mg-popup-actions">
                <Link href="/subscription" className="btn-primary mg-subscribe-btn" onClick={() => setSelected(null)}>
                  <span>START A SUBSCRIPTION</span>
                </Link>
                <button
                  className={`mg-cart-btn ${addedName === selected.name ? 'mg-cart-btn--added' : ''} ${selected.out_of_stock ? 'mg-cart-btn--oos' : ''}`}
                  onClick={() => handleAddToCart(selected)}
                  disabled={selected.out_of_stock}
                  style={selected.out_of_stock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {selected.out_of_stock ? '✗ OUT OF STOCK' : addedName === selected.name ? '✓ ADDED' : '🛒 ADD TO CART'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
