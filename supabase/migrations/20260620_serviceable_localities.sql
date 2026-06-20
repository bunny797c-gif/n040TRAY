CREATE TABLE serviceable_localities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode text NOT NULL REFERENCES serviceable_pincodes(pincode) ON DELETE CASCADE,
  name text NOT NULL,
  locality_type text NOT NULL DEFAULT 'area' CHECK (locality_type IN ('village', 'street', 'colony', 'road', 'area', 'town')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pincode, name)
);

ALTER TABLE serviceable_localities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "localities_public_read" ON serviceable_localities
  FOR SELECT USING (is_active = true);

CREATE POLICY "localities_admin_write" ON serviceable_localities
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
