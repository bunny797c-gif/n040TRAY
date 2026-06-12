-- Add per-variety pricing columns to microgreens_catalog
alter table microgreens_catalog
  add column if not exists price_100g int default 249,
  add column if not exists price_200g int default 449,
  add column if not exists price_500g int default 999;
