-- Replace single variety_choice text with a jsonb array to support multiple picks (couple/family)
alter table public.subscriptions
  add column if not exists variety_choices jsonb; -- e.g. ["Sunflower"] or ["Sunflower","Radish"] or [{"member":"Person 1","variety":"Sunflower"},...]
