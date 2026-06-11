'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function isLocked(now = new Date()) {
  const day = now.getDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

export default function SubscriptionActions({ subscriptionId, status, nextDeliveryDate }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null); // 'skip' | 'pause' | 'resume'
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
    call(
      '/api/subscriptions/skip',
      { subscription_id: subscriptionId },
      'Skip just this Sunday\'s delivery? Your subscription continues normally — next delivery moves to the following Sunday.',
      'skip'
    );
  }

  function pause() {
    call(
      '/api/subscriptions/toggle-pause',
      { subscription_id: subscriptionId, action: 'pause' },
      'Pause your subscription? No deliveries arrive until you resume. Nothing is lost — they continue when you come back.',
      'pause'
    );
  }

  function resume() {
    call(
      '/api/subscriptions/toggle-pause',
      { subscription_id: subscriptionId, action: 'resume' },
      'Resume your subscription? Your next delivery will be the upcoming Sunday.',
      'resume'
    );
  }

  const btnBase = {
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    cursor: locked ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: 13,
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  };

  return (
    <>
      <div style={{ paddingTop: 18, borderTop: '1px solid #f0f0f0', marginTop: 8 }}>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.55, marginBottom: 14 }}>
          <strong style={{ color: '#444', display: 'block', marginBottom: 4 }}>
            {isPaused
              ? 'Your subscription is paused.'
              : 'Going away? You have two options:'}
          </strong>
          {isPaused
            ? 'No deliveries arrive while paused. Your remaining deliveries are saved — they continue from the Sunday after you resume.'
            : (
              <>
                <strong>Skip</strong> — miss just this Sunday, deliveries continue next week.<br/>
                <strong>Pause</strong> — freeze indefinitely, resume any time (nothing lost).
              </>
            )}
          <br/>
          <em style={{ color: '#aaa', fontSize: 12 }}>
            ⚠ Both actions lock from Friday midnight until Sunday delivery passes. If you don't act in time and aren't home, the delivery is lost (no refund or reschedule).
          </em>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {locked ? (
            <button disabled style={{ ...btnBase, background: '#f5f5f5', color: '#aaa', border: '1.5px solid #e5e5e5' }}>
              🔒 Locked until Monday
            </button>
          ) : isPaused ? (
            <button
              disabled={!!busy}
              onClick={resume}
              style={{ ...btnBase, background: '#4a7c59', color: '#fff' }}
            >
              {busy === 'resume' ? 'Resuming…' : '▶ Resume Subscription'}
            </button>
          ) : (
            <>
              <button
                disabled={!!busy}
                onClick={skip}
                style={{ ...btnBase, background: '#fff8e8', color: '#b87800', border: '1.5px solid #f0d59a' }}
              >
                {busy === 'skip' ? 'Skipping…' : '⏭ Skip This Sunday'}
              </button>
              <button
                disabled={!!busy}
                onClick={pause}
                style={{ ...btnBase, background: '#fff', color: '#4a5d7c', border: '1.5px solid #cbd5e0' }}
              >
                {busy === 'pause' ? 'Pausing…' : '⏸ Pause Subscription'}
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={message.type === 'error' ? 'auth-error' : 'auth-success'} style={{ marginTop: 12 }}>
          {message.text}
        </div>
      )}
    </>
  );
}
