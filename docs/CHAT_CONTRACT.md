# Shared chat contract — T1

Authoritative schemas and inferred types: `src/lib/contracts/chat.ts`. Shared limits: `config/limits.json`. Both client and server must validate untrusted data with these schemas. This document specifies future behavior; no chat endpoint, model workflow, tool, or session UI is implemented at T1.

## Transport and history

`POST /api/chat`, `Content-Type: application/json`; one JSON final response, no stream. Start loading feedback immediately and allow only one active request. Success is HTTP 200 and `ChatSuccess`; failures use `ChatFailure` and `ERROR_HTTP_STATUS`. Responses must use `Cache-Control: no-store`. Do not cache requests, responses, profile data, or transcripts.

Request fields: `requestId` (fresh UUID per attempt), `sessionId` (random UUID per in-memory session), `sessionRevision` (nonnegative integer), `adultAcknowledged: true`, `profile`, and `messages`. Session IDs are correlation values, never authentication. Reject false/missing adult acknowledgement; the UI must obtain it explicitly. Disclosed minors must receive an age-boundary response and no cooking assistance even if acknowledgement was previously given.

`messages` holds alternating `{id, role, content}` turns, beginning and ending with `user`; only `user`/`assistant` roles, unique UUIDs, text only. The newest user message is included exactly once at the end. Send successful prior assistant content only, not metadata, errors, sources, tool messages, or notices. On retry, reuse that pending user message with a fresh request ID; do not append duplicate user turns. Reject excessive history rather than silently forgetting context; offer Clear session when full. Prior client-supplied assistant text is untrusted context, not evidence a tool ran or ownership was confirmed. Backend builds system/tool messages itself.

## Authoritative profile and inventory corrections

`profile` contains `equipment`, `preferences: string[]`, and `ingredientExclusions: string[]`. No medical-condition field or inferred condition-based diet. These arrays describe explicit current-session instructions, not safety guarantees. Ingredients available for a meal stay in conversation text; no inferred pantry inventory.

- Unknown: `{ "status": "unknown" }`. Never treat this as no equipment or assume a starter kit.
- Confirmed: `{ "status": "confirmed", "cookware": ["pan"], "heatSources": ["hot plate"] }`.
- Explicitly empty: `{ "status": "confirmed", "cookware": [], "heatSources": [] }`.

Confirmation covers the complete cookware AND heat-source snapshot. Ask about an unspecified category before confirming; an empty list means explicitly none. Both lists accept arbitrary names. No automatic equivalence such as microwave = oven.

Direct user edits replace the whole equipment snapshot and increment `sessionRevision`; explicit preferences/exclusion changes do the same. The backend never mutates session state. When user text corrects inventory, return nullable `inventoryProposal: {kind: "replace_equipment", basedOnMessageId, evidenceQuote, equipment}`. The message ID must identify a user turn in this request and the evidence quote must be an exact substring of that turn. These cross-request checks must be enforced by the backend, beyond structural schema validation. Ask if evidence is ambiguous or incomplete. Never infer owned items from recipe requirements.

A proposal is not applied automatically. Show the complete proposed replacement for user confirmation/editing; confirmation replaces, never merges, the prior equipment and increments revision. Reject/dismiss preserves the last confirmed profile, but conflicting user statements still require clarification before another feasibility claim. During a pending correction, do not claim feasibility using the contradicted inventory. A confirmation retry uses the updated snapshot and a new request ID. Proposal handling is for explicit equipment corrections; preferences/exclusions remain directly editable session fields.

## Final response

Success echoes the exact request/session/revision and returns `message: {id, role: "assistant", content}`, deterministic `allergenNotice`, `sources`, `equipmentChecks`, nullable `inventoryProposal`, and `metrics`.

Render assistant text as text (no raw HTML). Always visibly render the imported notice with every assistant response, including refusals and ingredient-only suggestions; it must not depend on model text. Display errors separately from conversation history, with the notice supplied by the contract. The literal notice is enforced by schema.

`sources` contains bounded `{title, url}` entries from actual search results, only HTTP(S), without credentials. No search means `[]`; never invent sources. Treat search output as untrusted data, open links safely, and never fetch arbitrary returned URLs automatically. Link validation is not a guarantee that a destination is trustworthy.

