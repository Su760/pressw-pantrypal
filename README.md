# PantryPal

Cooking-assistant assessment: a real JSON chat backend using Vercel AI SDK 7, OpenAI, model-selected Tavily search, and equipment checking. The integrated app includes chat, editable session kitchen/preferences/exclusions, source links, equipment results, correction confirmation, retry/cancel, and Clear session.

Public repository: https://github.com/Su760/pressw-pantrypal

Original instructions are preserved byte-for-byte in [ASSESSMENT.md](ASSESSMENT.md). See [SCOPING.md](SCOPING.md), [DEVELOPMENT.md](DEVELOPMENT.md), and [the stable JSON contract](docs/CHAT_CONTRACT.md). See [TRADEOFFS.md](TRADEOFFS.md) for implementation decisions, measured latency, cuts, and remaining limitations.

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

Open http://localhost:3000. Use `npm run dev` for development. Builds do not call providers or require live credentials. Acknowledge that you are 18 or older, optionally confirm both kitchen equipment categories, then ask a cooking question. Empty categories require an explicit “none”; unknown equipment is supported.

## Docker / Compose

Docker Engine/Desktop with Compose 2.24+ is required. Keep `.env.local` in the project directory with runtime values as described above.

```sh
docker compose build
docker compose up -d
curl --fail http://localhost:3000/
docker compose logs --tail=30 pantrypal
docker compose down
```

Compose publishes on localhost only. If port 3000 is in use, prefix Compose commands with `PANTRYPAL_PORT=3102` and use http://localhost:3102. Use `docker compose up --build -d` after code changes. The root page serves the integrated chat. The verified integration container is at http://localhost:3102; port 3001 is reserved for the separate frontend preview.

The image builds without credentials and runs as the non-root `node` user using Next.js standalone output. `.env*`, keys, logs, databases, local dependencies/build artifacts, and assessment/development documents are excluded from the build context. Compose reads `.env.local` only at container startup; it is optional so the container can start without provider access. Missing OpenAI configuration produces a typed 503 for model requests. No provider secrets are Dockerfile ARG/ENV values or image layers. The healthcheck tests HTTP responsiveness, not provider availability. Avoid printing resolved Compose configuration or container environment values.

## Using the app

Ask a general question, or list your ingredients and request a meal. To exercise tools, ask for an online recipe using your confirmed equipment. Sources and equipment results appear with the answer; missing/unknown equipment is visibly distinguished from a match. Each assistant turn includes the allergen notice.

Equipment corrections pause new sends even when no complete replacement can be proposed. Confirm the complete kitchen in the sidebar to continue; a proposal requires confirmation and is never silently applied. Preferences and exclusions last only for the current session. Clear session resets the entire page state, including the adult acknowledgement.

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

Use fresh UUIDs for requests and messages. Follow-ups keep the session ID and include alternating previous user/assistant content followed by the new user message. Responses are one validated JSON object with `ok`, correlation fields, assistant content, deterministic allergen notice, actual source/check metadata, optional inventory proposal, inventoryNeedsConfirmation, and measured latency/token usage. Failures use the typed error/status mapping in the contract. Requests and responses are `no-store`.

For a tool demonstration, confirm complete cookware and heat-source lists in `profile.equipment`, then ask to search online for a recipe using available ingredients. The model decides which tools to call. `pantrypal_tool` events record actual executions with request ID, tool name, outcome and elapsed time; step/request events contain token counts and duration. They omit queries, transcripts, health information, inventory and secrets. Source/check fields are derived from those executions, not from model-authored citations. Displayed recipe ingredients and steps are rendered from the exact checked candidate.

## Boundaries and limits

Current-session preferences and named ingredient exclusions are supported without medical tailoring, nutritional suitability or consumption-safety claims. This is an adults-only prototype, not verified age assurance. Every assistant response includes the notice. No application conversation database, browser persistence or transcript logging is implemented by the backend. The client implements Clear session and suppresses stale responses using session/revision/request guards. Cancellation is best effort upstream; completed provider processing cannot be retracted. OpenAI response storage is disabled with `store: false`; this is not a zero-retention guarantee.

`config/limits.json` sets a 64 KiB request cap, 30-second overall deadline, four model steps, 2,000 output tokens per step, eight total tool executions, two searches, five results/search, bounded search bodies/snippets, and four concurrent requests per process. Reservations occur before async tool work. No automatic provider retries. These are per-request/process limits, not distributed rate limiting or an account-wide spending cap. Token usage is measured; no dollar cost or two-second answer guarantee is claimed.

Equipment is never inferred from recipe requirements. Only confirmed inventory is compared, with a small explicit alias map. Unknown/contradicted inventory and detected incomplete method requirements remain unverified. The model still interprets natural language and proposes requirements, so semantic omissions, unusual synonyms, prompt injection, and content-boundary errors remain risks. Proposals need an actual latest user-message ID, exact evidence substring, affirmative literal item evidence, and visible user confirmation; ambiguous evidence yields clarification instead of an update.

## Parallel work

FRONTEND owns its assigned UI/client files on feat/frontend; REVIEWER owns tests/** and docs/REVIEW.md on review/quality. LEAD owns API/server/shared/configuration files and integration. Installed dependencies and ignored environment files are not copied between worktrees. Run `npm ci` independently and provision credentials privately only when needed. This checkpoint integrates only reviewed frontend 1c71172 and reviewer a53fe79. Later presentation polish and backend-test commits remain separate and unmerged; see the latest log for actual verification.
