-- Seed all 12 subscription plans matching market pricing
-- Single (4 tiers) · Couple (4 tiers) · Family (4 tiers)

-- Wipe existing plans so we start clean (safe on fresh DB)
truncate table public.plans restart identity cascade;

insert into public.plans
  (id, name, audience, duration, price_inr, deliveries, serving_label, varieties_label, savings_pct, tag, is_active)
values

-- ── SINGLE (1 person · 4 varieties × 25g = 100g per delivery) ───────────────
(gen_random_uuid(), 'Single Monthly',     'single', 'monthly',     999,   4,  '4 varieties · 25g each',  'Curated weekly mix',  null, null,         true),
(gen_random_uuid(), 'Single Quarterly',   'single', 'quarterly',  2799,  12,  '4 varieties · 25g each',  'Curated weekly mix',   7,  'POPULAR',    true),
(gen_random_uuid(), 'Single Half-Yearly', 'single', 'half_yearly', 4999,  26,  '4 varieties · 25g each',  'Curated weekly mix',  17,  'BEST VALUE', true),
(gen_random_uuid(), 'Single Yearly',      'single', 'yearly',      8999,  52,  '4 varieties · 25g each',  'Curated weekly mix',  25,  null,         true),

-- ── COUPLE (2 people · 4 varieties × 50g = 200g per delivery) ───────────────
(gen_random_uuid(), 'Couple Monthly',     'couple', 'monthly',     1799,   4,  '4 varieties · 50g each',  'Curated weekly mix',  null, null,         true),
(gen_random_uuid(), 'Couple Quarterly',   'couple', 'quarterly',   5299,  12,  '4 varieties · 50g each',  'Curated weekly mix',  12,  'POPULAR',    true),
(gen_random_uuid(), 'Couple Half-Yearly', 'couple', 'half_yearly', 9999,  26,  '4 varieties · 50g each',  'Curated weekly mix',  17,  'BEST VALUE', true),
(gen_random_uuid(), 'Couple Yearly',      'couple', 'yearly',     16999,  52,  '4 varieties · 50g each',  'Curated weekly mix',  29,  null,         true),

-- ── FAMILY (4 people · 4 varieties × 100g = 400g per delivery) ──────────────
(gen_random_uuid(), 'Family Monthly',     'family', 'monthly',     3499,   4,  '4 varieties · 100g each', 'Curated weekly mix',  null, null,         true),
(gen_random_uuid(), 'Family Quarterly',   'family', 'quarterly',   9999,  12,  '4 varieties · 100g each', 'Curated weekly mix',  17,  'POPULAR',    true),
(gen_random_uuid(), 'Family Half-Yearly', 'family', 'half_yearly',17999,  26,  '4 varieties · 100g each', 'Curated weekly mix',  25,  'BEST VALUE', true),
(gen_random_uuid(), 'Family Yearly',      'family', 'yearly',     24999,  52,  '4 varieties · 100g each', 'Curated weekly mix',  48,  null,         true);
