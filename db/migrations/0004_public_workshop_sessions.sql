CREATE TABLE IF NOT EXISTS public_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  last_seen_at timestamp NOT NULL DEFAULT now(),
  expires_at timestamp NOT NULL,
  revoked_at timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_public_sessions_token_hash
  ON public_sessions (token_hash);

CREATE INDEX IF NOT EXISTS idx_public_sessions_expires_at
  ON public_sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_public_sessions_last_seen_at
  ON public_sessions (last_seen_at);

ALTER TABLE builds
  ADD COLUMN IF NOT EXISTS public_session_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_builds_public_session_id_public_sessions'
      AND conrelid = 'builds'::regclass
      AND contype = 'f'
  ) THEN
    ALTER TABLE builds
      ADD CONSTRAINT fk_builds_public_session_id_public_sessions
      FOREIGN KEY (public_session_id)
      REFERENCES public_sessions(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_builds_public_session_id
  ON builds (public_session_id);
