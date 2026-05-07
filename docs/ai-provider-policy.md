# AI Provider Policy

## Purpose

Skyvan AI provider integration is an advisory and explanation capability only. The provider may help explain approved evidence, summarize readiness, and surface warnings for Admin operators, but it is not a source of truth.

The provider must not:

- approve knowledge
- publish content
- activate products
- set prices
- create offers or orders
- make final engineering, safety, legal, commercial, or production decisions
- mutate the DB

The source of truth remains approved knowledge, rule engine records, and Admin governance.

## Current Prerequisites

The AI Governance Foundation is complete. Approved knowledge enforcement is active:

- `technicallyReady` means parsing, title, storage key, chunk, and product-link requirements are satisfied.
- `approvalStatus` is the human governance state.
- `approvedForAi` means `technicallyReady` and `approvalStatus === "approved"`.
- `getAiGroundedChunkRecords` must only use `approvedForAi` evidence.

Public AI, Workshop AI, embeddings, and vector search remain closed.

## First Allowed Future Use Case

The first allowed provider use case is an Admin-only explanation panel.

Recommended first surface:

- Admin AI Core
- or a small Admin AI Core action/component

Purpose:

- explain approved knowledge and evidence status in Turkish
- summarize why evidence is usable or insufficient
- provide advisory text only

This first use case must not mutate the DB.

## Allowed Provider Input Data

Provider input must be minimized and bounded. Allowed inputs:

- approved and technically ready evidence only
- bounded excerpts only after explicit approval in a later sprint
- document title
- document type
- product id
- page number
- chunk index
- token count
- rule alignment metadata already available internally

Full document dumps are not allowed.

## Forbidden Provider Input Data

The provider must not receive:

- pending, rejected, or revoked knowledge
- raw URLs
- storage keys
- secrets
- environment values
- unbounded chunks
- full PDFs
- full documents
- customer, order, or offer PII
- audit actor internals beyond non-sensitive actor id metadata if needed for audit
- Workshop, public, or offers context in this phase

## Output Rules

Provider output must be:

- Turkish by default
- short
- bounded
- advisory
- clearly labeled as AI-generated advisory text

The output must say when evidence is insufficient.

The output must not:

- claim a final engineering, safety, price, legal, commercial, or production decision
- claim that it approved anything
- expose hidden raw evidence
- instruct an operator to bypass governance

## Failure Policy

If the provider key is missing, the feature must be disabled.

If the provider call fails, the UI should show a compact Turkish failure message. The system must not create a retry storm, mutate the DB, fall back to unapproved evidence, or expose the feature publicly.

Provider failure must fail closed.

## Audit And Logging Policy

Callable provider actions require a strict Admin actor.

Metadata-only audit/logging is preferred. The first provider phase must not store raw prompts or raw outputs.

Suggested metadata:

- actor id
- feature name
- provider name/model id
- evidence document ids
- evidence chunk ids
- success or failure
- token/cost estimate if available
- timestamp

Use strict audit, not best-effort audit, when provider invocation requires governance accountability.

## Cost And Rate-Limit Policy

There must be no automatic provider calls on page load.

First real calls must be manual Admin-triggered calls only. Before any real provider call, define:

- per-admin daily limit
- global daily limit
- maximum evidence chunks per request
- maximum output length
- timeout
- disabled-by-default behavior when env is missing

Background and batch provider calls are not allowed in the first provider phase.

## Environment Policy

Future environment variables may include:

- `AI_PROVIDER`
- `OPENAI_API_KEY` or `GEMINI_API_KEY`
- `AI_MODEL_ID`
- `AI_PROVIDER_ENABLED`
- `AI_DAILY_LIMIT`

These variables must not be required yet. AI3.1 does not change env validation.

## Recommended Phase Order

1. AI3.1 provider policy document.
2. AI3.2 provider adapter skeleton, disabled by default, with no real calls unless explicitly approved.
3. AI3.3 Admin-only explanation prototype.
4. AI4 embedding/vector planning, only after provider policy and adapter are accepted.
5. Public AI and Workshop AI later, after Admin-only validation.

## Hard Prohibitions

- no auto-approval
- no public AI
- no Workshop AI
- no offer or order generation
- no publish action
- no product activation
- no schema mutation
- no unapproved evidence
- no background or batch provider calls
- no provider call without explicit Admin action in the first implementation phase

