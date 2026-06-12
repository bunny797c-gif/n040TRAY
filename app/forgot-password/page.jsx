'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><img src="/logo/logo.png" alt="The Tray" /></div>

        {sent ? (
          <>
            <h1 className="auth-title">Check your inbox</h1>
            <p className="auth-subtitle">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              It expires in 1 hour.
            </p>
            <Link href="/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 24 }}>
              BACK TO SIGN IN
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">Forgot Password?</h1>
            <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={submit}>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" className="auth-submit" disabled={busy || !email}>
                {busy ? 'Sending...' : 'SEND RESET LINK'}
              </button>
            </form>

            <p className="auth-foot">
              Remembered it? <Link href="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
