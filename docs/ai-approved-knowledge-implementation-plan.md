# Approved Knowledge Implementation Plan

Date: 2026-05-07
Checkpoint: `999607c Freeze AI knowledge approval model`

## 1. Purpose

This document plans the implementation of explicit approved knowledge in Skyvan.
It does not implement schema, migrations, Admin actions, provider calls,
embeddings, vector search, public AI, or Workshop AI.

The goal is to make AI-usable knowledge explicit, human-reviewed, governed, and
auditable before any provider or retrieval expansion begins.

## 2. Accepted Constraints From AI1 / AI1.1

- `completed` means processed, not approved.
- `approved` means human-reviewed and AI-usable.
- Approval state must be explicit.
- First implementation should add approval fields on `aiKnowledgeDocuments`.
- Existing `auditLogs` should trace approval state changes.
- A separate approval-history table is deferred unless multi-review workflow
  becomes necessary.
- Existing completed records must be backfilled as `pending_review`, not
  `approved`.
- Public AI remains blocked until approved knowledge and retrieval policy exist.
- Provider calls, embeddings, and vector search remain blocked until explicit
  approval exists.
- Workshop AI remains warnings-only and blocked from unapproved knowledge.
- AI cannot approve itself.
- Approval actions must use strict Admin actor resolution.
- Approval audit write failure must block the approval state change.

## 3. Current Schema Facts

From `db/schema.ts`:

- `parsingStatusEnum` values are `pending`, `processing`, `completed`, `failed`.
- `users` has `id`, `openId`, `name`, `email`, `loginMethod`, `role`,
  timestamps, and `lastSignedIn`. `role` is `user` or `admin`.
- `productDocuments` has `id`, `productId`, `type`, `title`, `url`, `note`,
  `sortOrder`, `status`, `createdAt`, `updatedAt`.
- `aiKnowledgeDocuments` has `id`, nullable `productId`, `title`, `docType`,
  `s3Key`, `parsingStatus`, `lastError`, `createdAt`, `updatedAt`.
- `aiDocumentChunks` has `id`, `documentId`, `chunkIndex`, `contentText`,
  `pageNumber`, `tokenCount`.
- `aiEmbeddings` has `chunkId` and `modelVersion`; it has no vector column yet.
- `auditLogs` has `id`, `entityType`, `entityId`, `adminUserId`, `action`,
  `previousState`, `newState`, `createdAt`.
- `auditActionEnum` is currently `create`, `update`, `delete`.
- Current general content status enum is `draft`, `active`, `archived`; it
  should not be reused for AI approval because approval has different semantics.

From `db/db.ts`:

- The project uses `drizzle-orm/neon-http`.
- Current project rules forbid `db.transaction`, `tx`, and advisory locks.

Current behavior facts:

- `getAiKnowledgeReadiness` currently treats completed parsing plus required
  metadata and chunks as AI-ready.
- `getAiGroundedChunkRecords` uses that implied readiness to select chunks.
- Product activation currently depends on implied AI-ready knowledge.
- Product document ingestion can create or update AI knowledge records and mark
  parsing as completed or failed.
- Datasheet completed-state transitions already have governance guardrails and
  strict audit actor usage.

## 4. Proposed Schema Plan

Preferred first implementation: add approval fields to `aiKnowledgeDocuments`.

Recommended new enum:

- `aiKnowledgeApprovalStatusEnum`
- Values: `pending_review`, `approved`, `rejected`, `revoked`

Recommended fields:

- `approvalStatus`: enum, not null, default `pending_review`
- `approvedAt`: timestamp, nullable
- `approvedBy`: uuid, nullable, references `users.id`
- `approvalNote`: text, nullable
- `rejectedAt`: timestamp, nullable
- `rejectedBy`: uuid, nullable, references `users.id`
- `rejectionReason`: text, nullable
- `revokedAt`: timestamp, nullable
- `revokedBy`: uuid, nullable, references `users.id`
- `revokedReason`: text, nullable

Actor fields:

- `approvedBy`, `rejectedBy`, and `revokedBy` should reference `users.id`.
- Actions must only accept authenticated Admin users resolved through strict
  actor binding. The FK records who acted; role enforcement remains in action
  logic.

Default behavior:

- New records default to `pending_review`.
- Ingestion completion does not set `approved`.
- Reprocessing an approved record should be treated carefully in AI2.x design:
  safest default is to return it to `pending_review` when source content or
  chunks change.

Nullable behavior:

- `approvedAt` and `approvedBy` are non-null only when status is `approved`.
- `rejectedAt`, `rejectedBy`, and `rejectionReason` are non-null only when
  status is `rejected`.
