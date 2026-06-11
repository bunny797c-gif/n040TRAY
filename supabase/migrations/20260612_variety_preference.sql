-- Variety preference for subscriptions
alter table public.subscriptions
  add column if not exists variety_type text check (variety_type in ('single','mixed','rotation')) default 'mixed',
  add column if not exists variety_choice text; -- only used when variety_type = 'single', stores the variety name
