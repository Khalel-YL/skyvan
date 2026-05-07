# AI Provider Selection Freeze

## Decision

The selected provider for the first real Skyvan AI provider test is Gemini.

- Provider: Gemini
- Tier: Free Tier / prototype use
- First use case: Admin AI Core explanation only
- Production commitment: none
- Public AI: closed
- Workshop AI: closed
- OpenAI: future alternative

The provider adapter should remain provider-agnostic. This decision selects
Gemini only for the first controlled Admin-only test.

## Why Gemini Free Tier

Gemini Free Tier is a practical starting point for a controlled prototype:

- free starting point for low-volume validation
- suitable for manual Admin-only tests
- avoids early API cost while validating prompt, UI, and provider boundaries
- keeps production provider choice open

Gemini is not selected as the final production provider in this checkpoint.

## Free Tier Boundaries

Gemini Free Tier must be treated as prototype-only.

- Rate limits and availability can change.
- It is not for production customer-facing usage.
- It is not for high-volume usage.
- It is not for sensitive customer, order, offer, lead, or PII data.
- Do not assume SLA or production guarantees.

## Data Policy For Gemini Free Test

Allowed:

- `approvedForAi` evidence only
- bounded excerpts if explicitly approved in the implementation sprint
- document title
- `docType`
- `pageNumber`
- `chunkIndex`
- `tokenCount`
- `documentId` and `chunkId` metadata

Forbidden:

- pending, rejected, or revoked knowledge
- customer, order, offer, or lead data
- phone, email, name, address, or PII
- raw URLs
- storage keys
- secrets or environment values
- full PDFs or full documents
- Workshop context
- public or offers context
- unbounded chunks

## First Real Call Limits

Use the existing readiness limits:

- max chunks: 5
- max characters per chunk: 600
- max total evidence characters: 2,500
- max output characters: 700
- timeout: 15 seconds
- manual Admin-trigger only
- no automatic page-load calls
- no background or batch calls

## Environment Selection

Future local environment values should be:

- `AI_PROVIDER_ENABLED=1`
- `AI_PROVIDER=gemini`
- `AI_MODEL_ID=<Gemini model selected later>`
- `GEMINI_API_KEY=<local key>`

Rules:

- Do not add these values now.
- Do not require these values in `app/lib/env.ts` yet.
- Do not print or expose values.
- Missing config must fail closed.

## Model Selection

Do not hardcode a Gemini model in this document.

The next sprint should inspect current Gemini model options and choose one safe
model for low-cost/free Admin-only explanation.

Preference for the first test:

- fast/light Gemini model if available
- short Turkish advisory output
- no final engineering, safety, legal, commercial, or production decision

## Audit And Logging

The first Gemini real call should not store raw prompt or raw output.

Metadata-only audit/logging should be decided before implementation. Suggested
metadata:

- actor id
- feature name
- provider: `gemini`
- model id
- evidence document ids
- evidence chunk ids
- success or failure
- timeout or failure category
- approximate token/cost estimate if available
- timestamp

## Failure Policy

The Gemini test must fail closed if:

- provider disabled
- Gemini key missing
- model missing
- provider error
- timeout
- insufficient approved evidence
- strict actor fails

Turkish UI messages:

- "AI sağlayıcı devre dışı."
- "AI sağlayıcı yapılandırması eksik."
- "Onaylı kaynak yetersiz."
- "AI açıklaması şu anda üretilemedi."
- "Yetkili admin aktörü doğrulanamadı."

## Next Phase Recommendation

After AI3.7, proceed to AI3.8: Gemini Real Call Implementation Inspection.

AI3.8 should inspect:

- Gemini endpoint and request shape
- model choice
- native `fetch` implementation
- timeout with `AbortController`
- bounded excerpt inclusion
- metadata-only audit decision
- manual test plan

Do not implement a real provider call in AI3.7.
