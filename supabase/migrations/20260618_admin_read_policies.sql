-- Admin-read RLS policies.
--
-- The admin dashboard reads every customer's data and relies on Supabase
-- Realtime (which runs through the browser anon client and therefore respects
-- RLS). Without an admin-wide SELECT policy the admin only receives realtime
-- events for their OWN rows, so cross-customer changes never trigger a sync.
--
-- public.is_admin() (SECURITY DEFINER, from 20260610_admin_site_content.sql)
-- returns true only for admins, so these policies are safe.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'subscriptions', 'orders', 'deliveries', 'referral_codes',
    'profiles', 'plans', 'serviceable_pincodes'
  ];
  pol text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    pol := t || '_admin_read';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname = pol
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (public.is_admin())', pol, t);
    END IF;
  END LOOP;
END $$;
