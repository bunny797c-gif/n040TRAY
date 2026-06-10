// Pluggable SMS sender. Swap providers without touching the rest of the app.
//
// Supported (in priority order):
//   1. MSG91 — India-focused, cheap (set MSG91_AUTH_KEY + MSG91_TEMPLATE_ID)
//   2. Twilio — global (set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM)
//   3. Dev fallback — logs to console (used when no provider is configured)

async function sendViaMsg91(phone, otp) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) return null;
  const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${phone}&authkey=${authKey}&otp=${otp}`;
  const res = await fetch(url, { method: 'POST' });
  return res.ok;
}

async function sendViaTwilio(phone, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return null;
  const body = new URLSearchParams({
    From: from,
    To: `+91${phone}`,
    Body: `Your The Tray Microgreens OTP is ${otp}. Valid for 10 minutes.`,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return res.ok;
}

export async function sendOtp(phone, otp) {
  const m = await sendViaMsg91(phone, otp);
  if (m !== null) return { sent: m, provider: 'msg91' };
  const t = await sendViaTwilio(phone, otp);
  if (t !== null) return { sent: t, provider: 'twilio' };
  // Dev fallback
  console.log(`\n📱 [SMS DEV FALLBACK] OTP for ${phone}: ${otp}\n`);
  return { sent: true, provider: 'dev-console', dev: true };
}
