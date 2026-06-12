'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { createClient } from '@/lib/supabase/client';

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

async function safeJson(res) {
  try { return await res.json(); } catch { return { error: `Server error (${res.status})` }; }
}

const DEFAULT_PRICE = 249; // fallback if item has no price

const DURATION_LABEL = {
  monthly: 'Monthly',
  quarterly: 'Every 3 months',
  half_yearly: 'Every 6 months',
  yearly: 'Yearly',
};

export default function CartDrawer({ open, onClose }) {
  const { items, removeItem, updateQty, clearCart, totalCount } = useCart();
  const drawerRef = useRef(null);
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout'

  // Checkout form state
  const [form, setForm] = useState({ full_name: '', phone: '', line1: '', line2: '', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '' });
  const [pinStatus, setPinStatus] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState(null);
  const [devOtp, setDevOtp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Load Razorpay script
  useEffect(() => {
    const id = 'rzp-script';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id; s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.async = true;
    document.body.appendChild(s);
  }, []);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        // Pre-fill from profile
        supabase.from('profiles').select('full_name, phone, verified_phone, phone_verified_at').eq('id', data.user.id).maybeSingle().then(({ data: p }) => {
          if (!p) return;
          setForm((f) => ({ ...f, full_name: p.full_name || '', phone: p.verified_phone || p.phone || '' }));
          if (p.phone_verified_at && p.verified_phone) setPhoneVerified(true);
        });
        // Pre-fill default address
        supabase.from('addresses').select('*').eq('user_id', data.user.id).eq('is_default', true).maybeSingle().then(({ data: a }) => {
          if (!a) return;
          setForm((f) => ({ ...f, full_name: a.full_name || f.full_name, phone: a.phone || f.phone, line1: a.line1 || '', line2: a.line2 || '', city: a.city || 'Tirupati', state: a.state || 'Andhra Pradesh', pincode: a.pincode || '' }));
          if (a.pincode) checkPincode(a.pincode);
        });
      }
    });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setStep('cart');
      setError(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset phone verification if phone changes
  useEffect(() => {
    setPhoneVerified(false);
    setOtpSent(false);
    setOtp('');
    setOtpMsg(null);
  }, [form.phone]);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function checkPincode(value) {
    if (!/^\d{6}$/.test(value)) { setPinStatus(null); return; }
    setPinStatus({ checking: true });
    const res = await fetch(`/api/pincode-check?pincode=${value}`);
    const data = await safeJson(res);
    if (data.serviceable) {
      setPinStatus({ ok: true, message: `✓ Delivers to ${data.city}` });
      setForm((f) => ({ ...f, city: data.city, state: data.state }));
    } else {
      setPinStatus({ ok: false, message: data.message || data.error });
    }
  }

  async function sendOtp() {
    setOtpBusy(true); setOtpMsg(null); setDevOtp(null);
    const res = await fetch('/api/phone/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: form.phone }) });
    const data = await safeJson(res);
    setOtpBusy(false);
    if (!res.ok) { setOtpMsg({ type: 'error', text: data.error || 'Could not send OTP.' }); return; }
    setOtpSent(true);
    if (data.devOtp) { setDevOtp(data.devOtp); setOtpMsg({ type: 'success', text: 'OTP sent (dev mode).' }); }
    else setOtpMsg({ type: 'success', text: `OTP sent to +91 ${form.phone}.` });
  }

  async function verifyOtp() {
    setOtpBusy(true); setOtpMsg(null);
    const res = await fetch('/api/phone/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: form.phone, otp }) });
    const data = await safeJson(res);
    setOtpBusy(false);
    if (!res.ok) { setOtpMsg({ type: 'error', text: data.error || 'Verification failed.' }); return; }
    setPhoneVerified(true); setOtpSent(false); setDevOtp(null);
    setOtpMsg({ type: 'success', text: 'Phone verified ✓' });
  }

  async function placeOrder(e) {
    e.preventDefault();
    if (!pinStatus?.ok) { setError('Enter a serviceable pincode.'); return; }
    if (!phoneVerified) { setError('Verify your phone number first.'); return; }
    setBusy(true); setError(null);

    // Build a single composite item description for the order
    const itemsDesc = items.map((i) => `${i.name} x${i.qty}`).join(', ');
    const totalAmt = items.reduce((s, i) => s + i.qty * (i.price || DEFAULT_PRICE), 0);

    try {
      const res = await fetch('/api/cart/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address: form }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Could not create order');

      if (data.stub) {
        clearCart(); onClose();
        window.location.href = '/account?welcome=1';
        return;
      }

      const rzp = new window.Razorpay({
        key: data.razorpay_key,
        amount: data.amount,
        currency: 'INR',
        name: '№40 TRAY',
        description: itemsDesc,
        order_id: data.razorpay_order_id,
        prefill: { name: form.full_name, email: user?.email, contact: form.phone },
        theme: { color: '#4a7c59' },
        handler: async (response) => {
          const verifyRes = await fetch('/api/cart/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, order_db_id: data.order_db_id }),
          });
          if (verifyRes.ok) {
            clearCart(); onClose();
            window.location.href = '/account?welcome=1';
          } else {
            setError('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.qty * (i.price || DEFAULT_PRICE), 0);
  const isEmpty = items.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div className={`cart-backdrop ${open ? 'cart-backdrop--open' : ''}`} />

      {/* Drawer */}
      <aside ref={drawerRef} className={`cart-drawer ${open ? 'cart-drawer--open' : ''}`}>
        <div className="cart-drawer-header">
          {step === 'checkout' ? (
            <button className="cart-back-btn" onClick={() => setStep('cart')}>← Back</button>
          ) : (
            <span className="cart-drawer-title">
              🛒 Cart {totalCount > 0 && <span className="cart-drawer-count">{totalCount}</span>}
            </span>
          )}
          <button className="cart-close-btn" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        <div className="cart-drawer-body">
          {step === 'cart' && (
            <>
              {isEmpty ? (
                <div className="cart-empty">
                  <span className="cart-empty-icon">🌱</span>
                  <p>Your cart is empty.</p>
                  <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
                    Click any microgreen card to add it.
                  </p>
                </div>
              ) : (
                <>
                  <ul className="cart-items">
                    {items.map((item) => {
                      const key = item.cartKey || item.name;
                      return (
                      <li key={key} className="cart-item">
                        <span className="cart-item-emoji">{item.emoji}</span>
                        <div className="cart-item-info">
                          <strong>{item.name}</strong>
                          <span className="cart-item-taste">{item.packLabel || item.taste}</span>
                        </div>
                        <div className="cart-item-right">
                          <div className="cart-qty-row">
                            <button className="cart-qty-btn" onClick={() => updateQty(key, item.qty - 1)}>−</button>
                            <span className="cart-qty-val">{item.qty}</span>
                            <button className="cart-qty-btn" onClick={() => updateQty(key, item.qty + 1)}>+</button>
                          </div>
                          <span className="cart-item-price">{inr(item.qty * (item.price || DEFAULT_PRICE))}</span>
                          <button className="cart-remove-btn" onClick={() => removeItem(key)} aria-label="Remove">✕</button>
                        </div>
                      </li>
                      );
                    })}
                  </ul>

                  <div className="cart-subtotal-row">
                    <span>Subtotal</span>
                    <strong>{inr(subtotal)}</strong>
                  </div>
                  <p className="cart-delivery-note">Free delivery · Arrives this Sunday</p>

                  <div className="cart-drawer-actions">
                    {user ? (
                      <button className="btn-primary cart-checkout-btn" onClick={() => setStep('checkout')}>
                        <span>PROCEED TO CHECKOUT</span>
                      </button>
                    ) : (
                      <Link href="/login" className="btn-primary cart-checkout-btn" onClick={onClose}>
                        <span>SIGN IN TO CHECKOUT</span>
                      </Link>
                    )}
                    <Link href="/subscription" className="cart-sub-link" onClick={onClose}>
                      Or explore subscription plans →
                    </Link>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form className="cart-checkout-form" onSubmit={placeOrder}>
              <h3 className="cart-form-heading">Delivery Details</h3>
              {error && <div className="cart-form-error">{error}</div>}

              <div className="cart-form-row">
                <label>Full Name</label>
                <input required value={form.full_name} onChange={(e) => upd('full_name', e.target.value)} placeholder="Your name" />
              </div>

              <div className="cart-form-row">
                <label>Phone {phoneVerified && <span className="verified-tag">✓ Verified</span>}</label>
                <div className="phone-row">
                  <input
                    required
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={form.phone}
                    onChange={(e) => upd('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={phoneVerified}
                    style={{ flex: 1 }}
                  />
                  {!phoneVerified && (
                    <button type="button" className="otp-send-btn" onClick={sendOtp} disabled={otpBusy || !/^[6-9]\d{9}$/.test(form.phone)}>
                      {otpBusy ? '…' : otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {!phoneVerified && otpSent && (
                <div className="cart-otp-box">
                  <label>Enter OTP</label>
                  <div className="phone-row">
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP"
                      inputMode="numeric"
                      className="otp-input"
                    />
                    <button type="button" className="otp-verify-btn" onClick={verifyOtp} disabled={otpBusy || otp.length !== 6}>
                      {otpBusy ? '…' : 'VERIFY'}
                    </button>
                  </div>
                  {devOtp && (
                    <p className="dev-otp-note">🛠 Dev OTP: <code>{devOtp}</code></p>
                  )}
                </div>
              )}
              {otpMsg && (
                <p className={otpMsg.type === 'error' ? 'cart-form-error' : 'cart-form-success'}>{otpMsg.text}</p>
              )}

              <div className="cart-form-row">
                <label>Address Line 1</label>
                <input required placeholder="Flat, House no., Building, Street" value={form.line1} onChange={(e) => upd('line1', e.target.value)} />
              </div>
              <div className="cart-form-row">
                <label>Address Line 2 <span style={{ color: '#aaa' }}>(optional)</span></label>
                <input placeholder="Landmark, area" value={form.line2} onChange={(e) => upd('line2', e.target.value)} />
              </div>

              <div className="cart-form-2col">
                <div className="cart-form-row">
                  <label>Pincode</label>
                  <input
                    required
                    pattern="[0-9]{6}"
                    placeholder="6 digits"
                    value={form.pincode}
                    onChange={(e) => { upd('pincode', e.target.value); checkPincode(e.target.value); }}
                  />
                  {pinStatus?.checking && <small className="pin-note">Checking…</small>}
                  {pinStatus?.ok && <small className="pin-note pin-note--ok">{pinStatus.message}</small>}
                  {pinStatus?.ok === false && <small className="pin-note pin-note--err">{pinStatus.message}</small>}
                </div>
                <div className="cart-form-row">
                  <label>City</label>
                  <input required value={form.city} onChange={(e) => upd('city', e.target.value)} />
                </div>
              </div>

              {/* Order summary in checkout step */}
              <div className="cart-order-summary">
                <div className="cart-summary-title">Order Summary</div>
                {items.map((i) => (
                  <div key={i.cartKey || i.name} className="cart-summary-row">
                    <span>{i.emoji} {i.name}{i.packLabel ? ` (${i.packLabel})` : ''} × {i.qty}</span>
                    <span>{inr(i.qty * (i.price || DEFAULT_PRICE))}</span>
                  </div>
                ))}
                <div className="cart-summary-row cart-summary-total">
                  <strong>Total</strong>
                  <strong style={{ color: '#4a7c59' }}>{inr(subtotal)}</strong>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary cart-pay-btn"
                disabled={busy || !phoneVerified || !pinStatus?.ok}
              >
                <span>
                  {busy ? 'Processing…'
                    : !phoneVerified ? 'VERIFY PHONE TO CONTINUE'
                    : !pinStatus?.ok ? 'ENTER SERVICEABLE PINCODE'
                    : `PAY ${inr(subtotal)}`}
                </span>
              </button>
              <p className="cart-secure-note">🔒 Secure payment by Razorpay</p>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
