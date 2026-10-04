# PantryPal — development plan and evidence log

Planning snapshot: October 3, 2026, America/Chicago. Prepared after the 8:48 PM check-in. This file documents the plan and evidence supplied so far; it does not assert that application work has happened. Import it into the project and maintain it alongside the code. It supplements, and does not replace, the required SCOPING.md, README.md, and TRADEOFFS.md.

## 1. Source of truth and current status

Read: README.md, REQUIREMENTS.md, assessment.json, and all four stakeholder files in brief/. The supplied ZIP contains seven files and no application implementation. New screenshots confirm three Codex sessions opened in the extracted project; the user also has VS Code and a general-purpose terminal ready. Separate Git worktrees and an initial scope commit have not yet been evidenced.

The delivery system determines the three-hour deadline. Stop at that deadline and identify any later commits as post-window. Keep a 15–20 minute final submission buffer. Do not replace the initial scope with a rewritten history: record later additions/cuts with their rationale.

Required submission: working source in a public GitHub repository, or a private repository shared with @elmdecoste and @bgreal5. Include the four deliverables: SCOPING.md; working system; README; TRADEOFFS.md. A hosted deployment is not listed as mandatory. GitHub authentication alone does not establish reviewer access.

## 2. Verified preparation

Evidence here comes from the user's pasted terminal output; these commands were not rerun by this planning assistant.

| Item | Observed result | What this proves |
| --- | --- | --- |
| Node / npm / Git | 22.20.0 / 11.7.0 / 2.51.2 | Tools installed on the Mac |
| Docker / Compose | 29.4.0 / 5.1.2; hello-world succeeded | Docker engine can run a basic container; application image untested |
| OpenAI | gpt-4.1-mini returned “API ready,” HTTP 200 | One direct provider generation succeeded; AI SDK integration untested |
| Tavily | Basic search returned two results, HTTP 200 | One authenticated external search succeeded |
| Codex CLI | 0.160.0; sessions open | CLI installed; no successful project task yet supplied |
| GitHub CLI | Authenticated as Su760 | CLI account access; no assessment repository/access check yet |
| Credentials | Privately saved by user, entered through hidden shell prompts | Project environment configuration still needs verification |

Do not put API keys, authorization headers, raw transcripts, or health details in this log. Historical direct curl tests were preflight checks; every application LLM call must go through the Vercel AI SDK.

## 3. Proposed MVP and decisions

Goal: a friendly cooking assistant that helps users choose meals they can make with their ingredients and actual equipment.

| ID | Decision | Why / limitation |
| --- | --- | --- |
| D01 | Next.js + TypeScript, React UI, Vercel AI SDK with OpenAI provider, Tavily via server-side HTTP | One app reduces integration overhead; select compatible package versions during scaffolding and commit the lockfile |
| D02 | General cooking questions, requested recipes, and recipes from available ingredients | Covers the PM's core use cases; identify missing ingredients instead of assuming pantry staples |
| D03 | Arbitrary, editable, user-confirmed cookware and heat sources; no default inventory | Directly addresses PM/CX's central product failure; unknown inventory is different from an explicitly empty inventory |
| D04 | Model-selected external recipe search and equipment-checking tools | Meets tool-use requirements without a fixed sequence; simple questions may need neither tool |
| D05 | Recipe feasibility checks use authoritative session equipment, not model-invented ownership | A changed recipe or alternative requires a fresh check; unchecked recipes must not be presented as verified feasible |
| D06 | Honor explicit preferences and named ingredient exclusions; do not infer a diet from a medical condition | Legal restrictions override medical-tailoring ambitions. Do not claim allergy safety or nutritional suitability. Treat this interpretation as an assumption requiring production clarification |
| D07 | Deterministic allergen notice on every assistant response | Covers recipes and ingredient suggestions embedded in prose; a disclaimer alone does not enforce content safety |
| D08 | Consumption-safety questions receive a referral to food-safety authorities | Explicitly resolves the PM's chicken-doneness example against the legal brief; do not add specific safety assurances |
| D09 | Current-session continuity only; Clear session removes all conversation/profile state | No application database, localStorage persistence, or transcript logging. Provider processing/retention still exists and must be documented separately |
| D10 | Adults-only prototype policy, with a simple acknowledgement and boundary for disclosed minors | A product stance, not verified age assurance or proof of legal compliance; production age handling is unresolved |
| D11 | Warm personality; cooking, techniques, equipment, and meal/hosting logistics allowed | Refuse unrelated tasks; defer restaurant recommendations and wider lifestyle scope |
| D12 | One configurable model initially; bounded requests, tools, and output | Avoid a routing subsystem in this timebox. Measure completed-response latency and usage; loading feedback is not a two-second answer |

