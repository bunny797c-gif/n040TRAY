-- Varieties: admin-selectable flag for the homepage "Microgreens We Grow" grid
-- (show_on_home controls the /microgreens shop catalog; featured_home controls the homepage).
ALTER TABLE public.microgreens_catalog
  ADD COLUMN IF NOT EXISTS featured_home boolean NOT NULL DEFAULT false;
