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
        body: JSON.stringify({ plan_id: plan.id, address: form }),
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

  return (
    <div className="checkout-grid">

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