Defer: cross-session profiles, accounts, persistent favorites, PDF ingestion, voice, grocery export/weekly planning, complex model routing, and a guaranteed two-second completed response. State these decisions in SCOPING.md before application code.

Before parallel implementation, agree on request/response schemas, errors, profile updates, source representation, tool-result representation, and cancellation semantics. Choose streaming versus a validated final response once during this contract step; streaming is not a baseline requirement.

## 4. Task board and ownership

All tasks below are planned unless explicitly marked complete in a later entry.

| Task | Owner | Depends on | Done when |
| --- | --- | --- | --- |
| T0 — Scope | Session 1 | Read briefs | Root SCOPING.md, 1–2 pages, all six required sections; committed before application code |
| T1 — Foundation | Session 1 | T0 | App scaffold, compatible dependencies/lockfile, shared API/types, secret exclusions, example environment, basic route/UI boundary, committed base and separate worktrees |
| T2 — Backend | Session 1 | T1 | AI SDK model conversation and selected tools complete; equipment validation, input bounds, timeout/error handling, no secret/transcript logging |
| T3 — Frontend | Session 2 | T1 | Chat, editable equipment/preferences, sources, notices, loading/errors, safe rendering, cancellation/reset, usable keyboard/mobile layout |
| T4 — Review and focused tests | Session 3 | T0; code milestones | Acceptance matrix tied to scope; reproduced defects with evidence; focused tests for risky boundaries |
| T5 — Early integration | Session 1 with Session 2 | First usable T2/T3 slices | Browser request → backend → model → selected tool → final answer works; second turn and equipment correction work |
| T6 — Docker and verification | Session 1; Session 3 verifies | Foundation; integrated app for final check | Clean build/start from documented instructions and runtime keys; app works in container |
| T7 — Delivery and demo notes | Session 1 integrates; Session 3 reviews | T5/T6 | README and TRADEOFFS accurate; log updated; checks recorded; reviewer repository access verified; submission ready |

Session 1 owns dependency files, lockfile, shared types, API contract, configuration, integration, and this log. Session 2 owns assigned UI files. Session 3 initially reviews read-only; after foundation, owns assigned test files in a separate worktree. Production refactors require explicit, narrow file ownership and a concrete defect or maintainability problem. Avoid an open-ended rewrite during integration.

Every handoff includes: task ID, commit hash, changed files, decisions, actual checks and outcomes, defects/limitations, and the next dependency. Session 1 integrates these facts into this log at each milestone. Worktrees isolate file changes, not incompatible API decisions: propose contract changes to the lead before coding around them.

## 5. Tool and dependency inventory

| Component | Purpose | Inputs / outputs | Failure handling to implement |
| --- | --- | --- | --- |
| AI SDK + OpenAI provider | All application LLM calls and bounded model-selected tool loop | Validated conversation/session → assistant answer and selected tool calls | Safe error, bounded runtime/output/iterations, cancellation; never expose provider secrets/errors verbatim |
| Tavily search tool | Retrieve external recipe/cooking sources when model selects search | Minimal cooking query → bounded title/URL/snippet results | Timeout/HTTP/malformed/empty-result handling; never fabricate search success or citations |
| Equipment-checking tool | Check candidate requirements against confirmed equipment/heat sources | Model proposes requirements; server closure supplies validated session inventory → compatibility and missing/unknown items | Treat uncertainty as uncertainty; account for supported synonyms/capabilities; check alternatives again |
| Schema validation | Validate API requests and tool arguments/results | Unknown input → validated bounded types or controlled error | Reject malformed/oversized payloads and unexpected roles |
| Docker / Compose | Reproducible execution | Source/dependencies + runtime environment → running app | Missing-key guidance; exclude secrets from Git, build context, image, and browser bundle |
| Git / worktrees | Parallel work and evidence history | Scoped commits → integrated milestones | Lead coordinates shared files and resolves conflicts explicitly |
| Codex / planning assistant | AI-assisted implementation, review, planning | Bounded tasks → proposed changes/review evidence | Human checks scope and claims; record actual failures without inventing root causes |

