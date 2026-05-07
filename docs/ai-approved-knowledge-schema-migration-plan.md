# Approved Knowledge Schema Migration Plan

Date: 2026-05-07
Checkpoint: `6901992 Plan approved knowledge implementation`

## 1. Purpose

This document is the final planning checkpoint before any approved knowledge
schema implementation. It does not modify `db/schema.ts`, create migrations,
run migrations, or change application behavior.

The accepted rule remains: parsing `completed` means processed, not human
approved.

## 2. Accepted Prerequisites

- Approval state must be explicit before provider calls, embeddings, vector
  search, public AI, or Workshop AI expansion.
- First implementation direction is approval fields on `aiKnowledgeDocuments`.
- Existing completed records must become `pending_review`, not `approved`.
- No existing record may be auto-approved.
- Approval actions must be strictly governed and audited in later app work.
- `db.transaction`, `tx`, advisory locks, provider calls, embeddings, vector
  search, public AI, and Workshop AI remain out of scope.

## 3. Current Schema Facts

Existing enums in `db/schema.ts`:

- `roleEnum`: `user`, `admin`
- `statusEnum`: `draft`, `active`, `archived`
- `docTypeEnum`: `manual`, `datasheet`, `rulebook`
- `parsingStatusEnum`: `pending`, `processing`, `completed`, `failed`
- `auditActionEnum`: `create`, `update`, `delete`

Existing AI tables:

- `aiKnowledgeDocuments`:
  - `id`
  - `productId`
  - `title`
  - `docType`
  - `s3Key`
  - `parsingStatus`
  - `lastError`
  - `createdAt`
  - `updatedAt`
- `aiDocumentChunks`:
  - `id`
  - `documentId`
  - `chunkIndex`
  - `contentText`
  - `pageNumber`
  - `tokenCount`
- `aiEmbeddings`:
  - `chunkId`
  - `modelVersion`

Existing actor and audit tables:

- `users`:
  - `id`
  - `openId`
  - `name`
  - `email`
  - `loginMethod`
  - `role`
  - `createdAt`
  - `updatedAt`
  - `lastSignedIn`
- `auditLogs`:
  - `id`
  - `entityType`
  - `entityId`
  - `adminUserId`
  - `action`
  - `previousState`
  - `newState`
  - `createdAt`

Current facts:

- `aiKnowledgeDocuments` has `parsingStatus` but no `approvalStatus`.
- `aiEmbeddings` has `chunkId` and `modelVersion` but no vector column.
- `auditActionEnum` currently has `create`, `update`, `delete` only.
- `users.id` is the likely actor FK target for approval actor fields.
- The project uses `drizzle-orm/neon-http` from `db/db.ts`.
- `db.transaction` must not be introduced.

## 4. Future Enum Plan

Future TypeScript export name:

- `aiKnowledgeApprovalStatusEnum`

Future DB enum name:

- `ai_knowledge_approval_status`

Values:

- `pending_review`
- `approved`
- `rejected`
- `revoked`

Default:

- `pending_review`

Why not reuse `statusEnum`:

- `statusEnum` describes generic content lifecycle: `draft`, `active`,
  `archived`.
- Knowledge approval needs review-specific states and revocation semantics.

Why not reuse `parsingStatusEnum`:

- `parsingStatusEnum` describes processing state.
- Approval describes human review and AI usability.
- These must remain separate axes.

Do not implement the enum in AI2.1.

## 5. Future Column Plan

Future fields on `aiKnowledgeDocuments`:

| Field | Type | Nullable | Default | Relation | Set when | Cleared / null behavior |
| --- | --- | --- | --- | --- | --- | --- |
| `approvalStatus` | `aiKnowledgeApprovalStatusEnum` | no | `pending_review` | none | row creation/backfill and every approval state change | never null |
| `approvedAt` | timestamp | yes | none | none | status changes to `approved` | null for `pending_review`, `rejected`, `revoked` |
| `approvedBy` | uuid | yes | none | `users.id` | status changes to `approved` | null for `pending_review`, `rejected`, `revoked` |
| `approvalNote` | text | yes | none | none | optional on approve | may remain null; clear on reject/revoke/reset unless intentionally retained in audit only |
| `rejectedAt` | timestamp | yes | none | none | status changes to `rejected` | null for `pending_review`, `approved`, `revoked` |
| `rejectedBy` | uuid | yes | none | `users.id` | status changes to `rejected` | null for `pending_review`, `approved`, `revoked` |
| `rejectionReason` | text | yes | none | none | required by reject action | null unless status is `rejected` |
| `revokedAt` | timestamp | yes | none | none | status changes to `revoked` | null for `pending_review`, `approved`, `rejected` |
| `revokedBy` | uuid | yes | none | `users.id` | status changes to `revoked` | null for `pending_review`, `approved`, `rejected` |
| `revokedReason` | text | yes | none | none | required by revoke action | null unless status is `revoked` |

