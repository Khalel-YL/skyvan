# AI Phase Readiness Audit

Date: 2026-05-07
Checkpoint: `13917c6 Finalize admin acceptance copy polish`

This audit is repo-grounded and read-only in intent. It does not approve schema
changes, provider integration, embeddings generation, background ingestion jobs,
or public AI behavior.

## Current Readiness

Overall recommendation: AI phase can begin with AI1, but only as a governance
and approval-model decision sprint. Provider integration and public AI behavior
are not ready yet.

Current state:

- Admin AI visibility exists in `app/admin/ai-core/page.tsx`.
- Datasheet and product document records can feed internal AI knowledge records.
- Product document ingestion can fetch, extract text, chunk content, and update
  knowledge-document status.
- Rules can be inspected and suggestion-assisted, but suggestions remain form
  prefill and do not auto-save.
- Governance helpers restrict product activation and completed datasheet
  transitions through runtime guardrails.
- Audit coverage exists, with strict audit actor paths for datasheets and
  best-effort compatibility paths for several other admin flows.
- No AI provider integration, no embedding generation, and no vector search path
  were found in the inspected files.

## Existing AI Data Model

From `db/schema.ts`:

- `productDocuments`: product-linked document registry with `productId`, `type`,
  `title`, `url`, `note`, `sortOrder`, `status`, and timestamps.
- `aiKnowledgeDocuments`: AI knowledge document registry with nullable
  `productId`, `title`, `docType`, `s3Key`, `parsingStatus`, `lastError`, and
  timestamps.
- `aiDocumentChunks`: extracted/chunked text storage with `documentId`,
  `chunkIndex`, `contentText`, `pageNumber`, and `tokenCount`.
- `aiEmbeddings`: currently stores `chunkId` and `modelVersion`.
- `compatibilityRules`: source/target product rule records with `ruleType`,
  `severity`, `priority`, and optional message.
- `ruleConditions`: optional model/package/scenario scope rows for rules.
- `ruleTemplates`: reusable rule template metadata.
- `parsingStatusEnum`: `pending`, `processing`, `completed`, `failed`.

Important gap: a `vector(1536)` custom type exists, but `aiEmbeddings` does not
currently include a vector column. The table is a placeholder for embedding
metadata, not usable vector retrieval.

Important gap: there is no explicit approval column such as `approvedAt`,
`approvedBy`, or `approvalStatus` on `aiKnowledgeDocuments`. AI readiness is
currently implied by `parsingStatus === "completed"`, required metadata, product
link rules, and chunk count.

## Surface Findings

### AI Core

Evidence: `app/admin/ai-core/page.tsx`, `app/lib/admin/governance.ts`,
`app/lib/admin/audit.ts`.

AI Core shows safe metadata and readiness counts. It hides raw document text in
the AI Core surface and lists only compact document metadata, chunk counts,
status labels, and blockers. Runtime governance and audit actor status are
visible. The page does not imply that AI can publish, approve orders, set prices,
or make final technical safety decisions.

Risk: AI Core depends on implied readiness, not an explicit approval state.

### Datasheets

Evidence: `app/admin/datasheets/page.tsx`,
`app/admin/datasheets/actions.ts`,
`app/admin/datasheets/validation.ts`,
`app/admin/datasheets/AddDatasheetDrawer.tsx`.

Datasheets are stored as `aiKnowledgeDocuments`. The admin surface shows
document type, parsing status, product binding, chunk count, duplicate key
signals, unsafe scheme checks, missing product references, and completed-without
chunks. Completed transitions are guarded by
`SKYVAN_ALLOW_MANUAL_AI_READY_STATUS`. Completed AI-ready records cannot be
downgraded or deleted through the guarded action paths.

Risk: storage-key validation blocks dangerous schemes, but storage-key safety is
not a full ingestion allowlist. Approval is still inferred from runtime state.

### Product Documents

Evidence: `app/admin/products/[productId]/documents/**`,
`app/admin/products/actions.ts`,
`app/admin/products/ProductsTable.tsx`.

Product documents are separate from `aiKnowledgeDocuments`, but active product
documents can sync into AI knowledge records. The product document page shows
safe AI readiness summaries and explicitly hides raw document text in the
summary surface. Product activation is blocked unless AI-ready knowledge exists.
Legacy active products without ready knowledge can be aligned back to draft.

