-- Orders: store cart items + delivery date, and extend status flow for
-- Amazon-style tracking (created → paid → packed → out_for_delivery → delivered).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS items jsonb,
  ADD COLUMN IF NOT EXISTS delivery_date date;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('created','paid','failed','cancelled','packed','out_for_delivery','delivered'));