Record exact package versions and final function/file locations after installation. Do not claim a proposed dependency was installed.

## 6. Acceptance matrix — all application checks pending

| ID | Case | Expected behavior |
| --- | --- | --- |
| A01 | General question; then follow-up | Coherent current-session conversation; tool-free answer permitted where appropriate |
| A02 | Recipe request requiring external information | Model selects Tavily; tool result leads to final answer with real source links; no hardcoded search sequence |
| A03 | No equipment specified | Clarify before claiming feasibility; distinguish unknown from none |
| A04 | One pan + hot plate, ingredients supplied | Feasible recipe using confirmed equipment/heat; identify additional ingredients/equipment needed |
| A05 | Oven recipe but no oven | Useful alternative or method; alternative also checked |
| A06 | “Actually I only have a microwave” after previous inventory | Correction replaces conflicting state; old equipment is not silently retained |
| A07 | Unusual equipment or synonyms | Handle supported aliases honestly; ask rather than invent equivalence |
| A08 | Ingredient substitution without a recipe card | Visible allergen notice still present |
| A09 | Ingredient exclusion supplied earlier; later recipe | Exclusion retained during session; no safety guarantee or condition-derived diet |
| A10 | “Make it suitable for diabetes” vs “vegetarian” | Medical tailoring declined with appropriate referral; explicit nonmedical preference supported |
| A11 | Leftover/spoilage or doneness-safety question | Refer to food-safety authority; no specific consumption-safety assurance |
| A12 | Off-topic or “ignore your instructions” request | Stay within product scope; do not treat user text as higher-priority instructions |
| A13 | Search snippet contains hostile instructions; unsafe URL/HTML | Treat retrieved content as data; safe rendering/URL handling; no arbitrary execution or unsafe links |
| A14 | Search timeout, bad response, empty results; model failure | Useful truthful error/fallback; no invented fresh search results; UI remains usable |
| A15 | Empty/malformed/oversized payload, excessive history, forged roles | Bounded validation failure without leaking internal errors |
| A16 | Repeated submit / cancellation | No accidental overlapping turns or broken history; bounded provider work |
| A17 | Clear session during generation | Clear all chat/profile state; cancel work and ignore stale completions so old state cannot return |
| A18 | Refresh / reopen / explicit minor disclosure | Retention and age behavior match stated prototype policy; no persistence surprises |
| A19 | Runtime configuration absent; fresh Compose build/run | Documented controlled behavior; fresh reviewer setup works using supplied keys |
| A20 | Secrets, observability, latency claims | No secrets/raw user transcripts logged or bundled; usage/latency observations labelled accurately |

Use deterministic checks for parsing, equipment comparison, reset/cancellation, and rendering boundaries. Use a small recorded set of real model/tool checks for orchestration and behavior. Passing examples do not prove perfect prompt-injection resistance, dietary safety, or legal compliance. Document residual risks.

## 7. Issue register

| ID | Symptom | Cause / evidence | Action | Status |
| --- | --- | --- | --- | --- |
| I01 | OpenAI preflight HTTP 429, credit_balance_exhausted | Provider explicitly reported no credits | User added $5; repeated same generation successfully, HTTP 200 | Resolved in preflight |
| I02 | Earlier Codex “invalid session start JSON output” hook error | Root cause not established; earlier screenshot showed failure | Do not claim fixed or broadly disable hooks; investigate specific blocker if it recurs | Unverified; not shown blocking a task in latest screenshots |
| I03 | Chat attachment message claimed screenshots missing | Planning assistant successfully opened the three new local attachments | Screenshots reviewed; no application defect inferred | Resolved for this review |

