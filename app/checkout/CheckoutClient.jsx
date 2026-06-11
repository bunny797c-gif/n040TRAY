'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

async function safeJson(res) {
  try { return await res.json(); } catch { return { error: `Server error (${res.status})` }; }
}

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

const DURATION_LABEL = {
  monthly: 'Monthly',
  quarterly: 'Every 3 months',
  half_yearly: 'Every 6 months',
  yearly: 'Yearly',
};

export default function CheckoutClient({ plan, profile, defaultAddress, userEmail, verifiedPhone, phoneVerifiedAt }) {
  const router = useRouter();
  const initialPhone = defaultAddress?.phone || profile?.phone || verifiedPhone || '';
  const [form, setForm] = useState({
    full_name: defaultAddress?.full_name || profile?.full_name || '',
    phone: initialPhone,
    line1: defaultAddress?.line1 || '',
    line2: defaultAddress?.line2 || '',
    city: defaultAddress?.city || 'Tirupati',
    state: defaultAddress?.state || 'Andhra Pradesh',
    pincode: defaultAddress?.pincode || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [pinStatus, setPinStatus] = useState(null);

  // Variety preference
  const [varietyType, setVarietyType] = useState(null);
  const [varietyChoices, setVarietyChoices] = useState({}); // { member: variety } for individual/two_groups, or { '0': variety } for single

  // Phone OTP state
  const [phoneVerified, setPhoneVerified] = useState(
    Boolean(phoneVerifiedAt && verifiedPhone && verifiedPhone === initialPhone)
  );
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  // Load Razorpay script
  useEffect(() => {
    const id = 'rzp-script';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function checkPincode(value) {
    if (!/^\d{6}$/.test(value)) { setPinStatus(null); return; }
    setPinStatus({ checking: true });
    const res = await fetch(`/api/pincode-check?pincode=${value}`);
    const data = await res.json();
    if (data.serviceable) {
      setPinStatus({ ok: true, message: `✓ We deliver to ${data.city}` });
      setForm((f) => ({ ...f, city: data.city, state: data.state }));
    } else {
      setPinStatus({ ok: false, message: data.message || data.error });
    }
  }

  async function sendOtp() {
    setOtpBusy(true);
    setOtpMessage(null);
    setDevOtp(null);
    const res = await fetch('/api/phone/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.phone }),
    });
    const data = await safeJson(res);
    setOtpBusy(false);
    if (!res.ok) {
      setOtpMessage({ type: 'error', text: data.error || 'Could not send OTP.' });
      return;
    }
    setOtpSent(true);
    if (data.devOtp) {
      setDevOtp(data.devOtp);
      setOtpMessage({ type: 'success', text: `OTP sent (dev mode — see below).` });
    } else {
      setOtpMessage({ type: 'success', text: `OTP sent to +91 ${form.phone}.` });
    }
  }

  async function verifyOtp() {
    setOtpBusy(true);
    setOtpMessage(null);
    const res = await fetch('/api/phone/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.phone, otp }),
    });
    const data = await safeJson(res);
    setOtpBusy(false);
    if (!res.ok) {
      setOtpMessage({ type: 'error', text: data.error || 'Verification failed.' });
      return;
    }
    setPhoneVerified(true);
    setOtpSent(false);
    setDevOtp(null);
    setOtpMessage({ type: 'success', text: 'Phone verified ✓' });
  }

  // If user changes the phone after verifying, force re-verification
  useEffect(() => {
    if (phoneVerified && form.phone !== verifiedPhone) {
      setPhoneVerified(false);
      setOtpSent(false);
      setOtp('');
      setOtpMessage(null);
    }
  }, [form.phone, phoneVerified, verifiedPhone]);

  async function placeOrder(e) {
    e.preventDefault();
    if (!varietyType) {
      setError('Please select a variety preference.');
      return;
    }
    if (['single','individual','two_groups'].includes(varietyType)) {
      const needed = varietyType === 'single' ? 1 : varietyType === 'two_groups' ? 2 : (plan.audience === 'couple' ? 2 : 4);
      if (Object.keys(varietyChoices).length < needed) {
        setError('Please complete your variety selection.');
        return;
      }
    }
    if (!pinStatus?.ok) {
      setError('Please enter a serviceable pincode before placing your order.');
      return;
    }
    if (!phoneVerified) {
      setError('Please verify your phone number with OTP before placing the order.');
      return;
    }
    setBusy(true);
    setError(null);

    try {
      // 1. Create order on server (creates DB row + Razorpay order)
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id, address: form, variety_type: varietyType, variety_choices: Object.values(varietyChoices) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create order');

      // If Razorpay isn't configured, server may return a stub flow
      if (data.stub) {
        router.push('/account');
        router.refresh();
        return;
      }

      // 2. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: data.razorpay_key,
        amount: data.amount,
        currency: 'INR',
        name: 'The Tray Microgreens',
        description: `${plan.name} — ${plan.audience.toUpperCase()}`,
        order_id: data.razorpay_order_id,
        prefill: { name: form.full_name, email: userEmail, contact: form.phone },
        theme: { color: '#4a7c59' },
        handler: async (response) => {
          // 3. Verify payment on server
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_db_id: data.order_db_id,
              subscription_id: data.subscription_id,
            }),
          });
          if (verifyRes.ok) {
            router.push('/account?welcome=1');
            router.refresh();
          } else {
            setError('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const VARIETIES = ['Sunflower', 'Radish', 'Pea Shoots', 'Broccoli', 'Wheatgrass', 'Fenugreek'];
  const audience = plan.audience; // 'single' | 'couple' | 'family'

  const VARIETY_OPTIONS = {
    single: [
      { key: 'single',   icon: '🌱', title: 'One Variety',     desc: 'Same variety every week. You pick which one.' },
      { key: 'mixed',    icon: '🥗', title: 'Mixed Tray',      desc: 'Multiple varieties packed together each delivery.' },
      { key: 'rotation', icon: '🔄', title: 'Weekly Rotation', desc: 'A different variety each week, cycling through all 6.' },
    ],
    couple: [
      { key: 'single',     icon: '🌱', title: 'Same for Both',       desc: 'One variety for both of you. Pick which one.' },
      { key: 'individual', icon: '👫', title: 'Each Their Own',       desc: 'Person 1 picks one variety, Person 2 picks another — packed separately.' },
      { key: 'mixed',      icon: '🥗', title: 'Mixed Tray',          desc: 'Multiple varieties mixed together in each delivery.' },
      { key: 'rotation',   icon: '🔄', title: 'Weekly Rotation',     desc: 'One different variety each week, cycling for both of you.' },
    ],
    family: [
      { key: 'single',     icon: '🌱', title: 'Same for Everyone',   desc: 'One variety for the whole family. Pick which one.' },
      { key: 'two_groups', icon: '👨‍👩‍👧', title: 'Two Groups',           desc: 'Split the box — half one variety, half another.' },
      { key: 'individual', icon: '👨‍👩‍👧‍👦', title: 'Everyone\'s Own',      desc: 'Each family member picks their own variety — up to 4 portions.' },
      { key: 'mixed',      icon: '🥗', title: 'Mixed Tray',          desc: 'All varieties mixed together — great for adventurous families.' },
      { key: 'rotation',   icon: '🔄', title: 'Weekly Rotation',     desc: 'A different variety each week, enough for the whole family.' },
    ],
  };

  const memberLabels = {
    couple: ['Person 1', 'Person 2'],
    family: ['Member 1', 'Member 2', 'Member 3', 'Member 4'],
  };

  const needsPicker = ['single', 'individual', 'two_groups'].includes(varietyType);
  const pickerSlots =
    varietyType === 'single' ? ['You'] :
    varietyType === 'two_groups' ? ['Group 1', 'Group 2'] :
    varietyType === 'individual' ? (memberLabels[audience] || ['You']) : [];

  function pickVariety(slot, variety) {
    setVarietyChoices((prev) => ({ ...prev, [slot]: variety }));
  }

  function varietySummary() {
    if (!varietyType) return null;
    if (varietyType === 'mixed') return 'Mixed Tray';
    if (varietyType === 'rotation') return 'Weekly Rotation';
    const entries = Object.entries(varietyChoices);
    if (!entries.length) return null;
    if (varietyType === 'single') return entries[0]?.[1];
    return entries.map(([slot, v]) => `${slot}: ${v}`).join(' · ');
  }

  return (
    <div className="checkout-grid">

      {/* Variety Preference */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Choose Your Variety Preference</h2>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>How would you like your microgreens packed each week?</p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {(VARIETY_OPTIONS[audience] || VARIETY_OPTIONS.single).map((opt) => (
            <div
              key={opt.key}
              onClick={() => { setVarietyType(opt.key); setVarietyChoices({}); }}
              style={{
                flex: '1 1 160px',
                border: varietyType === opt.key ? '2px solid #4a7c59' : '2px solid #e0e8d8',
                borderRadius: 14,
                padding: '16px 14px',
                cursor: 'pointer',
                background: varietyType === opt.key ? '#f0f8ec' : '#fff',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>{opt.icon}</div>
              <strong style={{ display: 'block', fontSize: 14, color: '#222', marginBottom: 4 }}>{opt.title}</strong>
              <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.5 }}>{opt.desc}</p>
            </div>
          ))}
        </div>

        {/* Variety picker slots */}
        {needsPicker && pickerSlots.length > 0 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pickerSlots.map((slot) => (
              <div key={slot}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>{slot} — select a variety:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {VARIETIES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => pickVariety(slot, v)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 20,
                        border: varietyChoices[slot] === v ? '2px solid #4a7c59' : '2px solid #e0e8d8',
                        background: varietyChoices[slot] === v ? '#4a7c59' : '#fff',
                        color: varietyChoices[slot] === v ? '#fff' : '#444',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form className="card checkout-form" onSubmit={placeOrder}>
        <h2>Delivery Details</h2>
        {error && <div className="auth-error">{error}</div>}

        {/* Contact section */}
        <div className="cf-section">
          <p className="cf-section-label">Contact</p>

          <div className="cf-field">
            <label>Full Name</label>
            <input required placeholder="Your full name" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
          </div>

          <div className="cf-field">
            <label>
              Phone
              {phoneVerified && <span className="cf-verified-badge">✓ Verified</span>}
            </label>
            <div className="cf-phone-row">
              <input
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={phoneVerified}
              />
              {!phoneVerified && (
                <button
                  type="button"
                  className="cf-otp-send-btn"
                  onClick={sendOtp}
                  disabled={otpBusy || !/^[6-9]\d{9}$/.test(form.phone)}
                >
                  {otpBusy ? '…' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              )}
            </div>
          </div>

          {!phoneVerified && otpSent && (
            <div className="cf-otp-box">
              <label>Enter the 6-digit OTP</label>
              <div className="cf-otp-input-row">
                <input
                  className="cf-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="——————"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="cf-otp-verify-btn"
                  onClick={verifyOtp}
                  disabled={otpBusy || otp.length !== 6}
                >
                  {otpBusy ? 'Verifying…' : 'VERIFY'}
                </button>
              </div>
              {devOtp && (
                <p className="cf-hint cf-hint--checking">
                  Dev mode — OTP: <strong>{devOtp}</strong>
                </p>
              )}
            </div>
          )}

          {otpMessage && (
            <p className={`cf-hint ${otpMessage.type === 'error' ? 'cf-hint--err' : 'cf-hint--ok'}`}>
              {otpMessage.text}
            </p>
          )}
        </div>

        {/* Address section */}
        <div className="cf-section">
          <p className="cf-section-label">Delivery Address</p>

          <div className="cf-field">
            <label>Address Line 1</label>
            <input required placeholder="Flat / House no., Building, Street" value={form.line1} onChange={(e) => update('line1', e.target.value)} />
          </div>

          <div className="cf-field">
            <label>Address Line 2 <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
            <input placeholder="Landmark, area, colony" value={form.line2} onChange={(e) => update('line2', e.target.value)} />
          </div>

          <div className="form-row">
            <div className="cf-field">
              <label>City</label>
              <input required value={form.city} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div className="cf-field">
              <label>State</label>
              <input required value={form.state} onChange={(e) => update('state', e.target.value)} />
            </div>
          </div>

          <div className="cf-field" style={{ maxWidth: 180 }}>
            <label>Pincode</label>
            <input
              required
              pattern="[0-9]{6}"
              placeholder="6 digits"
              value={form.pincode}
              onChange={(e) => { update('pincode', e.target.value); checkPincode(e.target.value); }}
            />
            {pinStatus?.checking && <p className="cf-hint cf-hint--checking">Checking…</p>}
            {pinStatus?.ok && <p className="cf-hint cf-hint--ok">{pinStatus.message}</p>}
            {pinStatus?.ok === false && <p className="cf-hint cf-hint--err">{pinStatus.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="cf-submit"
          disabled={busy || !phoneVerified || !pinStatus?.ok}
        >
          {busy
            ? 'Processing...'
            : !phoneVerified
              ? 'Verify Phone to Continue'
              : !pinStatus?.ok
                ? 'Enter a Serviceable Pincode'
                : `Pay ${inr(plan.price_inr)}`}
        </button>
      </form>

      <aside className="card">
        <h2>Order Summary</h2>
        <div className="row">
          <div>
            <strong>{plan.name}</strong>
            <small>{plan.audience.toUpperCase()} · {DURATION_LABEL[plan.duration]}</small>
          </div>
          <div>{inr(plan.price_inr)}</div>
        </div>
        <div className="row">
          <div>
            <strong>Deliveries</strong>
            <small>Free home delivery</small>
          </div>
          <div>{plan.deliveries}</div>
        </div>
        <div className="row">
          <div><strong>Total</strong></div>
          <div><strong style={{ fontSize: 18, color: '#4a7c59' }}>{inr(plan.price_inr)}</strong></div>
        </div>

        {varietySummary() && (
          <div className="row">
            <div>
              <strong>Variety preference</strong>
              <small>{varietySummary()}</small>
            </div>
          </div>
        )}
        <div style={{ marginTop: 16, fontSize: 12, color: '#888', lineHeight: 1.6 }}>
          ✓ Sunday delivery · ✓ Skip with 2 days' notice · ✓ Secure payment by Razorpay
        </div>
      </aside>
    </div>
  );
}
