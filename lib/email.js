import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM || '№40 TRAY <hello@n40tray.in>';

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fmtINR(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function orderEmailHtml({ name, planName, audience, amount, deliveries, nextDelivery, address }) {
  return `<!doctype html>
  <html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#333">
    <div style="max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#4a7c59;color:#fff;padding:28px 24px;border-radius:14px 14px 0 0;text-align:center">
        <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:0.3px">№40 TRAY</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:14px">Nature's Finest. 40 Times Over.</p>
      </div>
      <div style="background:#fff;padding:32px 28px;border-radius:0 0 14px 14px">
        <h2 style="margin:0 0 8px;font-size:20px;color:#222">Order Confirmed ✅</h2>
        <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6">
          Hi ${name || 'there'}, thanks for subscribing! Your microgreens are on the way.
        </p>

        <div style="background:#f7fbf3;padding:18px 20px;border-radius:10px;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#7ab55c;font-weight:700;letter-spacing:0.5px">FIRST DELIVERY</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#222">${fmtDate(nextDelivery)}</p>
        </div>

        <table width="100%" style="border-collapse:collapse;font-size:14px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>Plan</strong></td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right">${planName} · ${audience?.toUpperCase()}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><strong>Total deliveries</strong></td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right">${deliveries}</td></tr>
          <tr><td style="padding:10px 0"><strong>Amount paid</strong></td><td style="padding:10px 0;text-align:right;font-size:16px;font-weight:700;color:#4a7c59">${fmtINR(amount)}</td></tr>
        </table>

        <div style="background:#fafdf6;padding:16px 20px;border-radius:10px;margin-top:20px">
          <p style="margin:0;font-size:12px;color:#888;letter-spacing:0.5px;text-transform:uppercase;font-weight:700">DELIVERY ADDRESS</p>
          <p style="margin:6px 0 0;font-size:14px;color:#444;line-height:1.55">
            ${address?.full_name}<br>
            ${[address?.line1, address?.line2, address?.city, address?.state, address?.pincode].filter(Boolean).join(', ')}<br>
            📱 ${address?.phone}
          </p>
        </div>

        <div style="margin-top:28px;padding:18px 20px;background:#fff8e8;border-radius:10px;border-left:3px solid #f0d59a">
          <p style="margin:0;font-size:13px;color:#7a5500;line-height:1.6">
            <strong>Travelling that Sunday?</strong> Pause or skip your delivery anytime <strong>Mon–Fri before Friday midnight</strong> from your account. If you don't pause and aren't home, the delivery is lost — no refund or reschedule.
          </p>
        </div>

        <div style="text-align:center;margin-top:28px">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://thetraymicrogreens.in'}/account" style="display:inline-block;background:#7ab55c;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:13px;letter-spacing:0.5px">MANAGE SUBSCRIPTION</a>
        </div>

        <p style="margin:28px 0 0;font-size:12px;color:#999;text-align:center;line-height:1.6">
          Need help? Reply to this email or WhatsApp us at +91 98765 43210.
        </p>
      </div>
      <p style="text-align:center;font-size:11px;color:#aaa;margin-top:20px">
        © ${new Date().getFullYear()} №40 TRAY · Tirupati, Andhra Pradesh
      </p>
    </div>
  </body></html>`;
}

export async function sendOrderConfirmation(to, payload) {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping confirmation email');
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: `Order confirmed — first delivery ${payload.nextDelivery ? new Date(payload.nextDelivery).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : 'soon'}`,
      html: orderEmailHtml(payload),
    });
    return { ok: true, id: result.data?.id };
  } catch (e) {
    console.error('[email] send failed', e);
    return { ok: false, error: String(e?.message || e) };
  }
}
