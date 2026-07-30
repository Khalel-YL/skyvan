ALTER TABLE builds
  ADD COLUMN IF NOT EXISTS expires_at timestamp,
  ADD COLUMN IF NOT EXISTS retention_locked_at timestamp,
  ADD COLUMN IF NOT EXISTS retention_reason text;

CREATE INDEX IF NOT EXISTS idx_builds_expires_at
  ON builds (expires_at);

CREATE INDEX IF NOT EXISTS idx_builds_public_session_expires_at
  ON builds (public_session_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_leads_build_version_id
  ON leads (build_version_id);

CREATE INDEX IF NOT EXISTS idx_offers_lead_id
  ON offers (lead_id);

CREATE INDEX IF NOT EXISTS idx_orders_offer_id
  ON orders (offer_id);
