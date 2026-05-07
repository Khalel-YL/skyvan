# AI Knowledge Approval Model

Date: 2026-05-07
Checkpoint: `8337c79 Document AI phase readiness audit`

## 1. Purpose

This document decides the approval model Skyvan AI should use before provider
calls, embeddings, public AI, or Workshop AI expansion begin.

The core rule is simple: parsing completed is not the same as human approved.
AI may suggest, explain, classify, and warn, but it must not publish content,
set prices, approve offers or orders, or make final technical safety decisions.

## 2. Current Problem

The current repo has AI knowledge storage and readiness checks, but no explicit
human approval state. `aiKnowledgeDocuments.parsingStatus === "completed"` plus
metadata and chunk checks currently imply AI usability.

That is not enough for the next phase. A processed document can still be wrong,
outdated, unsafe, poorly extracted, product-mismatched, or unsuitable for public
or Workshop-facing AI.

## 3. Current Repo Evidence

Evidence from `db/schema.ts`:

- `aiKnowledgeDocuments` stores `productId`, `title`, `docType`, `s3Key`,
  `parsingStatus`, `lastError`, and timestamps.
- `aiDocumentChunks` stores extracted text chunks tied to
  `aiKnowledgeDocuments.id`.
- `aiEmbeddings` currently stores only `chunkId` and `modelVersion`; it does not
  store vector data yet.
- `productDocuments` is the product-linked document registry. Active product
  documents can be synced into AI knowledge records.

Evidence from `app/lib/admin/governance.ts`:

- `getAiKnowledgeReadiness` treats knowledge as usable when parsing is
  completed, title exists, storage key exists, required product link exists, and
  chunk count is greater than zero.
- `getAiGroundedChunkRecords` uses that readiness result to decide which chunks
  can become grounded evidence.
- Product-level AI decision signals are derived from the same implied readiness.

Evidence from `app/admin/datasheets/actions.ts`:

- Completed-state transitions are guarded by
  `SKYVAN_ALLOW_MANUAL_AI_READY_STATUS`.
- Completed AI-ready datasheet records are protected from downgrade/delete.
- Datasheet create/update/delete paths use strict session-bound audit actor
  resolution for guarded writes.

Evidence from `app/admin/products/actions.ts`:

- Product activation is blocked unless the product has AI-ready knowledge.
- Legacy active products without ready knowledge can be aligned back to draft.

Evidence from `app/admin/products/[productId]/documents/actions.ts`:

- Product document ingestion can fetch a source URL, extract text, generate
  chunks, update `aiKnowledgeDocuments`, and set parsing status to completed or
  failed.
- This is processing, not human approval.

Current approval gap:

- No `approvalStatus`.
- No `approvedAt` / `approvedBy`.
- No rejection or revocation state.
- No canonical distinction between processed knowledge and human-approved
  knowledge.

## 4. Options Compared

### Option A: Approval fields on `aiKnowledgeDocuments`

Future fields:

- `approvalStatus`: `pending_review` / `approved` / `rejected` / `revoked`
- `approvedAt`
- `approvedBy`
- `approvalNote`
- `rejectedAt`
- `rejectedBy`
- `rejectionReason`
- `revokedAt`
- `revokedBy`
- `revokedReason`

Pros:

- Simple and directly attached to the knowledge document.
- Easy to filter in AI Core, Datasheets, Product Documents, and product
  activation guards.
- Fits the current Admin pattern where compact status fields live on primary
  records.
- Lower UI and query complexity for AI1/AI2.
- Existing `auditLogs` can trace approval-state changes.

Cons:

- Limited approval history unless audit logs remain complete and reliable.
- Multi-stage review workflows would be harder to model later.
- Re-review history may require reading audit state rather than a dedicated
  approval timeline.

### Option B: Separate `aiKnowledgeApprovals` table

Future fields:

- `id`
- `documentId`
- `status`
- `reviewedBy`
- `reviewedAt`
- `note`
- `previousStatus`
- `createdAt`

Pros:

- Clear approval history.
- Supports multiple reviews and richer review workflows.
- Better fit if formal multi-operator review becomes mandatory.

Cons:

- More complex queries.
- More Admin UI work.
- More moving parts before provider and embeddings work can begin.
- Current repo patterns do not yet show a need for multi-stage approval history.

### Option C: Keep approval implied by `parsingStatus === "completed"`

Decision: reject.

Reasons:

- Completed means processed; approved means human-verified.
- Processed chunks may contain extraction errors, stale information, wrong
  product links, or unsafe content.
- Public AI and Workshop Engineering AI need explicit approval boundaries.
- Operators need separate visibility for parsing state and approval state.

## 5. Recommended Model

Recommendation: use explicit approval fields on `aiKnowledgeDocuments` for
AI1/AI2, backed by `auditLogs` for traceability.

Add a separate approval history table only if a real operator workflow later
requires multi-review history beyond audit logs.

Canonical approval state:

- `approvalStatus` on `aiKnowledgeDocuments`.
- Allowed values: `pending_review`, `approved`, `rejected`, `revoked`.

Future fields needed:

- `approvalStatus`
- `approvedAt`
- `approvedBy`
- `approvalNote`
- `rejectedAt`
- `rejectedBy`
- `rejectionReason`
- `revokedAt`
- `revokedBy`
- `revokedReason`

Who can approve:

- An authenticated Admin user resolved through strict audit actor binding.
- AI cannot approve itself.
- Env fallback or fake actor must not approve knowledge.

Who can revoke:

- An authenticated Admin user resolved through strict audit actor binding.
- Revocation should be available when knowledge becomes outdated, unsafe,
  product-mismatched, legally risky, or technically unreliable.

