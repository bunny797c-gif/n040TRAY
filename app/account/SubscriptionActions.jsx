'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function isLocked(now = new Date()) {
  const day = now.getDay();
  return day === 0 || day === 6;
}

export default function SubscriptionActions({ subscriptionId, status, nextDeliveryDate }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  const locked = useMemo(() => isLocked(), []);
  const isPaused = status === 'paused';

  async function call(endpoint, body, confirmText, label) {
    if (!confirm(confirmText)) return;
    setBusy(label);
    setMessage(null);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return setMessage({ type: 'error', text: data.error || 'Action failed.' });
    setMessage({ type: 'success', text: data.message });
    router.refresh();
  }

  function skip() {
    call('/api/subscriptions/skip', { subscription_id: subscriptionId },
      "Skip this Sunday's delivery? Your subscription continues normally — next delivery moves to the following Sunday.", 'skip');
  }

  function pause() {
    call('/api/subscriptions/toggle-pause', { subscription_id: subscriptionId, action: 'pause' },
      'Pause your subscription? No deliveries until you resume. Nothing is lost.', 'pause');
  }

  function resume() {
    call('/api/subscriptions/toggle-pause', { subscription_id: subscriptionId, action: 'resume' },
      'Resume your subscription? Your next delivery will be the upcoming Sunday.', 'resume');
  }

  return (
    <div className="acct-actions">
      {locked ? (
        <div className="acct-action-locked">🔒 Actions locked Sat–Sun during delivery weekend</div>
      ) : isPaused ? (
        <button className="acct-action-btn acct-action-btn--resume" disabled={!!busy} onClick={resume}>
          {busy === 'resume' ? 'Resuming…' : '▶ Resume Subscription'}
        </button>
      ) : (
        <div className="acct-action-pair">
          <button className="acct-action-btn acct-action-btn--skip" disabled={!!busy} onClick={skip}>
            {busy === 'skip' ? '…' : '⏭ Skip This Sunday'}
          </button>
          <button className="acct-action-btn acct-action-btn--pause" disabled={!!busy} onClick={pause}>
            {busy === 'pause' ? '…' : '⏸ Pause'}
          </button>
        </div>
      )}
      <p className="acct-action-note">
        ⚠ Actions lock from Friday midnight. If you miss the window and aren't home, the delivery is lost.
      </p>
      {message && (
        <div className={`acct-action-msg acct-action-msg--${message.type}`}>{message.text}</div>
      )}
    </div>
  );
}
