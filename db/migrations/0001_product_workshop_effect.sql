ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS product_sub_type text,
  ADD COLUMN IF NOT EXISTS workshop_effect text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS target_layer text,
  ADD COLUMN IF NOT EXISTS mesh_key text,
  ADD COLUMN IF NOT EXISTS material_key text,
  ADD COLUMN IF NOT EXISTS technical_specs jsonb NOT NULL DEFAULT '{}'::jsonb;
