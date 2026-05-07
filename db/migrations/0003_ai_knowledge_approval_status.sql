DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ai_knowledge_approval_status'
  ) THEN
    CREATE TYPE ai_knowledge_approval_status AS ENUM (
      'pending_review',
      'approved',
      'rejected',
      'revoked'
    );
  END IF;
END
$$;

ALTER TABLE ai_knowledge_documents
  ADD COLUMN IF NOT EXISTS approval_status ai_knowledge_approval_status NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS approved_at timestamp,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approval_note text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamp,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS revoked_at timestamp,
  ADD COLUMN IF NOT EXISTS revoked_by uuid,
  ADD COLUMN IF NOT EXISTS revoked_reason text;

UPDATE ai_knowledge_documents
SET approval_status = 'pending_review'
WHERE approval_status IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_ai_knowledge_documents_approved_by_users'
  ) THEN
    ALTER TABLE ai_knowledge_documents
      ADD CONSTRAINT fk_ai_knowledge_documents_approved_by_users
      FOREIGN KEY (approved_by) REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_ai_knowledge_documents_rejected_by_users'
  ) THEN
    ALTER TABLE ai_knowledge_documents
      ADD CONSTRAINT fk_ai_knowledge_documents_rejected_by_users
      FOREIGN KEY (rejected_by) REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_ai_knowledge_documents_revoked_by_users'
  ) THEN
    ALTER TABLE ai_knowledge_documents
      ADD CONSTRAINT fk_ai_knowledge_documents_revoked_by_users
      FOREIGN KEY (revoked_by) REFERENCES users(id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_documents_approval_status
  ON ai_knowledge_documents (approval_status);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_documents_product_approval
  ON ai_knowledge_documents (product_id, approval_status);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_documents_parsing_approval
  ON ai_knowledge_documents (parsing_status, approval_status);
