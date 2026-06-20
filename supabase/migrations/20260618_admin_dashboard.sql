-- Admin dashboard redesign: subscription payment tracking + realtime sync.

-- 1. Payment tracking columns on subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paid_until date;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_manual boolean NOT NULL DEFAULT false;

-- 2. Backfill paid_until for existing active/paused subs from start_date + plan duration.
--    monthly +1mo, quarterly +3mo, half_yearly +6mo, yearly +1yr.
UPDATE public.subscriptions s
SET paid_until = (s.start_date::date) + (
  CASE p.duration
    WHEN 'monthly'     THEN interval '1 month'
    WHEN 'quarterly'   THEN interval '3 months'
    WHEN 'half_yearly' THEN interval '6 months'
    WHEN 'yearly'      THEN interval '12 months'
    ELSE interval '1 month'
  END
)
FROM public.plans p
WHERE s.plan_id = p.id
  AND s.paid_until IS NULL
  AND s.start_date IS NOT NULL
  AND s.status IN ('active', 'paused');

-- 3. Enable Supabase Realtime on the tables the admin dashboard watches.
--    ALTER PUBLICATION ... ADD TABLE errors if the table is already a member,
--    so guard each with a pg_publication_tables existence check.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'subscriptions', 'orders', 'deliveries', 'referral_codes',
    'profiles', 'plans', 'microgreens_catalog', 'serviceable_pincodes', 'site_content'
  ];
BEGIN
  -- Publication may not exist on self-hosted setups; skip gracefully if so.
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY tables LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t)
         AND NOT EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
         )
      THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

-- 4. Index to find overdue subscriptions quickly during the auto-pause check.
CREATE INDEX IF NOT EXISTS subscriptions_paid_until_idx ON public.subscriptions (paid_until) WHERE status = 'active';