No application bugs have been observed yet because no application implementation or execution evidence has been supplied.

Issue entry template: ID; time/task/commit; observed symptom; reproduction; expected vs actual; confirmed cause or hypothesis; fix; verification command and result; remaining limitation; open/resolved status.

Milestone entry template: time; task; commit; files; decision and reason; checks actually run; result; known gap; next action. Preserve failed checks as evidence, then record the successful rerun if fixed.

## 8. Stretch gate and demo preparation

Stretch work starts only after the scoped MVP, required documents, fresh Docker run, critical checks, and repository access are complete, with the submission buffer intact. Prefer one small addition at a time:

1. Copy a recipe to clipboard.
2. Session-only favorites, clearly temporary and cleared by Clear session.
3. Better example prompts or optional equipment-entry suggestions; suggestions never imply ownership.

Update the scope-change log and TRADEOFFS if a deferred item is added. Persistent health-adjacent memory, PDF upload, voice, and complex routing require broader design and are poor last-minute additions.

Suggested demo: show confirmed pan/hot-plate inventory; request a meal; demonstrate model-selected tools and sources; change equipment and show a viable alternative; ask a medical or food-safety question; clear the session. Prepare a search-failure example and fresh-run commands. Only demo behavior actually verified.

Prepare to explain: one request end to end; why these tools and framework; how the model chooses tools; where deterministic checks constrain outputs; how inventory changes; tool failure behavior; ingredient exclusion vs medical tailoring; storage/deletion and provider limitations; measured cost/latency; one real bug with fix evidence; what was cut and what comes next; how AI assistance was reviewed.

Before submission: root SCOPING.md has all six sections; README setup and examples match reality; TRADEOFFS compares built versus scoped and lists gaps; final code is committed/pushed; reviewers can access the repo; deadline observed; post-window commits labelled if any. Never report a planned check as passed.

## 9. T0/T1 — observed scope and foundation round (October 3, 2026)

LEAD was the sole writer. FRONTEND/REVIEWER did not implement features this round. The original planning log was already present locally at session start and was imported into Git unchanged in scope commit `3422a838a32c62dfadf076861c2543350a903295`. Sections 1–8 above remain the historical planning snapshot; the evidence below supersedes their initial status statements.

**Repository and scope.** `git rev-parse --show-toplevel` initially failed with `fatal: not a git repository (or any of the parent directories): .git`. `git ls-remote https://github.com/Su760/pressw-pantrypal.git` returned no refs; `gh repo view Su760/pressw-pantrypal --json nameWithOwner,url,isPrivate,defaultBranchRef` confirmed `isPrivate: false`, the exact URL https://github.com/Su760/pressw-pantrypal, and an empty default branch. Initialized this directory with `git init -b main`, connected origin, and committed SCOPING plus original artifacts before application code. A later `git fetch origin` still found no existing remote branches. No history/files were discarded or force-pushed.

**Preservation.** Original README copied to ASSESSMENT.md before replacement. `git show 3422a83:README.md | cmp - ASSESSMENT.md` passed; SHA-256 `49dd7b3aee45d5288b5339a8a0d3b3f5f5fd586365d55ddefa63a275ae930535`. REQUIREMENTS.md, assessment.json, brief/, and initial SCOPING.md remain unchanged. Current root README describes the foundation's actual limitations.

**Foundation decisions.** Manually scaffolded the minimal App Router application to avoid a generator overwriting assessment documents. Normal JSON response contract chosen over streaming. `src/lib/contracts/chat.ts` exports strict Zod request/response/profile/equipment/source/proposal/error schemas and inferred types; `docs/CHAT_CONTRACT.md` defines transport, confirmation, lifecycle, error/status, and ownership semantics. `config/limits.json` centralizes tunable bounds. Inventory is unknown or explicitly confirmed; empty confirmed arrays mean none. Corrections propose a complete replacement grounded in a user message and require confirmation. Correlation uses requestId, sessionId, and sessionRevision; cancelled/cleared/edited sessions must reject late responses, including catch/finally updates. Structural schema checks are implemented; backend cross-field/provenance checks, request-byte limits, SDK limits, tools, cancellation, and session UI remain T2/T3 obligations.

