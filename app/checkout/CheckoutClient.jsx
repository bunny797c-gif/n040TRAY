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

        <div className="form-row">
          <div>
            <label>Full Name</label>
            <input className="auth-form" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
          </div>
          <div>
            <label>Phone {phoneVerified && <span style={{color:'#4a7c59'}}>✓ Verified</span>}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={phoneVerified}
                style={{ flex: 1 }}
              />
              {!phoneVerified && (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={otpBusy || !/^[6-9]\d{9}$/.test(form.phone)}
                  style={{ background:'#fff8e8', color:'#b87800', border:'1.5px solid #f0d59a', borderRadius:10, padding:'0 14px', fontSize:12, fontWeight:700, whiteSpace:'nowrap', cursor:'pointer' }}
                >
                  {otpBusy ? '…' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              )}
            </div>
          </div>
        </div>

        {!phoneVerified && otpSent && (
          <div style={{ background:'#fafdf6', padding:14, borderRadius:10, border:'1px solid #e0e8d8' }}>
            <label style={{ display:'block', marginBottom:6 }}>Enter the 6-digit OTP</label>
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                style={{ flex:1, letterSpacing:'3px', textAlign:'center', fontSize:18, fontWeight:700 }}
              />
              <button
                type="button"
                onClick={verifyOtp}
                disabled={otpBusy || otp.length !== 6}
                style={{ background:'#7ab55c', color:'#fff', border:'none', borderRadius:10, padding:'0 20px', fontSize:13, fontWeight:700, cursor:'pointer' }}
              >
                {otpBusy ? 'Verifying…' : 'VERIFY'}
              </button>
            </div>
            {devOtp && (
              <p style={{ marginTop:8, fontSize:12, color:'#888' }}>
                🛠 <strong>Dev mode</strong>: SMS provider not configured. Your OTP is <code style={{ background:'#fff', padding:'2px 6px', borderRadius:4, fontWeight:700 }}>{devOtp}</code>
              </p>
            )}
          </div>
        )}
        {otpMessage && (
          <div className={otpMessage.type === 'error' ? 'auth-error' : 'auth-success'} style={{ marginTop:-6 }}>
            {otpMessage.text}
          </div>
        )}

        <div>
          <label>Address Line 1</label>
          <input required placeholder="Flat / House no., Building, Street" value={form.line1} onChange={(e) => update('line1', e.target.value)} />
        </div>
        <div>
          <label>Address Line 2 (optional)</label>
          <input placeholder="Landmark, area" value={form.line2} onChange={(e) => update('line2', e.target.value)} />
        </div>

        <div className="form-row">
          <div>
            <label>City</label>
            <input required value={form.city} onChange={(e) => update('city', e.target.value)} />
          </div>
          <div>
            <label>State</label>
            <input required value={form.state} onChange={(e) => update('state', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Pincode</label>
            <input
              required
              pattern="[0-9]{6}"
              placeholder="6 digits"
              value={form.pincode}
              onChange={(e) => { update('pincode', e.target.value); checkPincode(e.target.value); }}
            />
            {pinStatus?.checking && <small style={{color:'#888', marginTop:4, display:'block'}}>Checking…</small>}
            {pinStatus?.ok && <small style={{color:'#4a7c59', marginTop:4, display:'block', fontWeight:600}}>{pinStatus.message}</small>}
            {pinStatus?.ok === false && <small style={{color:'#c0392b', marginTop:4, display:'block', fontWeight:600}}>{pinStatus.message}</small>}
          </div>
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={busy || !phoneVerified || !pinStatus?.ok}
          style={{ marginTop: 12 }}
        >
          {busy
            ? 'Processing...'
            : !phoneVerified
              ? 'VERIFY PHONE TO CONTINUE'
              : !pinStatus?.ok
                ? 'ENTER SERVICEABLE PINCODE'
                : `PAY ${inr(plan.price_inr)}`}
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

        <div style={{ marginTop: 16, fontSize: 12, color: '#888', lineHeight: 1.6 }}>
          ✓ Sunday delivery · ✓ Skip with 2 days' notice · ✓ Secure payment by Razorpay
        </div>
      </aside>
    </div>
  );
}
