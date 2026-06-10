# Praahis MicroSprouts

Full-stack Next.js app: Supabase auth + database, Razorpay payments, Vercel-ready.

## Stack

- **Frontend**: Next.js 14 (App Router, JavaScript)
- **Auth + DB**: Supabase (Email/Password + Google OAuth, Postgres + RLS)
- **Payments**: Razorpay (test or live keys)
- **Hosting**: Vercel (`bom1` region for India proximity)

---

## 1. Local development

```bash
cd praahis-app
npm install
npm run dev
```

Open <http://localhost:3000>.

The Supabase URL + anon key are already wired in `.env.local`. The Razorpay keys
are placeholders — see step 3 to activate real payments. Until you do, the
checkout will simulate a successful payment so you can test the full flow.

---

## 2. Configure Google OAuth (Supabase)

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an OAuth 2.0 Client (type: **Web application**).
3. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://<your-vercel-domain>`
4. Authorized redirect URIs:
   - `https://jpiztqskhqicwnvvowpm.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**.
6. In [Supabase Dashboard → Authentication → Providers → Google](https://supabase.com/dashboard/project/jpiztqskhqicwnvvowpm/auth/providers), enable Google and paste the credentials.
7. Save.

---

## 3. Get Razorpay keys

1. Sign in to <https://dashboard.razorpay.com>.
2. Switch to **Test Mode** (toggle top-right) for development.
3. Settings → API Keys → **Generate Test Key**.
4. Copy `Key Id` (starts with `rzp_test_`) and `Key Secret`.
5. Update `.env.local`:

   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
   ```

6. Restart `npm run dev`.

When ready for production: generate **Live Mode** keys and set them in Vercel
env vars (see step 5).

---

## 4. Database schema

Already applied to the Supabase project. Tables:

| Table          | Purpose                                                |
| -------------- | ------------------------------------------------------ |
| `profiles`     | Mirror of `auth.users` (auto-created via trigger)      |
| `addresses`    | Saved delivery addresses                               |
| `plans`        | 12-row catalog (3 audiences × 4 durations) — seeded    |
| `subscriptions`| Active/paused/cancelled customer subscriptions         |
| `orders`       | Payment records linked to Razorpay                     |
| `deliveries`   | Individual delivery audit trail                        |

All tables have RLS — users can only read/write their own rows.

---

## 5. Deploy to Vercel

```bash
npm i -g vercel
cd praahis-app
vercel
```

Then in the Vercel dashboard → Project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL        = https://jpiztqskhqicwnvvowpm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = sb_publishable_sc4wVYZ2LimOJZ9d87ac_g_a4W7Qw0z
NEXT_PUBLIC_RAZORPAY_KEY_ID     = <your rzp key id>
RAZORPAY_KEY_SECRET             = <your rzp key secret>
NEXT_PUBLIC_SITE_URL            = https://<your-domain>
```

Redeploy. That's it.

---

## 6. Routes

| URL              | Description                                       |
| ---------------- | ------------------------------------------------- |
| `/`              | Marketing homepage                                |
| `/subscription`  | Plan catalog (loaded from Supabase)               |
| `/login`         | Sign in (email + Google)                          |
| `/signup`        | Create account                                    |
| `/checkout?plan=`| Address form + Razorpay checkout                  |
| `/account`       | Dashboard (subscription, orders, address, pause/cancel) |
| `/auth/callback` | OAuth code exchange                               |
| `/api/checkout/create-order` | Server: create DB rows + Razorpay order |
| `/api/checkout/verify`       | Server: verify Razorpay signature + mark paid |

---

## 7. End-to-end test flow

1. Visit `/` → click **START A SUBSCRIPTION**.
2. On `/subscription`, choose **Single → Half Yearly** → **SUBSCRIBE NOW**.
3. Redirected to `/login?next=/checkout?plan=single_half` (since you're not signed in).
4. **Create Account** (email/password or Google).
5. Auto-redirected to `/checkout?plan=single_half`.
6. Fill delivery address → **PAY ₹4,999**.
7. Razorpay modal opens (or stub flow if keys not set).
8. After payment → redirected to `/account` showing active subscription.
9. From `/account` you can **Pause** or **Cancel**.

---

## Notes

- Subscriptions currently mark themselves "active" after first payment. For
  automatic recurring billing on quarterly+ plans, integrate
  [Razorpay Subscriptions](https://razorpay.com/docs/payments/subscriptions/)
  via the `subscriptions` API and store the `razorpay_subscription_id` on the
  `subscriptions` table (column already exists).
- Email confirmation is enabled by default in Supabase. To disable for faster
  signup, go to Supabase → Authentication → Sign In / Up → uncheck **Confirm email**.
