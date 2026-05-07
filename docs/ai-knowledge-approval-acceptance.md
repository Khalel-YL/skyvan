# AI Knowledge Approval Acceptance Freeze

Date: 2026-05-07
Latest commit: `76cd123 Document AI knowledge approval model`
Decision context: AI1.1 review freezes the AI Knowledge Approval Model before
AI2 implementation planning.

## Accepted Decisions

- `completed` means processed, not approved.
- `approved` means human-reviewed and AI-usable.
- Approval state must be explicit before provider calls, embeddings, public AI,
  or Workshop AI expansion.
- First implementation recommendation: add approval fields on
  `aiKnowledgeDocuments`.
- Existing `auditLogs` should trace approval state changes.
- A separate approval-history table is deferred unless a real multi-review
  workflow becomes necessary.
- Existing completed records must be backfilled as `pending_review`, not
  `approved`.
- Public AI remains blocked until approved knowledge and retrieval policy exist.
- Provider calls and embeddings remain blocked until the approval model is
  implemented.
- Workshop AI remains warnings-only and blocked from unapproved knowledge.

## Accepted Future Lifecycle

Parsing lifecycle:

- `pending`
- `processing`
- `completed`
- `failed`

Approval lifecycle:

- `pending_review`
- `approved`
- `rejected`
- `revoked`

Accepted lifecycle rules:

- Parsing status and approval status are separate axes.
- Failed parsing cannot be approved.
- Completed without chunks cannot be approved.
- Non-rulebook knowledge requires a valid `productId` before approval.
- Approved knowledge can be revoked.
- Rejected knowledge is reviewed and not usable by AI in its current form.
- Revoked knowledge was previously approved but is no longer usable by AI.

## Accepted Governance Rules

- Approval, rejection, and revocation must write an audit log.
- Approval actor resolution must be strict.
- Fake fallback actors are forbidden.
- AI cannot approve itself.
- AI may propose review notes only; a human must save the final decision.
- Audit write failure blocks the approval state change.
- Approval actions must fail closed when actor or audit requirements cannot be
  satisfied.
- Neon HTTP non-atomic multi-write risk must be stated honestly. Approval
  actions must not claim transaction-level atomicity under the current project
  no-transaction rule.

## Accepted Future UI Labels

Future visible Admin labels must remain Turkish:

- Onay bekliyor
- Onaylandı
- Reddedildi
- Geri çekildi
- Ayrıştırma tamamlandı
- AI kullanımına açık
- AI kullanımına kapalı

## AI2 Readiness Gate

AI2 may start only if it stays focused on schema/governance planning or
implementation for explicit approved knowledge.

AI2 must not add:

- Provider calls
- Embeddings or vector search
- Public AI
- Workshop AI expansion
- Fake/demo knowledge
- Approval bypasses

AI2 should plan or implement:

- Explicit approval state
- Strict approval/rejection/revocation actions
- Audit writes for approval state changes
- Admin filters/counts for parsing status and approval status
- Guardrails that require approved knowledge where AI-usable knowledge is needed

## Do-Not List

- Do not auto-approve completed records.
- Do not let AI approve itself.
- Do not use unapproved chunks as canonical evidence.
- Do not expose unapproved knowledge publicly.
- Do not add provider calls before the approval model is implemented.
- Do not add embeddings or vector search before approved knowledge is enforced.
- Do not claim multi-write approval actions are atomic under Neon HTTP.
- Do not bypass audit/governance.

## Final Acceptance Statement

AI1.1 accepts the approval model and allows AI2 planning to begin.
