'use client';

// Shared formatters, styles, and small UI atoms used across all admin tabs.

export function inr(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// Today in IST as 'YYYY-MM-DD' — matches lib/dates.todayIST() but client-safe.
export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Next upcoming Sunday (IST) as 'YYYY-MM-DD'.
export function nextSundayStr() {
  const ymd = todayIST();
  const d = new Date(ymd + 'T00:00:00Z');
  const days = (7 - d.getUTCDay()) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #e4e4dc',
  borderRadius: 10, fontSize: 14, background: '#fafaf7', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
};

export const STATUS_COLORS = {
  active:          { bg: '#e8f5e0', color: '#3d6b2e' },
  paused:          { bg: '#e8edf5', color: '#3a5080' },
  pending_payment: { bg: '#fff4e0', color: '#9a6200' },
  payment_due:     { bg: '#fdecea', color: '#b0281e' },
  cancelled:       { bg: '#fdecea', color: '#b0281e' },
  expired:         { bg: '#f0f0f0', color: '#666' },
  paid:            { bg: '#e8f5e0', color: '#3d6b2e' },
  created:         { bg: '#fff4e0', color: '#9a6200' },
  failed:          { bg: '#fdecea', color: '#b0281e' },
  packed:          { bg: '#e8edf5', color: '#3a5080' },
  out_for_delivery:{ bg: '#fff4e0', color: '#9a6200' },
  delivered:       { bg: '#1a2e1a', color: '#c8e6b0' },
  missed:          { bg: '#fdecea', color: '#b0281e' },
};

export function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f0f0f0', color: '#555' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>
      {String(status || '').replace(/_/g, ' ')}
    </span>
  );
}

// Pack label + colour helpers keyed by plan audience.
export function packLabel(audience) {
  if (audience === 'single') return '4 var · 25g each · 100g box';
  if (audience === 'couple') return '4 var · 50g each · 200g box';
  if (audience === 'family') return '4 var · 100g each · 400g box';
  return '—';
}

export function packBadge(audience) {
  const bg = { single: '#eef5e6', couple: '#e8f0ff', family: '#fff4e6' };
  const col = { single: '#3d6b2e', couple: '#2e4a8a', family: '#8a5a2e' };
  return { bg: bg[audience] || '#f5f5f0', color: col[audience] || '#555' };
}

// Payment status derived from a subscription's status + paid_until.
// Returns one of: 'active' | 'payment_due' | 'paused' | <raw status>.
export function paymentState(sub, today = todayIST()) {
  if (sub.status === 'active' && sub.paid_until && sub.paid_until < today) return 'payment_due';
  return sub.status;
}
