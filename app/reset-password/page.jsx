'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Supabase routes the recovery link to this page with a session in the URL fragment.
  // It auto-detects and persists; we just wait for SIGNED_IN / PASSWORD_RECOVERY before showing the form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data?.session) setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submit(e) {
    e.preventDefault();
    if (pw.length < 6) return setError('Password must be at least 6 characters.');
    if (pw !== pw2) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => router.push('/account'), 1500);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><img src="/logo/logo.png" alt="The Tray" /></div>

        {done ? (
          <>
            <h1 className="auth-title">Password Updated ✓</h1>
            <p className="auth-subtitle">Redirecting you to your account…</p>
          </>
        ) : !ready ? (
          <>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">Validating your reset link…</p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Set a New Password</h1>
            <p className="auth-subtitle">Choose something at least 6 characters long.</p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={submit}>
              <div>
                <label>New Password</label>
                <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label>Confirm Password</label>
                <input type="password" required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" />
              </div>
              <button type="submit" className="auth-submit" disabled={busy}>
                {busy ? 'Updating...' : 'UPDATE PASSWORD'}
              </button>
            </form>

            <p className="auth-foot">
              <Link href="/login">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