Each `equipmentChecks` entry identifies an exact `candidateId`/`candidateName`, lists `requiredCookware`/`requiredHeatSources`, and has `status: feasible | missing | unknown` plus `missingCookware`/`missingHeatSources`. Only `missing` contains nonempty missing arrays. Unknown inventory or unresolved equivalence yields `unknown`, not an invented missing list or feasibility claim. No check means `[]`, never verified feasible. Backend must derive results from actual tool executions against the request's confirmed snapshot, associate each with the actual candidate/method, and check changed recipes/alternatives again. Shape validation alone cannot verify model requirements, tool provenance, or consistency with the profile.

`metrics.durationMs` measures total server handling time; `usage` is `{inputTokens, outputTokens}` aggregated across all model steps or `null` when unavailable. Do not substitute zero for unavailable usage or claim a dollar cost without configured current pricing. Client may separately measure time to completed response. Loading feedback is not an answer-latency result.

## Failures and limits

Failure: `{ok: false, requestId, sessionId, sessionRevision, error: {code, message, retryable}, allergenNotice}`. Correlation fields are null if parsing/validation failed. Safe messages only: no raw provider errors, stack traces, secrets, or user transcript echoes. No automatic retry loops; user retries get a new request ID. A disconnected client generally receives no cancellation response; 499/CANCELLED is only for cases where a response can still be delivered.

| Code | HTTP | Typical retryability |
| --- | --- | --- |
| INVALID_REQUEST | 400 | false; correct input |
| PAYLOAD_TOO_LARGE | 413 | false; reduce input/clear |
| RATE_LIMITED | 429 | true; wait first |
| CONFIGURATION_ERROR | 503 | false; operator fixes config |
| UPSTREAM_ERROR | 502 | true if temporary |
| TIMEOUT | 504 | true |
| CANCELLED | 499 | true; explicit retry only |
| INTERNAL_ERROR | 500 | false unless diagnosed transient |

`config/limits.json` holds initial tunable bounds. Schemas enforce character/list bounds. The backend must additionally enforce request bytes before JSON parsing, deadlines, model step/output limits, search call/result limits, and an SDK abort signal. Budget bounds limit work per request; they are not a global spending cap or production abuse control. Validate final output before returning success. Tool failures must not fabricate success; a truthful limited answer can still be HTTP 200 if it clearly states the gap.

## Cancellation, edits, and Clear session

Use `AbortController` per request. Capture `(sessionId, sessionRevision, requestId)` when sending. Apply a result/error or clear loading state only if all three still match the active request. Check the same guard in `catch` and `finally`: an old request must not clear a newer request's loading state. For malformed-error responses with null IDs, rely on the captured request guard. Treat malformed server JSON as a local transport failure, never a successful assistant turn.

Cancel invalidates the active request ID before aborting. Editing profile state cancels/invalidate-first and increments revision. Clear session invalidates first, aborts in-flight work, replaces `sessionId` with a new UUID, resets revision, and clears messages/drafts/errors/sources/checks/proposals/metrics/loading, equipment to unknown, preferences/exclusions to empty, and adult acknowledgement to false. No localStorage/sessionStorage, database, cookies, or transcript logging. Refresh/reopen begins a new session. No server delete endpoint is needed because the app retains no durable session.

The backend must propagate cancellation to the AI SDK and tool fetches and enforce a timeout independently. Upstream cancellation is best effort and can still incur cost. Clear session neither retracts completed provider requests nor guarantees provider deletion. These lifecycle rules are obligations for T2/T3, not implemented behavior in T1.

## Ownership after this round

- FRONTEND: `src/app/page.tsx`, `src/app/globals.css`, `src/components/**`, `src/lib/client/**`, `public/**`.
- REVIEWER: `tests/**` (including `tests/contracts/**`, `tests/backend/**`, `tests/frontend/**`) and `docs/REVIEW.md`; production files remain read-only. Propose test dependency/script changes to LEAD.
- LEAD: `src/app/layout.tsx`, `src/app/api/**`, `src/lib/contracts/**`, `src/lib/server/**`, `config/**`, package/lock/config files, Docker files, root documentation, `tasks/**`, and this contract document. Propose shared contract changes before either side codes around them.
