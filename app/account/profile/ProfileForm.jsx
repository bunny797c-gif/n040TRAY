'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileForm({ email, initialName, phone, phoneVerified }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Save failed' });
    setMsg({ type: 'success', text: 'Profile updated.' });
    router.refresh();
  }

  return (
    <form className="addr-form" onSubmit={save} style={{ maxWidth: 520 }}>
      <h3>Profile Details</h3>

      {msg && <div className={`addr-msg addr-msg--${msg.type}`}>{msg.text}</div>}

      <div className="addr-form-row">
        <label>Full Name</label>
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="addr-form-row">
        <label>Email <span style={{ color: '#aaa', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(read-only)</span></label>
        <input value={email} disabled style={{ background: '#f4f4f0', color: '#888' }} />
      </div>

      <div className="addr-form-row">
        <label>Phone <span style={{ color: '#aaa', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(read-only)</span></label>
        <input value={phone ? `+91 ${phone}${phoneVerified ? '  ✓' : ''}` : 'Not set'} disabled style={{ background: '#f4f4f0', color: '#888' }} />
      </div>

      <p style={{ margin: 0, fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>
        To change your phone number, place a new order — the checkout flow re-verifies via OTP. To change email,
        contact <a href="mailto:hello@thetraymicrogreens.in" style={{ color: '#4a7c59' }}>hello@thetraymicrogreens.in</a>.
      </p>

      <div className="addr-form-actions">
        <button type="submit" disabled={busy || name.trim().length < 2} className="addr-btn-primary">
          {busy ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
