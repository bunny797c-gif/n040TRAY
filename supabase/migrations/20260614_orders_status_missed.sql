-- Extend orders status check to allow 'missed' (customer not home / delivery failed).
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('created','paid','failed','cancelled','packed','out_for_delivery','delivered','missed'));
