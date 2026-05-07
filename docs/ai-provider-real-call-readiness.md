# AI Provider Real Call Readiness

## Purpose

This document is the final readiness gate before any real AI provider call in
Skyvan Admin. It does not enable provider calls and does not change runtime
behavior.

The document defines the conditions for a later Admin-only real provider call.
Public AI, Workshop AI, embeddings, and vector search remain closed.

## Current State

- AI provider policy exists in `docs/ai-provider-policy.md`.
- A disabled provider adapter exists in `app/lib/ai/provider.ts`.
- Admin AI Core has a disabled manual probe.
- Approved knowledge enforcement is active.
- `approvedForAi` means technical readiness plus human approval.
- `getAiGroundedChunkRecords` only uses `approvedForAi` evidence.
- Current provider output is disabled or not implemented.

## Provider Selection

This document does not select a provider by default. The first real provider
must be explicitly selected before implementation.

### OpenAI

OpenAI is a possible first provider if the project owner selects it explicitly.
It should be enabled only after environment, evidence, audit, and rate/cost
rules are accepted.

### Gemini

Gemini is a possible first provider if the project owner selects it explicitly.
It should follow the same Admin-only and approved-evidence boundaries.

### Keep Disabled

Keeping the provider disabled remains the safest default until all gates are
accepted:

- key and environment policy
- bounded excerpt limits
- metadata audit policy
- rate and cost limits

Native `fetch` is preferred for the first implementation to avoid dependency
churn unless an SDK is explicitly approved.

## Native Fetch vs SDK

The first real call should prefer native `fetch`.

Reasons:

- no dependency churn
- clear timeout control with `AbortController`
- simpler fail-closed behavior
- easier metadata-only audit boundaries

An SDK can be reconsidered later if provider-specific features require it.

## Environment Policy

A future real call should require all of:

- `AI_PROVIDER_ENABLED=1`
- `AI_PROVIDER=openai` or `AI_PROVIDER=gemini`
- `AI_MODEL_ID`
- matching provider key:
  - `OPENAI_API_KEY` for OpenAI
  - `GEMINI_API_KEY` for Gemini

Rules:

- Do not require these values in `app/lib/env.ts` yet.
- Optional reads remain safer until the feature is explicitly enabled.
- Missing or invalid provider config must fail closed with Turkish UI copy.
- Never print, log, or expose environment values.

## Evidence Payload Policy

The first real provider call may only use `approvedForAi` evidence.

Allowed:

- `documentId`
- `chunkId`
- `title`
- `docType`
- `pageNumber`
- `chunkIndex`
- `tokenCount`
- bounded excerpt only if explicitly approved in the implementation sprint

Forbidden:

- pending, rejected, or revoked knowledge
- full documents
- full PDFs
- raw URLs
- storage keys
- secrets
- environment values
- customer, order, or offer PII
- Workshop, public, or offers context
- unbounded chunk dumps

## Bounded Excerpt Limits

If excerpts are approved later:

- max chunks: 5
- max characters per chunk: 600
- max total evidence characters: 2,500
- max output characters: 700
- no full document dump
- no raw hidden URL or storage key
- trim whitespace
- prefer short Turkish answers
- provider must say when evidence is insufficient

## Prompt And Output Rules

The provider must be instructed:

- output Turkish only
- answer shortly
- remain advisory
- avoid final engineering, safety, legal, commercial, or production decisions
- never claim approval
- never publish, activate products, create offers, or create orders
- never expose hidden raw evidence
- state when evidence is insufficient
- label output as AI-generated advisory text

## Admin Trigger Policy

- Manual Admin-triggered calls only.
- No automatic call on page load.
- No background or batch provider calls.
- No public route exposure.
- No Workshop exposure.
- Strict Admin actor is required.

## Audit And Logging Policy

Before real calls, decide whether to add metadata-only strict audit.

Recommended metadata:

- actor id
- feature name
- provider name
- model id
- evidence document ids
- evidence chunk ids
- success or failure
- timeout or failure reason category
- approximate token/cost estimate if available
- timestamp

Rules:

- Do not store raw prompt in the first real call phase.
- Do not store raw output in the first real call phase.
- Do not write audit unless explicitly approved for the real-call sprint.
- If governance accountability is required, use strict actor and
  metadata-only audit.

## Rate, Cost, And Timeout Policy

Before real calls:

- per-admin daily limit is required
- global daily limit is required
- max chunks is required
- max evidence characters is required
- max output characters is required
- timeout with `AbortController` is required
- no retry storm
- provider failure must fail closed
- no automatic retries beyond one controlled request

Suggested initial limits:

- per-admin daily limit: 20
- global daily limit: 100
- max chunks: 5
- max evidence characters: 2,500
- max output characters: 700
- timeout: 15 seconds

## Failure Policy

Fail closed if:

- provider disabled
- provider unsupported
- key missing
- model missing
- timeout
- provider error
- insufficient approved evidence
- strict actor fails

Turkish messages:

- "AI sağlayıcı devre dışı."
- "AI sağlayıcı yapılandırması eksik."
- "Onaylı kaynak yetersiz."
- "AI açıklaması şu anda üretilemedi."
- "Yetkili admin aktörü doğrulanamadı."

## Recommended AI3.7 Options

### Option A: Continue Docs-Only

Choose the provider later and keep runtime disabled.

### Option B: OpenAI-Only Admin Call

Implement an OpenAI-only real Admin AI Core call with native `fetch`.

### Option C: Gemini-Only Admin Call

Implement a Gemini-only real Admin AI Core call with native `fetch`.

### Option D: Provider-Agnostic Adapter

Keep the provider-agnostic adapter but enable exactly one provider by env.

### Option E: Pause

Pause provider work until business, privacy, or cost boundaries are clearer.

Recommendation:

- Do not implement a real call until the project owner explicitly selects the
  provider.
- If implementation starts next, prefer Option B or Option C, not both, to
  reduce risk.
- Keep public AI and Workshop AI closed.

## Later Real-Call Touchpoints

Potential later files:

- `app/lib/ai/provider.ts`
- `app/admin/ai-core/actions.ts`
- `app/admin/ai-core/AiExplanationProbe.tsx`
- `docs/ai-provider-policy.md` if policy changes

Files not to touch without explicit approval:

- `db/schema.ts`
- `db/migrations/**`
- `package.json`
- `package-lock.json`
- `.env`
- `app/lib/env.ts`
- `app/workshop/**`
- `app/offer/**`
- `app/offers/**`
- approval actions
- Datasheet approval UI

## Manual Test Plan For Later Real Call

When a real call is explicitly approved:

1. Start from a clean repo.
2. Confirm provider env is configured locally without printing secrets.
3. Confirm at least one `approvedForAi` evidence source exists.
4. Open `/admin/ai-core`.
5. Click the AI explanation button once.
6. Verify Turkish advisory output.
7. Verify no DB mutation unless metadata audit was explicitly approved.
8. Verify no public or Workshop exposure.
9. Verify disabled provider, missing key, and provider failure messages.

## Final Gate

Real provider calls remain blocked until provider selection, environment policy,
bounded excerpt rules, audit/logging scope, and rate/cost/timeout limits are
explicitly accepted.
