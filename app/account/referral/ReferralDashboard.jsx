'use client';

import { useState, useEffect } from 'react';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReferralDashboard({ code, usesCount, maxUses, walletCoins }) {
  const [copied, setCopied] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  const shareLink = typeof window !== 'undefined'
    ? `${window.location.origin}/subscription?ref=${code}`
    : `/subscription?ref=${code}`;

  useEffect(() => {
    fetch('/api/referral')
      .then((r) => r.json())
      .then((d) => {
        if (d.rewards) setRewards(d.rewards);
        setLoading(false);
      });
  }, []);

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const coinsInRupees = Math.floor(walletCoins / 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Wallet card */}
      <div style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4f2d 100%)', borderRadius: 16, padding: '28px 24px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#c8e6b0', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Coin Wallet</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: '#fff' }}>🪙 {walletCoins}</span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          Worth ₹{coinsInRupees} · auto-applied on your next renewal
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Friends Joined', value: usesCount },
          { label: 'Coins Earned', value: `🪙 ${usesCount * 500}` },
          { label: 'Value Earned', value: `₹${usesCount * 50}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#f7fbf3', border: '1px solid #e0ead8', borderRadius: 14, padding: '16px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#7a8c78', marginTop: 4, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Share your code */}
      <div style={{ background: '#fff', border: '1.5px solid #e4e4dc', borderRadius: 16, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1a2e1a' }}>Your Referral Code</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: '#f0f7ea', border: '1.5px solid #b2d8a0', borderRadius: 10, padding: '14px 18px', fontFamily: 'monospace', fontSize: 24, fontWeight: 800, color: '#2d5a1b', letterSpacing: 2, textAlign: 'center' }}>
            {code}
          </div>
          <button
            onClick={copyCode}
            style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>

        <div style={{ background: '#fafaf7', border: '1px solid #e4e4dc', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareLink}</span>
          <button
            onClick={copyLink}
            style={{ background: 'none', border: '1.5px solid #e4e4dc', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Copy Link
          </button>
        </div>

        <p style={{ margin: '14px 0 0', fontSize: 12, color: '#888', lineHeight: 1.6 }}>
          Your friend gets <strong>🪙 500 coins (₹50 off)</strong> on their first order. You earn <strong>🪙 500 coins (₹50)</strong> when they pay.
        </p>
      </div>

      {/* People who joined */}
      <div style={{ background: '#fff', border: '1.5px solid #e4e4dc', borderRadius: 16, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1a2e1a' }}>Friends Who Joined</h3>
        {loading ? (
          <div style={{ color: '#999', fontSize: 13 }}>Loading…</div>
        ) : rewards.length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No one has used your code yet. Share it!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {rewards.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < rewards.length - 1 ? '1px solid #f5f5f0' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a2e1a', fontSize: 14 }}>{r.referee?.full_name || 'Anonymous'}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{fmtDate(r.created_at)}</div>
                </div>
                <div style={{ color: '#e07b39', fontWeight: 700, fontSize: 13 }}>+🪙 {r.coins_referrer}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{ background: '#f7fbf3', border: '1px solid #e0ead8', borderRadius: 16, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#1a2e1a' }}>How It Works</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '1', text: 'Share your code or link with a friend.' },
            { step: '2', text: 'They enter your code at checkout and get 🪙 500 coins (₹50 off) on their first order.' },
            { step: '3', text: 'Once they pay, you get 🪙 500 coins (₹50) added to your wallet.' },
            { step: '4', text: 'Your coins are automatically applied on your next subscription renewal.' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4a7c59', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{step}</div>
              <p style={{ margin: 0, fontSize: 13, color: '#4a6045', lineHeight: 1.5, paddingTop: 4 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
