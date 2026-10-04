# PantryPal

Cooking-assistant assessment: a real JSON chat backend using Vercel AI SDK 7, OpenAI, model-selected Tavily search, and equipment checking. The frontend is being implemented in a separate worktree; the main branch still serves the foundation shell. No frontend/reviewer branches have been merged.

Public repository: https://github.com/Su760/pressw-pantrypal

Original instructions are preserved byte-for-byte in [ASSESSMENT.md](ASSESSMENT.md). See [SCOPING.md](SCOPING.md), [DEVELOPMENT.md](DEVELOPMENT.md), and [the stable JSON contract](docs/CHAT_CONTRACT.md). The contract document's T1 status is historical; backend implementation is recorded in the development log.

## Local setup

Use Node.js 22+ and npm (`.nvmrc` records the verified local version).

```sh
npm ci
cp .env.example .env.local
```

Privately replace the key placeholders in `.env.local` and set `OPENAI_MODEL=gpt-4.1-mini`. Next.js loads the file normally. If OPENAI_MODEL is absent, `config/server.json` defaults to gpt-4.1-mini. An unchanged placeholder is rejected. Never print/commit keys or use `NEXT_PUBLIC_` variables for provider settings. OpenAI credentials are required for model requests; an unavailable Tavily key yields an honest search-unavailable result when the model selects search.

```sh
npm run typecheck
npm run test:contracts
npm run build
npm start
```

Open http://localhost:3000. Use `npm run dev` for development. Builds do not call providers or require live credentials. A chat frontend is not yet integrated on main; exercise the API directly.

## API example

```sh
curl --fail-with-body http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  --data '{
    "requestId":"d7ae2a11-5d54-47b3-a1c1-609ed8581725",
    "sessionId":"6ec901f8-e7c9-40f3-a8f8-9bb72471607c",
    "sessionRevision":0,
    "adultAcknowledged":true,
    "profile":{"equipment":{"status":"unknown"},"preferences":[],"ingredientExclusions":[]},
    "messages":[{"id":"c937c990-4a0d-4752-aa64-aab396cce6f9","role":"user","content":"What does sauteing mean?"}]
  }'
```

Use fresh UUIDs for requests and messages. Follow-ups keep the session ID and include alternating previous user/assistant content followed by the new user message. Responses are one validated JSON object with `ok`, correlation fields, assistant content, deterministic allergen notice, actual source/check metadata, optional inventory proposal, and measured latency/token usage. Failures use the typed error/status mapping in the contract. Requests and responses are `no-store`.

For a tool demonstration, confirm complete cookware and heat-source lists in `profile.equipment`, then ask to search online for a recipe using available ingredients. The model decides which tools to call. `pantrypal_tool` events record actual executions with request ID, tool name, outcome and elapsed time; step/request events contain token counts and duration. They omit queries, transcripts, health information, inventory and secrets. Source/check fields are derived from those executions, not from model-authored citations. Displayed recipe ingredients and steps are rendered from the exact checked candidate.

## Boundaries and limits

Current-session preferences and named ingredient exclusions are supported without medical tailoring, nutritional suitability or consumption-safety claims. This is an adults-only prototype, not verified age assurance. Every assistant response includes the notice. No application conversation database, browser persistence or transcript logging is implemented by the backend. The client must implement Clear session and stale-result suppression according to the contract. Cancellation is best effort upstream; completed provider processing cannot be retracted. OpenAI response storage is disabled with `store: false`; this is not a zero-retention guarantee.

`config/limits.json` sets a 64 KiB request cap, 30-second overall deadline, four model steps, 2,000 output tokens per step, eight total tool executions, two searches, five results/search, bounded search bodies/snippets, and four concurrent requests per process. Reservations occur before async tool work. No automatic provider retries. These are per-request/process limits, not distributed rate limiting or an account-wide spending cap. Token usage is measured; no dollar cost or two-second answer guarantee is claimed.

Equipment is never inferred from recipe requirements. Only confirmed inventory is compared, with a small explicit alias map. Unknown/contradicted inventory and detected incomplete method requirements remain unverified. The model still interprets natural language and proposes requirements, so semantic omissions, unusual synonyms, prompt injection, and content-boundary errors remain risks. Proposals need an actual latest user-message ID, exact evidence substring, affirmative literal item evidence, and visible user confirmation; ambiguous evidence yields clarification instead of an update.

## Parallel work

FRONTEND owns its assigned UI/client files on feat/frontend; REVIEWER owns tests/** and docs/REVIEW.md on review/quality. LEAD owns API/server/shared/configuration files and integration. Installed dependencies and ignored environment files are not copied between worktrees. Run `npm ci` independently and provision credentials privately only when needed. Docker verification and final TRADEOFFS are separate milestones; see the latest log for actual results.