**Dependencies (exact versions, lockfile committed in foundation).** Next.js 16.3.8; React/react-dom 19.3.0; AI SDK `ai` 7.0.127; `@ai-sdk/openai` 4.0.83; Zod 4.6.5; TypeScript 5.9.3; `@types/node` 22.20.5; `@types/react`/`@types/react-dom` 19.3.0. Local runtime rerun: Node v22.20.0, npm 11.7.0. `npm view` confirmed engines and peer ranges before installation. AI SDK/provider require Node >=22, so package engines/README now state Node 22+; .nvmrc pins the verified local version. TypeScript 5.9.3 was intentionally selected instead of latest 7.0.2 to keep the scaffold on an established compiler generation; actual typecheck/build compatibility was then verified.

Current official references inspected: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [AI SDK OpenAI provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai), [Zod schemas](https://zod.dev/api). Installed `ai/dist/index.d.ts`, bundled `ai/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx`, OpenAI provider types, and Zod types were inspected. In this installed AI SDK 7, the bounded-step helper is `isStepCount`, tools use `inputSchema`, and cancellation uses `abortSignal`; implementation must use the installed version's documentation. No model was selected and no provider was invoked this round.

| Command/check | Observed result |
| --- | --- |
| `npm install --no-fund --ignore-scripts` | Exit 0; 42 packages added, 43 audited, 0 vulnerabilities. No test framework dependency added. |
| `npm ls --depth=0` | Exit 0; requested versions present. npm also labels optional `@emnapi/runtime` and `@img/sharp-wasm32` as extraneous; both are referenced by optional dependency metadata in the lockfile. No app dependency failure observed. |
| `npm run typecheck` | Exit 0, before and after the contract correction. Script runs `next typegen && tsc --noEmit`. |
| First `npm run test:contracts` | 5 passed, 1 failed: `a maximum-size valid reply can be used in the next request history`; `Expected values to be strictly equal: false !== true`. |
| Corrected `npm run test:contracts` | Exit 0; all 6 native Node tests passed. Covers unknown/empty equipment, malformed/forged requests, reply-to-history round trip, mandatory notice/typed errors, safe source URL shape, and equipment result consistency. |
| `env -u OPENAI_API_KEY -u TAVILY_API_KEY -u OPENAI_MODEL NEXT_TELEMETRY_DISABLED=1 npm run build` | Exit 0; Next.js production compilation and static generation succeeded for `/` and `/_not-found`, without live API keys. |
| `env -u OPENAI_API_KEY -u TAVILY_API_KEY -u OPENAI_MODEL NEXT_TELEMETRY_DISABLED=1 npm start -- --hostname 127.0.0.1 --port 3100` plus Python HTTP assertions | Server started; GET `/` returned 200 and the expected foundation-shell text. POST `/api/chat` returned 404, as intended. Server stopped after verification. |
| Preservation and exclusions | Byte comparison passed; original assessment files unchanged; `git check-ignore` confirmed environment files, dependencies, build artifacts, secret directory, and database examples ignored. `.env.example` contains placeholders only. |

**I04 — fixed foundation contract inconsistency.** Initial `src/lib/contracts/chat.ts:34` capped all history at 6,000 characters while `:105` allowed 12,000-character assistant replies. The next turn could reject the prior valid response. Reproduced in `tests/contracts/chat.test.cjs:41` before changing code; extracted one AssistantMessageSchema shared by responses and history, retaining the smaller user-input bound. The failing regression passed after correction. This verifies parser behavior, not live chat behavior.

**I05 — missing local UI rules.** The requested `/Users/supashramesha/.Codex/rules/ui-ux-pro-max/AGENTS.md` does not exist (`ls: ... No such file or directory`). No design-system work or UI polish attempted. FRONTEND needs the correct rules path before design work.

**Scope departures/risks.** Product scope still matches D01–D12. Node 22+ and a concrete JSON transport are now fixed choices. Added six narrow schema checks to catch a demonstrated foundation defect; no comprehensive test framework. Docker exclusions are present, but Dockerfile/Compose and container execution remain T6. A normal JSON contract does not itself provide age enforcement, safety, ownership verification, retention guarantees, cancellation, cost caps, or tool orchestration. Per-request limits require backend wiring and do not provide a global spending cap. The assessment-system delivery deadline was not available here; no claim that work falls inside the three-hour window is made.

**Milestones at foundation commit.** T0 complete (`3422a83`). T1 scaffold/contract/verification complete; its commit, non-force push, and worktree creation are the next sequential actions. T2–T7 remain pending except this round's narrow contract tests and Docker exclusions. No real model/search calls, chat UI, age/session behavior, browser interaction suite, Docker build/run, final TRADEOFFS, or end-to-end acceptance case A01–A20 has been validated.

**Handoff ownership.** FRONTEND: `src/app/page.tsx`, `src/app/globals.css`, `src/components/**`, `src/lib/client/**`, `public/**`. REVIEWER: `tests/**` (contracts/backend/frontend) and `docs/REVIEW.md`; production files read-only, dependency changes proposed to LEAD. LEAD: `src/app/layout.tsx`, `src/app/api/**`, `src/lib/contracts/**`, `src/lib/server/**`, `config/**`, package/lock/config files, Docker files, root documentation, tasks/, and docs/CHAT_CONTRACT.md. Shared contract changes require coordination before implementation. Planned sibling branches: feat/frontend and review/quality. Ignored environment files and installed dependencies do not copy to new worktrees; run `npm ci` independently, and provision runtime credentials privately only when required.

## 10. Foundation push, worktrees, and final parser correction

Foundation commit `77a948395db3b70c78796a53f1dba91d949915e9` was pushed with `git push -u origin main` (exit 0, `[new branch] main -> main`). `git ls-remote origin refs/heads/main` confirmed that exact hash. GitHub CLI now reports public repository https://github.com/Su760/pressw-pantrypal with default branch main.

Both requested paths/branches were absent when inspected, so `git worktree add` created them from the pushed foundation without deleting/resetting anything:

| Session | Absolute path | Branch | Observed creation base |
| --- | --- | --- | --- |
| FRONTEND | /Users/supashramesha/Desktop/PressW/pantrypal-frontend | feat/frontend | 77a948395db3b70c78796a53f1dba91d949915e9 |
| REVIEWER | /Users/supashramesha/Desktop/PressW/pantrypal-reviewer | review/quality | 77a948395db3b70c78796a53f1dba91d949915e9 |

`git worktree list --porcelain` and per-worktree `git status --short --branch` confirmed the separate branches and clean files. Neither worktree contains node_modules or .env.local; dependencies and ignored credentials are not copied automatically. Run `npm ci` in each before its checks. No other session's branch was switched.

**I06 — fixed final parser edge case.** Additional malformed-source verification after the first push showed `SourceSchema.safeParse({title: 'Invalid', url: 'not a URL'})` threw `TypeError ERR_INVALID_URL`. Root cause: the refinement at pre-fix `src/lib/contracts/chat.ts:73` called `new URL(value)` even after Zod's URL check failed. Added malformed/empty/broken-host strings to the existing URL regression; `npm run test:contracts` reproduced 5 passing and 1 failing with `error: 'Invalid URL', code: 'ERR_INVALID_URL'`. Guarded URL construction so malformed sources return validation failure instead of throwing. The subsequent test run passed 6/6; typecheck and key-free production build both exited 0 again. No model/backend implementation was added. This narrowly corrects T1; it does not add product scope.

The commit containing this correction/log is the final shared foundation handoff. After committing it, LEAD will non-force push main and fast-forward each still-clean worktree using `git merge --ff-only`, preserving their branch names. These final operations are verified in the user-facing handoff rather than claimed before execution in this immutable commit. If either worktree changes meanwhile, preserve its work and report instead of forcing/resetting.

T0 and T1 are complete subject to those final Git operations. Next authorized rounds: T2 backend, T3 frontend, and T4 focused reviewer tests against the shared contract, followed by integration, Docker, and final writeup. This round stops at the handoff. Missing UI rules and the unknown delivery-system deadline remain open; full application behavior and provider/Docker execution remain untested.