Reason and note rules for future app work:

- `approvalNote` should be optional and compact.
- `rejectionReason` should be required by action.
- `revokedReason` should be required by action.
- UI should enforce reasonable text limits, likely 500 characters.

Do not add these fields in AI2.1.

## 6. Future Index Plan

Recommended indexes:

- `approvalStatus`
  - Supports AI Core counts.
  - Supports Datasheets approval filters.
- `productId + approvalStatus`
  - Supports product readiness checks.
  - Supports product document summary.
  - Supports future retrieval filters scoped to a product.
- `parsingStatus + approvalStatus`
  - Supports review queue filters.
  - Separates parsing completion from approval state.
  - Helps find completed-but-unapproved records.

Do not add indexes in AI2.1.

## 7. Backfill Plan

Future migration backfill:

- All existing `aiKnowledgeDocuments` rows get
  `approvalStatus = pending_review`.
- Existing `completed` records are not approved.
- Existing `pending`, `processing`, and `failed` records are not approved.
- `rejected` and `revoked` are not generated by backfill.
- Completed records without chunks stay `pending_review` but are blocked from
  approval by future action preconditions.
- Non-rulebook rows without `productId` stay `pending_review` but are blocked
  from approval by future action preconditions.

Why:

- Deterministic.
- No fake trust.
- No auto approval.
- Operator review is required.
- Existing data does not become AI-usable automatically.

## 8. Migration Ordering

Safe future order:

1. Add new enum `ai_knowledge_approval_status`.
2. Add approval fields to `aiKnowledgeDocuments` with safe defaults and nullable
   actor/reason fields.
3. Add approval indexes.
4. Backfill existing rows to `pending_review`.
5. Validate local schema generation.
6. Run type check.
7. Do not update app readiness logic in the same migration-only step unless
   explicitly allowed.

Clarifications:

- AI2.1 is only planning.
- AI2.2 or a future explicitly approved sprint should implement schema.
- App logic should not treat approval as active until code is updated.
- No migration should create approved knowledge automatically.

## 9. Rollback And Risk Notes

Dev rollback:

- If a local migration is wrong, revert the migration file and schema changes
  before any dependent app code lands.
- Because no records are auto-approved, local rollback should not accidentally
  grant AI access.

Production rollback:

- Production rollback needs care after approval fields receive real data.
- Removing approval fields after operators use them would lose governance state.
- Production rollback should be treated as a data-governance decision, not only
  a code revert.

Non-atomic risk:

- Neon HTTP non-atomic risk is not solved by this schema.
- The migration itself should not introduce `db.transaction`.
- Later approval actions must not claim multi-write atomicity under Neon HTTP.

Trust risk:

- No existing completed record should become AI-usable automatically.
- Provider/public/canonical evidence use remains blocked until app logic requires
  `approvalStatus = approved`.

## 10. Future Code Touchpoints

Future implementation files, not to be edited in AI2.1:

- `db/schema.ts`
  - Add `pgEnum`.
  - Extend `aiKnowledgeDocuments`.
  - Add indexes.
- Migration file
  - Generated or manually reviewed.
  - Must backfill to `pending_review`.
- `app/admin/datasheets`
  - Later filters, badges, and approval actions.
- `app/admin/ai-core`
  - Later approval counts and source-row filtering.
- `app/lib/admin/governance.ts`
  - Later readiness helper update so AI-usable knowledge requires approval.
- Product activation guard
  - Later approval requirement instead of implied completed readiness.
- Product document summaries
  - Later completed-vs-approved display.
- Rules suggestion lab
  - Later canonical evidence filtering to approved knowledge only.

## 11. Do-Not List

- Do not modify `db/schema.ts` in AI2.1.
- Do not create migration files in AI2.1.
- Do not run migrations.
- Do not add provider calls.
- Do not add embeddings or vector search.
- Do not add public AI.
- Do not touch Workshop.
- Do not auto-approve completed records.
- Do not use unapproved chunks as canonical evidence.
- Do not introduce `db.transaction`, `tx`, advisory locks, or fake data.

## 12. Final Recommendation

AI2.1 planning is accepted if this document is complete.

Next sprint should be AI2.2 schema implementation only after explicit user
approval for schema and migration work.