- `revokedAt`, `revokedBy`, and `revokedReason` are non-null only when status is
  `revoked`.
- `approvalNote` is optional for approval.

Reason/note requirements:

- `approvalNote`: optional, recommended max UI length 500 characters.
- `rejectionReason`: required by action, recommended max UI length 500
  characters.
- `revokedReason`: required by action, recommended max UI length 500
  characters.

Indexes:

- Index on `approvalStatus` for AI Core counts and Datasheet filters.
- Composite index on `productId, approvalStatus` for product readiness and
  product document summaries.
- Optional composite index on `parsingStatus, approvalStatus` for review queues.
- Existing or future chunk count queries may still need grouped chunk reads;
  no denormalized count is proposed in AI2.1.

Do not create a separate approval-history table in the first implementation.
Use `auditLogs.previousState` and `auditLogs.newState` for state-change trace.

## 5. Backfill Plan

Safe default: every existing `aiKnowledgeDocuments` row should receive
`approvalStatus = pending_review`.

Backfill rules:

- Existing `completed` records become `pending_review`, not `approved`.
- Existing `pending`, `processing`, and `failed` records also become
  `pending_review` as a neutral review-state default, but they remain blocked
  from approval by parsing preconditions.
- No existing record is auto-approved.
- Backfill must not generate `rejected` or `revoked`.
- Completed records without chunks remain `pending_review`, but approval action
  must block them.
- Non-rulebook completed records without a valid `productId` remain
  `pending_review`, but approval action must block them.

Why all existing rows use `pending_review`:

- It is deterministic.
- It avoids inventing review outcomes.
- It lets Admin filters show all records that need review or parsing repair.
- It keeps parsing lifecycle and approval lifecycle separate.

Reversibility:

- Local/dev review can revert the schema/migration before acceptance.
- Since no row is auto-approved, the backfill does not grant AI use to existing
  data.

## 6. Governance Action Plan

Future actions:

- `approveKnowledgeDocument`
- `rejectKnowledgeDocument`
- `revokeKnowledgeDocument`
- `resetKnowledgeReview` or `sendBackToReview`

Shared requirements:

- Input: document id, optional note/reason where applicable.
- Resolve actor with strict Admin actor binding.
- Fail closed if actor cannot be resolved.
- Read current document and chunk count before mutation.
- Write audit log for every state change.
- Treat audit write failure as a blocking error.
- Revalidate `/admin`, `/admin/ai-core`, `/admin/datasheets`,
  `/admin/products`, and product document pages for linked products.
- State messages should be Turkish and compact.
- Do not use `db.transaction` or `tx`; explicitly acknowledge Neon HTTP
  non-atomic multi-write risk.

`approveKnowledgeDocument`:

- Inputs: `id`, optional `approvalNote`.
- Preconditions:
  - `parsingStatus === "completed"`
  - title present
  - `s3Key` / depo key present
  - chunk count greater than zero
  - valid `productId` for non-rulebook docs
  - not currently `revoked` unless reset path has returned it to
    `pending_review`
  - strict actor resolved
  - audit write succeeds
- Success message direction: `Bilgi kaydı AI kullanımına açıldı.`
- Error message direction: explain the first blocking condition compactly.

`rejectKnowledgeDocument`:

- Inputs: `id`, required reason/note.
- Preconditions:
  - strict actor resolved
  - reason present
  - audit write succeeds
- Rejection blocks AI usage.
- Success message direction: `Bilgi kaydı reddedildi.`

`revokeKnowledgeDocument`:

- Inputs: `id`, required reason.
- Preconditions:
  - current approval status is `approved`
  - strict actor resolved
  - reason present
  - audit write succeeds
- Revocation blocks AI usage immediately.
- Success message direction: `Bilgi kaydı AI kullanımından geri çekildi.`

`resetKnowledgeReview` / `sendBackToReview`:

- Inputs: `id`, optional reason.
- Purpose: return `rejected` or `revoked` records to `pending_review` after
  source correction or reprocessing.
- Preconditions:
  - strict actor resolved
  - audit write succeeds
- This action must not approve anything.

## 7. Admin UI Plan

Keep UI compact and Turkish. Do not expose raw chunks by default.

Future labels:

- Onay bekliyor
- Onaylandı
- Reddedildi
- Geri çekildi
- AI kullanımına açık
- AI kullanımına kapalı
- Ayrıştırma tamamlandı

Datasheets page:

- Show parsing status and approval status as separate chips.
- Add filters for approval status.
- Add compact action buttons for approve/reject/revoke/reset.
- Show approval blockers in a small detail area.
- Keep raw chunk text hidden.

