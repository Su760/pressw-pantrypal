# PantryPal implementation tradeoffs

## What is implemented

A Next.js App Router/TypeScript session chat with a normal JSON final response. The browser shows loading immediately, supports cancel/retry, validates correlated responses, and ignores stale completions. Current-session kitchen, cooking preferences, and explicit ingredient exclusions are editable. Unknown equipment differs from confirmed empty categories. Inventory changes need a complete user confirmation; an unresolved correction blocks sends even when there is no replacement proposal. Every assistant answer/refusal and typed error displays the deterministic allergen notice.

All application LLM calls use installed Vercel AI SDK 7 and its OpenAI provider, initially gpt-4.1-mini. The model chooses Tavily search and equipment checking; there is no fixed search/check sequence. Tools close over the validated equipment snapshot. Actual executions alone populate sources and check metadata. The server renders stored checked recipe ingredients/steps rather than trusting the model to copy a checked method. Small request-local candidate numbers avoid the observed model error copying UUIDs; public metadata still uses UUIDs.

Input is byte-bounded before JSON parsing. Requests, histories, profiles, retrieved text, output tokens, search calls, total tool calls and overall duration are bounded. Synchronous budget reservations cover parallel tool calls. Safe typed failures and no-store responses preserve validated correlation values. Logs contain structural execution evidence and metrics, not transcripts, search queries, health details or credentials.

## Deliberate cuts

Persistent memory and accounts are deferred despite the CEO/CX request. Session-only state makes clearing understandable and reduces data-handling scope, but users must re-enter preferences and equipment after refresh or reopening. No PDF ingestion, voice, grocery export, favorites, nutrition calculations, medical tailoring, specific consumption-safety guidance, or complex model routing. The adults-only acknowledgement and disclosure boundary are prototype controls, not verified age assurance.

JSON final responses keep one small shared contract and straightforward error/cancellation handling. The tradeoff is waiting for a completed answer; immediate loading feedback does not satisfy a two-second completed-answer target. No comprehensive test framework was introduced: durable native Node contract regressions plus focused temporary backend checks and live browser/API smokes provide the current evidence. The reviewed backend tests and presentation milestone are now integrated. Separate ownership-excerpt policy and kitchen-status badge fixes remain outside this checkpoint.

## Measured behavior

During integrated-container verification, general cooking took 2,103 ms (1,172 input / 116 output tokens), its follow-up 1,362 ms (1,341 / 90), and a model-selected online recipe 6,366 ms (6,761 / 347). That recipe request executed one successful Tavily search and one feasible equipment check, returning five sources. Boundary shortcuts took 1–2 ms with no model calls. These are individual observations, not guarantees or a benchmark distribution. Additional browser measurements and failures are recorded in DEVELOPMENT.md.

## Accepted limitations

The model still interprets language, exclusions, and complete recipe requirements. A short configured vocabulary catches some omitted tools/heat sources; arbitrary named inventory is accepted, but equivalence is conservative and semantic omissions remain possible. Ingredient synonyms, compound ingredients, recipe safety, prompt injection and ambiguous ages/equipment statements need broader evaluation. A structurally valid result is not proof of semantic correctness.

Live testing exposed unnecessary model confirmation after a missing/unknown check and persistence of historical corrections. The policy now explicitly distinguishes ingredients/preferences/missing recipe tools from inventory corrections and gives the current confirmed snapshot precedence over historical equipment statements. These prompt improvements reduce ambiguity, but do not establish perfect semantic reliability. Repeating a broken-equipment disclosure after confirming may trigger another conservative confirmation.

The 30-second deadline, four model steps, 2,000 output tokens per step, eight total tools, two searches, and four concurrent requests per process bound individual work. They are not distributed abuse prevention or a global spending cap. No current dollar-cost claim is made. Cancellation is best effort at providers. Clear session removes application state but cannot undo provider processing. OpenAI response storage is disabled with store:false; this is not a promise of zero provider retention.

## Delivery and next steps

Node 22 multi-stage Docker builds without credentials and runs as a non-root user. Compose supplies credentials only at runtime and binds localhost. Image checks verified no provider key environment or .env files in the built runtime image. The prior verified integration container used port 3102. The latest rebuild status is documented below; the independent frontend preview on 3001 remains untouched.

Next: separately review/integrate the pending ownership-excerpt policy fix and kitchen-status badge follow-up; restore Docker build/start verification after its filesystem failure; evaluate ambiguous correction and exclusion cases; complete final repository/submission review before October 3, 2026, 11:15 PM CDT (hard deadline 11:34:09 PM).

The previous recipe-follow-up 502 is now addressed in response assembly, with durable regressions. Effective inventory conflict takes precedence over recipe lookup. Missing current-request references permit one recovery with only actual current-request candidates; historical numbers and client assistant text never establish check provenance. General explanations can select no recipe. A changed method needs a fresh model-selected check. The same tool execution object, counters, abort signal, original deadline and remaining four-step budget cover both attempts. Step usage is summed across attempts; unreported usage after provider failure is null.

Recovery deliberately trades one bounded extra model call for reliability. Invalid/exhausted/failed recovery yields deterministic clarification and discards unchecked model prose; it does not fabricate a recipe or check. A successful live sequence measured 8,625 ms for search/recipe, 3,939 ms for a freshly checked modification and 2,288 ms for a general follow-up. Actual recovery events confirmed two model steps for the last turn with 4,563 input / 148 output tokens in aggregate and no tools.

The backend suite currently has 50 passes and two known ownership-excerpt failures; all 11 new response/recovery regressions pass with generation mocked and networking prohibited. Live provider checks are separate evidence. The latest Docker rebuild failed with a read-only BuildKit filesystem after host disk pressure; current code was exercised with the local production build at port 3103, not misrepresented as a new container deployment. An engine restart may affect unrelated containers and has not been performed without approval.
