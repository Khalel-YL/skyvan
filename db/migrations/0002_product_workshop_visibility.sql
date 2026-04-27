ALTER TABLE products
  ADD COLUMN IF NOT EXISTS workshop_visibility text NOT NULL DEFAULT 'selectable_visual';
