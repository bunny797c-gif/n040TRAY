-- Seed all 12 subscription plans matching market pricing
-- Single (4 tiers) · Couple (4 tiers) · Family (4 tiers)

-- Wipe existing plans so we start clean (safe on fresh DB)
truncate table public.plans restart identity cascade;

insert into public.plans
  (id, name, audience, duration, price_inr, deliveries, serving_label, varieties_label, savings_pct, tag, is_active)
values

-- ── SINGLE ──────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'Single Monthly',     'single', 'monthly',     999,   4,  '~80g per delivery',  '1 variety per delivery',  null, null,         true),
(gen_random_uuid(), 'Single Quarterly',   'single', 'quarterly',  2799,  12,  '~80g per delivery',  '2 varieties per delivery',   7,  'POPULAR',    true),
(gen_random_uuid(), 'Single Half-Yearly', 'single', 'half_yearly', 4999,  26,  '~80g per delivery',  '2 varieties per delivery',  17,  'BEST VALUE', true),
(gen_random_uuid(), 'Single Yearly',      'single', 'yearly',      8999,  52,  '~80g per delivery',  '3 varieties per delivery',  25,  null,         true),

-- ── COUPLE ──────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'Couple Monthly',     'couple', 'monthly',     1799,   4,  '~160g per delivery', '2 varieties per delivery',  null, null,         true),
(gen_random_uuid(), 'Couple Quarterly',   'couple', 'quarterly',   5299,  12,  '~160g per delivery', '2 varieties per delivery',  12,  'POPULAR',    true),
(gen_random_uuid(), 'Couple Half-Yearly', 'couple', 'half_yearly', 9999,  26,  '~160g per delivery', '3 varieties per delivery',  17,  'BEST VALUE', true),
(gen_random_uuid(), 'Couple Yearly',      'couple', 'yearly',     16999,  52,  '~160g per delivery', '3 varieties per delivery',  29,  null,         true),

-- ── FAMILY ──────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'Family Monthly',     'family', 'monthly',     3499,   4,  '~320g per delivery', '3 varieties per delivery',  null, null,         true),
(gen_random_uuid(), 'Family Quarterly',   'family', 'quarterly',   9999,  12,  '~320g per delivery', '4 varieties per delivery',  17,  'POPULAR',    true),
(gen_random_uuid(), 'Family Half-Yearly', 'family', 'half_yearly',17999,  26,  '~320g per delivery', '4 varieties per delivery',  25,  'BEST VALUE', true),
(gen_random_uuid(), 'Family Yearly',      'family', 'yearly',     24999,  52,  '~320g per delivery', '4 varieties per delivery',  48,  null,         true);
