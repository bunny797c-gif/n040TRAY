-- Add role column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'delivery_partner', 'admin'));

-- Delivery partners table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  phone text NOT NULL,
  full_name text NOT NULL,
  vehicle_type text CHECK (vehicle_type IN ('bike', 'bicycle', 'walk')),
  is_active boolean NOT NULL DEFAULT true,
  assigned_areas text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Delivery status log for audit trail
CREATE TABLE IF NOT EXISTS delivery_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add partner tracking columns to deliveries
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS delivery_partner_id uuid REFERENCES delivery_partners(id),
  ADD COLUMN IF NOT EXISTS picked_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_reason text;

-- RLS for delivery_partners
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read own row"
  ON delivery_partners FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all partners"
  ON delivery_partners FOR ALL
  USING (public.is_admin());

-- RLS for delivery_status_log
ALTER TABLE delivery_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read own logs"
  ON delivery_status_log FOR SELECT
  USING (changed_by = auth.uid());

CREATE POLICY "Partners can insert logs"
  ON delivery_status_log FOR INSERT
  WITH CHECK (changed_by = auth.uid());

CREATE POLICY "Admins can manage all logs"
  ON delivery_status_log FOR ALL
  USING (public.is_admin());

-- Partners can read their assigned deliveries
CREATE POLICY "Partners can read assigned deliveries"
  ON deliveries FOR SELECT
  USING (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = auth.uid()
    )
  );

-- Partners can update their assigned deliveries
CREATE POLICY "Partners can update assigned deliveries"
  ON deliveries FOR UPDATE
  USING (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = auth.uid()
    )
  );

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_partners;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_status_log;