Risk: product document ingestion fetches document URLs and extracts text inside
the action path. This is useful for the current admin phase but should be
governed before expansion into larger ingestion jobs.

### Rules Engine

Evidence: `app/admin/rules/**`, `app/lib/admin/governance.ts`.

Rules support `requires`, `excludes`, and `recommends`, with hard/soft severity
and optional model/package/scenario conditions. Rule suggestions use product
metadata, document signals, specs, scenarios, and AI chunks. Suggestions are not
final decisions; they open as form drafts. Rule save/delete flows validate
conflicts and write audit through the existing audit helper.

Risk: rule suggestions can display short evidence excerpts from chunk text in
`RuleSuggestionLab`. This is operator-facing, not public, but it should remain
controlled and reviewed before provider-driven AI is added.

### Governance And Audit

Evidence: `app/lib/admin/governance.ts`, `app/lib/admin/audit.ts`,
`app/admin/datasheets/actions.ts`, `app/admin/rules/actions.ts`.

AI can currently support explain/suggest/warn patterns in Admin. It does not
publish pages, approve orders, set prices, or make final safety decisions. Audit
and governance guardrails exist, but coverage is mixed: datasheets use strict
session-bound audit actors, while some other admin flows use compatibility
best-effort audit helpers.

Risk: Neon HTTP writes are not atomic across multi-step mutations because no DB
transaction pattern is used. This is known and consistent with the current
no-transaction rule, but AI expansion should avoid pretending multi-write
operations are atomic.

## Readiness Score Table

| Area | Status | Evidence | Risk | Recommended next sprint |
| --- | --- | --- | --- | --- |
| Datasheet records | PARTIAL | `aiKnowledgeDocuments`, datasheets page/actions | Implied approval, storage-key policy not final | AI2 |
| Product documents | PARTIAL | product document admin and ingestion action | Fetch/chunk path exists but is manual/action-bound | AI2 |
| AI knowledge documents | PARTIAL | `aiKnowledgeDocuments`, governance readiness | No explicit approval state | AI1 |
| Chunks / embeddings | PARTIAL | `aiDocumentChunks`, `aiEmbeddings` | Chunks exist; embeddings lack vector data | AI2 or later |
| Rules engine | READY | rules admin, conditions, suggestion draft flow | Suggestions need review discipline | AI4 |
| AI Core visibility | READY | AI Core page metadata and guardrail view | No explicit approval model yet | AI3 |
| Governance/audit | PARTIAL | governance and audit helpers | Strict/best-effort coverage is mixed | AI1 / AI2 |
| Admin UX readiness | READY | Admin acceptance freeze and AI surfaces | Live operator QA still needed | AI3 |
| Public AI readiness | BLOCKED | no public AI advisor inspected/in scope | No approved knowledge path yet | AI6 |
| Workshop Engineering AI readiness | PARTIAL | governance helpers expose read-only signals | Workshop renderer frozen; warnings only | AI5 |

## Blockers

- No explicit approved knowledge state exists.
- No provider integration or model policy exists.
- No embedding vector column or vector search path exists.
- No background ingestion/job governance exists.
- Datasheet and product document ingestion should receive a clearer approval
  boundary before AI provider work begins.
- Public AI should remain blocked until internal knowledge approval is explicit.

## Recommended AI Phase Sequence

1. AI1: Knowledge approval model decision.
2. AI2: Datasheet to approved knowledge governance path.
3. AI3: Admin AI Core safe explanation surface.
4. AI4: Rule-aware product explanation helper.
5. AI5: Workshop Engineering AI read-only warnings.
6. AI6: Public AI Advisor only after internal knowledge is approved.

## Strict Do-Not List For AI Entry

- Do not let AI publish content.
- Do not let AI set prices.
- Do not let AI approve orders or offers.
- Do not let AI make final technical safety decisions.
- Do not expose raw chunks publicly.
- Do not add provider calls before the approval model is decided.
- Do not add embeddings or vector search before the data contract is explicit.
- Do not bypass audit/governance guardrails.
- Do not expand Workshop renderer work during the AI phase kickoff.