AI Core page:

- Add counts for approved, pending review, rejected, revoked.
- Keep parsing counters for pending, processing, completed, failed.
- Replace implied `readyCount` semantics with approved AI-usable counts.
- Keep provider/public readiness blocked until approved records exist.

Product document summary:

- Distinguish completed parsing from approved knowledge.
- Show whether a product has approved knowledge.
- Keep failure and pending-review states visible but non-canonical.

Products table / product activation guard:

- Product readiness chips should reflect approved knowledge, not just completed
  parsing.
- Product activation guard should eventually require approved knowledge.

Rules suggestion lab:

- Show whether evidence comes from approved knowledge.
- Filter canonical evidence to approved knowledge.
- Unapproved completed chunks may appear only as Admin review metadata, not
  canonical evidence.

Audit page:

- Existing audit log display can show approval state changes through
  `previousState` / `newState`.
- Add filtering by entity type only if needed in a later UI polish sprint.

## 8. Guardrail Update Plan

After schema exists, update these paths:

- `getAiKnowledgeReadiness` or a successor helper:
  - require `approvalStatus === "approved"` for AI-usable evidence.
  - keep parsing and metadata blockers separate from approval blockers.
- `getAiGroundedChunkRecords`:
  - fetch chunks only from approved knowledge.
- Product activation guard:
  - require approved knowledge, not just completed parsing.
- AI Core counts:
  - count parsing and approval states separately.
- Product document readiness summary:
  - distinguish active document, completed parsing, and approved knowledge.
- Rules suggestion evidence:
  - canonical evidence must come from approved knowledge.
- Future provider/retrieval filters:
  - every provider and retrieval path must filter to approved knowledge only.

Safe internal exception:

- Unapproved completed knowledge may appear in Admin review metadata and warning
  surfaces.
- It must not be used as canonical evidence or exposed publicly.

## 9. Implementation Sequence

AI2.1:

- Schema/migration planning and implementation for approval fields only.
- Add approval status enum or constrained field.
- Backfill all existing records to `pending_review`.
- No provider, embedding, vector search, public AI, or Workshop AI changes.

AI2.2:

- Admin approval badges and filters.
- Datasheets and AI Core should show parsing and approval as separate axes.

AI2.3:

- Approval/rejection/revocation/reset server actions.
- Strict actor resolution.
- Audit writes for every approval state change.
- Fail closed on actor or audit failure.

AI2.4:

- Update readiness helpers.
- Update product activation guard.
- Ensure AI-usable evidence requires approved knowledge.

AI2.5:

- Update AI Core, product document summaries, Products table, and Rules
  suggestion surfaces.
- Keep raw chunks hidden by default.

Only after AI2.x:

- Provider policy.
- Embeddings and vector search.
- Public AI.
- Workshop AI read-only warnings.

## 10. Risks

Neon HTTP non-atomic risk:

- Multi-write approval actions cannot claim DB transaction atomicity under the
  current project rules.
- Actions must be ordered carefully and fail closed.

Audit failure handling:

- Approval/rejection/revocation must not be considered successful if audit write
  fails.

Partial write risk:

- Without transactions, a status update and audit write can diverge if ordered
  poorly. AI2.3 must choose the least risky ordering and surface failure
  honestly.

Backfill risk:

- Operators may expect completed records to become approved. They must not.
- All completed records become `pending_review` and require human review.

UI confusion risk:

- Parsing and approval must be shown as separate chips/counters everywhere.
- Copy must avoid treating `Tamamlandı` as `Onaylandı`.

Existing completed records:

- Existing completed records are not approved.
- Provider, public, and canonical evidence usage remains blocked until review.

Operator workload:

- Backfill may create a large pending-review queue.
- AI Core and Datasheets should give compact filters to triage the queue.

## 11. Do-Not List

- Do not auto-approve completed records.
- Do not let AI approve itself.
- Do not use unapproved chunks as canonical evidence.
- Do not expose unapproved knowledge publicly.
- Do not add provider calls before approval enforcement.
- Do not add embeddings or vector search before approval enforcement.
- Do not add background ingestion in AI2.1.
- Do not claim multi-write approval actions are atomic under Neon HTTP.
- Do not bypass audit/governance.
- Do not expand Workshop AI or public AI in the approval implementation phase.

## 12. Final Recommendation

AI2.1 schema migration planning can begin.

AI2.1 should be limited to approval schema fields and deterministic backfill to
`pending_review`. It should not include provider calls, embeddings, vector
search, public AI, Workshop AI, or fake/demo data.