Rejected means:

- The document was reviewed and is not suitable for AI use in its current form.
- It may be corrected and reprocessed later, but rejection blocks AI usage.

Revoked means:

- The document was previously approved but is no longer allowed for AI use.
- Revocation blocks public AI, Workshop AI, and provider/embedding use.

Completed automatically approved:

- No. Completed only means parsing/chunking finished.

Public AI use of pending/completed-only knowledge:

- No. Public AI may use only `approvalStatus === "approved"` knowledge after
  provider and retrieval governance are implemented.

Internal Admin AI use of pending/completed-only knowledge:

- Pending, processing, failed, rejected, or revoked knowledge may appear as
  metadata and warnings.
- Completed but not approved knowledge may be shown in Admin readiness panels
  as review material.
- Completed but not approved knowledge must not be treated as canonical
  grounded evidence for final operator guidance.

## 6. Lifecycle And State Transitions

Parsing lifecycle:

- `pending`
- `processing`
- `completed`
- `failed`

Human approval lifecycle:

- `pending_review`
- `approved`
- `rejected`
- `revoked`

Normal flow:

1. Document created.
2. Parsing status starts as `pending`.
3. Parsing moves to `processing`.
4. Parsing completes as `completed`, or fails as `failed`.
5. Completed documents enter `pending_review`.
6. Human reviewer checks product link, title, source key, chunks, extraction
   quality, and technical relevance.
7. Human reviewer approves or rejects.
8. If approved knowledge later becomes unsafe, stale, or wrong, a human reviewer
   revokes it.

Rules:

- Parsing status and approval status are separate axes.
- Failed parsing cannot be approved.
- Completed without chunks cannot be approved.
- Non-rulebook knowledge must have a valid `productId` before approval.
- Product-linked knowledge must match the selected product context before
  approval.
- Public AI can only use approved knowledge.
- Workshop Engineering AI can use approved knowledge for read-only warnings only
  after explicit approval exists.

## 7. Governance And Audit Rules

Future approval, rejection, and revocation actions must:

- Write an audit log.
- Use strict session-bound Admin actor resolution.
- Fail closed if the actor cannot be resolved.
- Never use fake fallback actors.
- Never allow AI to approve, reject, or revoke its own knowledge.
- Allow AI to propose review notes only as suggestions.
- Require a human to save the final approval decision.
- Treat audit write failure as a blocking error for critical approval status
  changes.
- Acknowledge Neon HTTP non-atomic risk: multi-step writes are not true DB
  transactions under the current no-transaction project rule, so UI and actions
  must not imply atomic approval bundles.

Critical AI-facing behavior:

- Provider calls must filter to approved knowledge only.
- Embedding generation should run only for approved knowledge, or mark
  embeddings unusable until approval.
- Revoked or rejected knowledge must be excluded from retrieval.
- Approval changes should revalidate AI Core, Datasheets, Products, and Product
  Documents surfaces.

## 8. Future Admin UI Impact

Future visible Turkish labels:

- Onay bekliyor
- Onaylandı
- Reddedildi
- Geri çekildi
- Ayrıştırma tamamlandı
- AI kullanımına açık
- AI kullanımına kapalı

Datasheets page:

- Show parsing status and approval status separately.
- Add filters for approval status.
- Keep raw chunk text hidden by default.
- Show blockers for approval eligibility.

AI Core:

- Count approved, pending review, rejected, revoked, failed, and completed
  without chunks separately.
- Replace implied “AI ready” with explicit “AI kullanımına açık”.
- Keep provider/public AI readiness blocked until approved records exist.

Product document summary:

- Distinguish completed parsing from approved knowledge.
- Show whether a product has approved knowledge, not just completed knowledge.

Product activation guard:

- Eventually require approved knowledge, not merely completed knowledge.

Rules suggestions:

- Show whether suggestion evidence comes from approved knowledge.
- Do not use unapproved chunks as canonical evidence.

Public AI:

- Remains blocked until explicit approval exists and provider/retrieval policy is
  implemented.

## 9. Future Migration Plan

No migration is created in AI1.

Recommended future sequence:

1. Add approval status enum or constrained text field.
2. Add approval fields to `aiKnowledgeDocuments`.
3. Backfill existing records:
   - `completed` records become `pending_review`, not `approved`.
   - `pending`, `processing`, and `failed` records also remain not approved.
4. Add Admin filters and compact approval badges.
5. Add strict approval/rejection/revocation server actions.
6. Add audit writes for every approval state change.
7. Update `getAiKnowledgeReadiness` or successor helper so approval is required.
8. Update product activation logic to require approved knowledge.
9. Update AI Core counts and source rows.
10. Update product document summary.
11. Update rules suggestion evidence labels and filters.
12. Only then consider provider, embeddings, vector search, Workshop AI, or
    public AI work.

Backfill rule:

- Do not auto-approve existing completed records.
- All existing completed records need human review first.

## 10. Do-Not List

- Do not implement AI providers before explicit approval exists.
- Do not generate embeddings before approval policy is wired.
- Do not expose public AI before approved knowledge exists.
- Do not let AI approve itself.
- Do not use completed parsing as approval.
- Do not use fake approval actors.
- Do not bypass audit logs.
- Do not silently continue if approval audit writes fail.
- Do not expand Workshop renderer or public routes as part of approval work.
- Do not claim Neon HTTP multi-write approval operations are atomic.

## 11. Next Sprint Recommendation

Recommended next sprint: AI1.1 approval model review and acceptance freeze.

After AI1.1 acceptance, proceed to AI2 implementation planning for approved
knowledge schema and Admin governance path.
