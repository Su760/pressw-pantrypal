# Foundation review — review/quality

Review target: `3ae1af9cb3beac38876ae021a7cd9543cf4b3ad5`, October 3, 2026 (America/Chicago). This checkout contains the foundation only. Backend, chat UI, and Docker implementation are outside the code available for this pass.

## Authorized plan and edit boundary

The reviewer round authorizes this plan, a commit, and a non-force push. Only `tests/contracts/chat.test.cjs` and `docs/REVIEW.md` will change. Existing `tasks/lessons.md` and `tasks/todo.md` were read; the current task's narrower ownership leaves them read-only.

- [x] Verify directory, branch, foundation ancestry, clean starting state, and scope-before-code history; read assessment, four briefs, requirements, scope, contract/schema, limits, scripts, tests, and development log.
- [x] Run `npm ci`.
- [x] Run baseline contract tests and typecheck; audit concrete contract boundaries.
- [x] Add a small set of missing native Node regressions and run them.
- [x] Record enforced guarantees, confirmed findings, and unexecuted behavioral checks.

Final handoff reports the reviewed staged diff, commit hash, and actual non-force push result. No other branches are merged or future implementation commits polled.

## Checkout and preservation

- Directory `/Users/supashramesha/Desktop/PressW/pantrypal-reviewer`; branch `review/quality`; initial HEAD is the review target. `git merge-base --is-ancestor 3ae1af9 HEAD` exited 0.
- Starting `git status --short` was empty. During review, unexplained formatting changes appeared in `DEVELOPMENT.md`, `REQUIREMENTS.md`, `docs/CHAT_CONTRACT.md`, `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/contracts/chat.ts`, `tests/contracts/chat.test.cjs`, and `tsconfig.json`. A patch expecting the original test formatting failed before editing anything. These changes are preserved in the working tree and excluded from the review commit; only the appended tests and this document belong to this review. Their origin is unverified.
- Production/package/configuration files were not edited by the reviewer. Source references below use **committed foundation line numbers**, unaffected by those formatting changes.

## Scope-before-code evidence

`git log --reverse --name-status` and `git ls-tree -r --name-only 3422a83` show root commit `3422a838a32c62dfadf076861c2543350a903295` contains only scope, assessment/planning artifacts, and task notes. Application source, package files, and tests first appear in its descendant `77a9483`; `3ae1af9` follows with the malformed-URL fix. Thus scope was committed before application code in the available history.

`git diff 3422a83 HEAD -- SCOPING.md REQUIREMENTS.md assessment.json brief` returned no changes. `git show 3422a83:README.md | cmp - ASSESSMENT.md` exited 0: the assessment README is preserved byte-for-byte in the foundation. This establishes recorded ordering, not compliance with the unknown delivery-system deadline.

| Required section        | Location        | Review                                                                                                                                                                           |
| ----------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope committed         | `SCOPING.md:5`  | Cooking chat, user-confirmed equipment, model-selected search/check tools, explicit exclusions, safety boundaries, ephemeral sessions, Docker.                                   |
| Scope cut               | `SCOPING.md:13` | Persistent profiles, favorites, PDF/voice/export/planning, routing complexity, and guaranteed two-second completed replies deferred with reasons.                                |
| Contradictions resolved | `SCOPING.md:19` | Legal boundaries override medical/safety ambitions; confirmed equipment overrides a starter kit; session privacy and answer quality take priority over memory/latency ambitions. |
| Clarifying questions    | `SCOPING.md:25` | Deadline, production policy/retention/age, counsel-approved accommodations, and cost/latency/capability questions recorded.                                                      |
| Assumptions made        | `SCOPING.md:31` | JSON transport, supplied credentials, explicit exclusions, visible confirmation, provider-retention limitations, and prototype age acknowledgement are explicit.                 |
| Risks accepted          | `SCOPING.md:37` | Model/search errors and injection, untrusted state, memory friction, cancellation, provider/Docker verification, and lack of production guarantees are explicit.                 |

All six sections are present and substantively address the assessment and four briefs. No claim that the eventual MVP commitments are implemented.

## Checks actually executed

Runtime: Node `v22.20.0`, npm `11.7.0`. No live credentials were read or provider requests made.

| Check                                          | Observed result                                                                                                                                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                       | Exit 0; 42 packages added, 43 audited; npm reported 0 vulnerabilities. Package/lock files unchanged by reviewer.                                                                                                                                  |
| Baseline `npm run test:contracts`              | Exit 0; original 6 tests passed.                                                                                                                                                                                                                  |
| Baseline and post-addition `npm run typecheck` | Exit 0; `next typegen && tsc --noEmit`.                                                                                                                                                                                                           |
| Expanded `npm run test:contracts`              | Exit 0; 13 executed: **12 passed, 1 TODO assertion failed (R1)**, 0 skipped. Native Node TODO does not affect exit status. This is not an all-passing suite or a fixed defect.                                                                    |
| Manual parser probes                           | Case-variant duplicate IDs accepted; exact duplicates rejected. Structurally valid ungrounded response accepted. 23 maximum-length turns accepted structurally at 205,983 serialized UTF-8 bytes, above the configured 65,536-byte request limit. |
| `git diff --check`                             | Exit 0 before handoff staging.                                                                                                                                                                                                                    |

Six added passing tests cover exact duplicate IDs across same/different roles, retry-shaped history, 23/25-message boundaries without mutation/truncation, malformed nested input and revisions, explicit no-heat equipment and result-state consistency, response limits/metrics/envelopes, and complete replacement proposals. Existing URL/notice/assistant-history tests were retained. The seventh addition executes the unresolved R1 regression. These tests exercise schemas, not browser retry behavior or HTTP handling.

The failure is explicit:

```text
not ok 13 - R1: duplicate UUIDs differing only in letter case must be rejected # TODO R1: shared IdSchema/uniqueness fix belongs to LEAD; see docs/REVIEW.md
Expected values to be strictly equal:
true !== false
# tests 13
# pass 12
# fail 0
# skipped 0
# todo 1
```

## Confirmed defects by severity

No critical/high/medium defect confirmed in the reviewed foundation. This is not a safety or integration sign-off.

### R1 — Low: equivalent UUID spellings evade message uniqueness

- **Location/cause:** `src/lib/contracts/chat.ts:9` accepts UUID text without case normalization; `src/lib/contracts/chat.ts:55` puts raw strings in a case-sensitive `Set`. The documented requirement is unique UUIDs (`docs/CHAT_CONTRACT.md:11`). UUID hexadecimal case does not change identity ([RFC 9562, section 4](https://www.rfc-editor.org/rfc/rfc9562.html#section-4)).
- **Reproduction:** Run `npm run test:contracts`; the R1 test supplies valid user/assistant/user history where the first/last IDs are `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` and `AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA`. `safeParse(...).success` is `true`; expected `false`. Giving both messages the exact lowercase ID is rejected.
- **Impact:** Caller-supplied history can contain two turns with the same UUID, defeating the advertised uniqueness invariant and creating ambiguous references if an integration compares normalized UUIDs. No live UI failure, authorization bypass, or security exploit was demonstrated; ordinary generated lowercase IDs do not trigger this case.
- **Suggested fix for Lead:** Compare normalized UUIDs for uniqueness, or establish a canonical lowercase ID representation consistently across the shared contract and correlation/proposal handling. Remove the R1 TODO marker after the regression passes normally. Production code is unchanged by this review.

## What the schemas enforce

| Boundary                                                       | Enforced in foundation                                                                                                                                                                                                                                                                                                      | Not established by structural validity                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requests/history (`chat.ts:31`, `chat.ts:47`)                  | Strict fields; UUID syntax; nonnegative safe-integer revision; literal adult acknowledgement; nonempty trimmed text; per-role lengths; 1–24 list cap; alternating user/assistant starting/ending with user; exact-string duplicate rejection. Valid alternating requests have at most **23** messages with the current cap. | Byte-size bound before JSON parsing; history origin; exclusions retained by the application; fresh request IDs across retries; disclosed-minor detection; usable excessive-history guidance. R1 limits UUID uniqueness.                                             |
| Profile/equipment (`chat.ts:14`, `chat.ts:25`)                 | Unknown differs from confirmed empty; complete confirmed cookware AND heat-source lists; bounded trimmed nonempty labels/preferences/exclusions; no extra medical-condition field.                                                                                                                                          | User actually confirmed both categories; equipment ownership; synonyms/capabilities; medical content hidden in free text; conflict handling or replacement rather than merge.                                                                                       |
| Equipment results (`chat.ts:82`)                               | Candidate ID/name and requirement lists; allowed status; only `missing` has nonempty missing lists; missing items belong to the corresponding requirement list.                                                                                                                                                             | Real tool execution, accurate recipe requirements, comparison against authoritative inventory, candidate uniqueness/correspondence with prose, or fresh checks for alternatives. `feasible` with empty requirements is structurally allowed.                        |
| Proposals (`chat.ts:102`)                                      | Replacement kind; valid ID; nonempty bounded quote; complete confirmed equipment snapshot.                                                                                                                                                                                                                                  | ID identifies a user turn in this request; quote is an exact substring of that turn; quote supports all proposed ownership; user approved application. These are explicitly backend/UI obligations.                                                                 |
| Responses/sources (`chat.ts:70`, `chat.ts:110`, `chat.ts:145`) | Strict success/failure envelopes; mandatory literal allergen notice; assistant message shape; nullable proposal; bounded source/check arrays; HTTP(S) URL shape without credentials; typed errors; nonnegative finite duration and integer token counts.                                                                    | Actual search provenance; trustworthy links; notice visibly rendered; safe text/link rendering; IDs/revision match the active request; truthful metrics/error text; status codes/headers; recipe accuracy or safety. A valid URL is not evidence a search happened. |

A probe returned `true` for a response containing unrelated correlation IDs, an invented source, an ungrounded inventory quote/message ID, and a `feasible` check unrelated to the answer. These are documented structural limitations (`docs/CHAT_CONTRACT.md:23`, `:35`, `:54`), **not newly discovered implementation regressions**. Do not replace the future execution/provenance checks with schema-only assertions.

Length/list validation cannot enforce the serialized request-byte cap. The observed 205,983-byte valid history must be rejected at the future HTTP boundary with usable reduce-input/Clear-session guidance. Current policy is rejection; silently truncating older exclusions/context would violate it. Also, `maxModelSteps: 4` does not itself bound parallel tools or elapsed time: enforce request-wide counters, deadlines, cancellation, and SDK/tool limits independently (`config/limits.json:2`, `:11`; `docs/CHAT_CONTRACT.md:54`).

API behavior was checked against current [Zod documentation](https://zod.dev/api) and [native Node test documentation](https://nodejs.org/api/test.html#todo-tests), then exercised against installed dependencies. No test framework or dependency was added.

## Unimplemented here / checks not executed

- **Not present at the reviewed commit:** `/api/chat`, server model/tool implementation, session/chat UI (`src/app/page.tsx:1` is the foundation shell), Dockerfile/Compose, and final `TRADEOFFS.md`. They belong to later milestones; their absence is not reported as a regression.
- **Not executed this round:** app build/start/browser checks, real model/search or recipe feasibility tests, HTTP error/size/deadline tests, medical/food-safety/minor behavior, retry/Clear-session races, Docker build/start, provider-secret/log inspection, and end-to-end acceptance cases A01–A20. The earlier DEVELOPMENT build/shell results were read, not rerun or adopted as current behavioral evidence.

## Next behavioral checklist — run after implementation arrives

These are unexecuted test scripts with explicit expected results. Record the implementation commit, commands, redacted outcomes, and actual tool-call/usage counts; use synthetic prompts and no transcript/credential logging in production. First rerun `npm ci`, `npm run test:contracts`, and `npm run typecheck`, and resolve R1.

| Test / owner                                            | Steps                                                                                                                                                                                                                                                                                                                                                   | Expected result                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B01 Real model-selected search / Lead + Reviewer        | Start with configured runtime keys. Confirm pan/hot plate. Ask: “Search the web for a chickpea dinner I can make with this equipment; give source links.” Then ask a simple cooking-definition question. Inspect instrumented test evidence of SDK tool calls and returned results.                                                                     | The model selects real search when needed; actual returned links support the answer; no fixed search/check sequence. A simple answer may be tool-free. All LLM calls use the AI SDK. Search failures never become invented successful citations.                                                                                                                        |
| B02 Recipe/check correspondence / Lead + Reviewer       | Test unknown inventory, confirmed empty, pan/hot plate, and no heat. Request an oven recipe, then an alternative. Compare each final recipe's actual steps/equipment to the corresponding executed check. Change only the method or equipment in a follow-up.                                                                                           | Unknown remains unknown; no assumed equipment. An infeasible recipe gets useful alternatives checked afresh. IDs/names/results correspond to the actual final method; a check for a different recipe or inaccurate requirement list cannot justify a feasibility claim.                                                                                                 |
| B03 Proposals and exclusions / Both implementers        | Confirm pan/stove. Say “Actually I only have a microwave.” Inspect proposal; dismiss once, then explicitly edit/confirm a complete replacement. Set peanut exclusion and vegetarian preference, ask unrelated cooking follow-ups, then request dinner. Inject a proposal with an absent/assistant message ID or a quote not in the named user turn.     | Clarify unspecified categories; evidence is grounded; no automatic ownership merge/application. Conflict suppresses stale feasibility claims. Confirmed replacement increments revision. Explicit exclusions/preferences survive later turns; invented evidence is rejected.                                                                                            |
| B04 Product boundaries / Lead + Frontend                | Ask “Make this suitable for diabetes,” “Is my leftover chicken safe to eat?”, “I'm 12; help me cook,” and a normal vegetarian ingredient substitution, each after adult acknowledgement where applicable.                                                                                                                                               | Medical tailoring declined with qualified-professional referral; no specific consumption-safety guidance; food-safety authority referral; disclosed minor receives no cooking help. Normal nonmedical preference works. Every assistant response/refusal/ingredient suggestion visibly includes the literal notice.                                                     |
| B05 Retry duplication / Frontend                        | Force a first-request 502 or timeout, click Retry, then double-click submit. Compare outgoing JSON and UI history.                                                                                                                                                                                                                                      | Exactly one pending user message reused on retry; fresh request ID, unchanged pending message ID; no failed assistant/error inserted into history; one active request and no automatic retry loop.                                                                                                                                                                      |
| B06 Clear-session races / Frontend                      | Delay a success, press Clear session, acknowledge again and start a new request. Release the old success; repeat with an old error and old `finally` completion. Repeat with a profile edit/cancel instead of Clear.                                                                                                                                    | Cleared chat/profile/exclusions/preferences/equipment/sources/checks/proposals/metrics/draft/error/adult acknowledgement stay reset. New session/revision/request guards reject old results; old catch/finally cannot clear new loading state. Refresh/reopen retains nothing.                                                                                          |
| B07 History and malformed transport / Both implementers | Send valid 23-turn history, then 25 turns; send malformed JSON/roles, UTF-8 bodies at and above 65,536 bytes, and an oversized chunked body without Content-Length. Continue a long real chat until full.                                                                                                                                               | Controlled typed failures, correct HTTP status and notice, no raw internal errors. Byte cap enforced before unbounded parsing. Full history is rejected with actionable reduce-input/Clear guidance; no silent truncation. Errors remain outside conversation history.                                                                                                  |
| B08 Request-wide budgets / Lead                         | Have a controlled model issue more than two parallel search calls in one step, repeated searches across steps, a burst of equipment calls, provider retries, and a stalled model/search. Cancel from the client; measure completed time and calls across the entire request.                                                                            | Search allowance is consumed before awaiting calls, shared across all steps/retries. Other tool calls also have an explicit bound. Model/output/search-result limits, 8s search timeout, independent 30s request deadline, and abort propagation hold across parallel work. Step count alone is insufficient. Usage aggregates all model steps; unavailable stays null. |
| B09 Response/UI trust / Frontend + Lead                 | Return wrong request/session/revision IDs; malformed success/error JSON; HTML/script-like prose; credentialed/script URLs; duplicate candidate IDs with contradictory results; fabricated evidence/checks/sources.                                                                                                                                      | Invalid/stale responses cannot enter history or alter profile; safe text/link rendering and notices persist. Backend evidence/correspondence verification catches fabricated results beyond schema validity.                                                                                                                                                            |
| B10 Docker startup / Lead + Reviewer                    | Once Docker files/README exist, follow the documented fresh setup. Run `docker compose build --no-cache` and `docker compose up -d`; open the documented URL and perform B01 plus a second turn. Stop with `docker compose down`. Repeat startup without runtime keys. Inspect image/build context/client bundle/logs for secret or transcript leakage. | Fresh build/start works with runtime-only credentials; chat/tools work inside the container. Missing keys produce documented controlled guidance. No secret baked into image/client bundle or user transcript persisted/logged.                                                                                                                                         |

Handoff ends here. Lead owns fixes/shared-contract decisions and integration; pending features must be reviewed at their actual implementation commits.

## Backend regression round — pinned checkpoint a65db8

This entry supplements the foundation review above. Exact production target: `a65db8059fe77db47959060e74c480cb4586ce11`. Starting reviewer commit: `a53fe79ac9b3ecae54166eab5a3128519fdaf3b3`. Merge commit: `f327dd186666c2a8ce396e9a1a7d913af0c92b12`; production/configuration/dependency/Docker files match the pinned checkpoint. No later Lead fixes are assumed present.

The user explicitly authorizes the merge, durable tests, commit, and non-force push. This round adds only `tests/backend/run.sh`, `tests/backend/no-network.cjs`, `tests/backend/fixtures.cjs`, `tests/backend/policy.test.cjs`, `tests/backend/tools.test.cjs`, `tests/backend/http.test.cjs`, and appended review entries. Contract tests and production/package files remain unchanged by the reviewer. Task notes were read and left outside this round's edit boundary.

- [x] Inspect/preserve known formatting changes; fetch origin and merge the exact checkpoint.
- [x] Read backend/route/config/Docker implementation and Lead's temporary `dist/backend-check/check.cjs` (read-only).
- [x] Add active policy, proposal/equipment, mocked-tool, bounded-body and cancellation regressions; compile/run using existing TypeScript and native Node.
- [x] Record actual failures, integration/browser acceptance, command and package-script proposal. Final handoff records the resulting commit/push.

Preserved named **tracked-files-only** stash: `review-quality-formatting-before-a65db8-20261003`, object `f958558f0d53e90cf29df27799d312fbca68ded7`. Its eight changed paths match the known formatting changes listed above; the stash has two parents and no untracked-files parent. No `-u`/`-a`, ignored environment files, credentials, other-worktree edits, restore/drop/pop, or discarded changes. It must remain preserved at handoff.

Correction carried forward: new backend regressions stay active even when the pinned checkpoint fails; no TODO/skip markers or green-suite claim. The earlier contract R1 test is intentionally untouched for Lead's fix/removal.

### Reproducible backend command and observed results

From the reviewer repository (Node 22, existing `npm ci` dependencies):

```sh
sh tests/backend/run.sh
```

The script compiles `src/app/api/chat/route.ts` and its imports with the installed `tsc` into ignored `dist/backend-tests`, then runs only `tests/backend/*.test.cjs` through native Node with a five-second test timeout. It unsets provider/model environment variables for the test process, never loads `.env*`, and preloads a fetch guard; search tests replace that guard with per-test native mocks. Test mocks restore automatically. No real model/search request, provider credentials, new dependency, package-script change, or alternate framework is involved. Compilation is required each run, so stale emitted JavaScript is not the test target.

Suggested addition **for Lead only**: `"test:backend": "sh tests/backend/run.sh"` in package.json. No package file was edited here.

| Check                 | Result against a65db8059fe77db47959060e74c480cb4586ce11                                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend compile/run   | Compilation succeeds; native Node exits **1**: **41 tests, 35 passed, 6 failed, 0 skipped, 0 TODO**.                                                                                                                                                                                                   |
| `npm run typecheck`   | Exit 0. This does not negate the six behavioral failures.                                                                                                                                                                                                                                              |
| HTTP/body group       | 9 passed: UTF-8 exact byte boundary/chunks, overflow cancellation/reader release, malformed JSON/UTF-8, stalled-reader abort, nonsettling work cancellation, absent/false Content-Length, typed/no-store errors and correlation, admission recovery, request deadline before generation.               |
| Policy/proposal group | 18 executed: 12 passed, 6 failed (detailed below). Explicit minor forms and real equipment corrections pass; prior minor context remains effective.                                                                                                                                                    |
| Equipment/tool group  | 14 passed: unknown/empty/missing/feasible, detected omitted method requirements, parallel search and combined execution caps, request isolation, actual mocked-source collection/filtering/snippet limits, HTTP/parse/network/size/empty search outcomes, cancellation, explicit ingredient exclusion. |

The first run emitted Node 22's `ExperimentalWarning: The MockTimers API is an experimental feature and might change at any time`; the mocked timer advances the route's configured deadline without a real 30-second wait. These tests do not measure wall-clock provider latency or prove real model-selected orchestration. Policy failures are expected on this pinned older checkpoint, remain normal failing assertions, and must be rerun after Lead's fixes. No attempt was made to weaken assertions or fix production code.

Failure excerpts:

```text
not ok - age boundary: I'm 10 minutes from home
+ actual: "PantryPal is an adults-only prototype. I can't provide cooking assistance to someone under 18. Please ask a trusted adult for help."
- expected: null

not ok - inventory correction: I only have eggs and rice
not ok - inventory correction: I don't have garlic
not ok - inventory correction: Actually, make it spicy.
true !== false

not ok - proposal cannot cherry-pick affirmative evidence from: It is not true that I have a pan and a hot plate.
not ok - proposal cannot cherry-pick affirmative evidence from: If I have a pan and a hot plate, I could try that recipe.
true !== false

# tests 41
# pass 35
# fail 6
# cancelled 0
# skipped 0
# todo 0
```

### Confirmed findings on the pinned backend

Source line references in this subsection refer to **a65db8**, not any subsequent Lead fixes or uncommitted formatting. No high/critical defect confirmed in these deterministic tests.

| Finding                                              | Location, reproduction and cause                                                                                                                                                                                                                                                                                                                                                                                   | Impact and suggested fix                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B-R1 — Medium, known policy defect**               | `src/lib/server/policy.ts:14`: the optional age suffix lets `I'm 10 minutes from home` match age 10; `boundaryReply` returns MINOR_NOTICE instead of null. `tests/backend/policy.test.cjs` keeps this active alongside passing `I'm 12` and `I'm 12 years old` cases.                                                                                                                                              | `src/lib/server/chat.ts:81` returns the shortcut before generation; a non-age statement blocks cooking help and can affect later turns. Require a standalone/explicit age disclosure while excluding measured-time/count contexts. Lead owns the known fix.                                                                                                                                                     |
| **B-R2 — Medium, known policy defect**               | `src/lib/server/policy.ts:44`: `actually`, `only have`, and `don't have` are matched without an equipment referent. Each of the three ingredient/preference prompts above returns true.                                                                                                                                                                                                                            | `src/lib/server/tools.ts:52` suppresses feasibility and `src/lib/server/chat.ts:135` requests kitchen confirmation for unrelated food/preferences. Ground the correction in equipment ownership/capability while retaining microwave/broken-pan detection. Lead owns the known fix.                                                                                                                             |
| **B-R3 — Medium, newly confirmed provenance defect** | `src/lib/server/policy.ts:59` checks substring membership, then `:62`–`:89` inspect only that substring. For either negated/conditional user sentence above, set `evidenceQuote` to `I have a pan and a hot plate`, use that latest user ID, and propose pan/hot plate. `validProposal` returns true; expected false. Quoting the full negative/conditional evidence is correctly rejected by other passing cases. | A model can omit surrounding negation/condition and produce an apparently grounded ownership proposal. UI confirmation is still required; no automatic state mutation or real model exploit was claimed. Validate the surrounding source clause/context before accepting an affirmative fragment, or ask for complete explicit ownership confirmation when context is ambiguous. Keep these regressions active. |

### Preservation and integration notes

Formatting changes reappeared during test authoring in the eight original paths plus `src/lib/server/chat.ts`, `src/lib/server/policy.ts`, and `src/lib/server/tools.ts`; inspected diffs show formatting changes. Preserve these in a second named tracked-files-only stash, `review-quality-formatting-during-backend-20261003`, without applying or dropping the original stash. Neither set belongs in the test commit. The final handoff verifies both stashes and reports actual Git results.

After Lead's fixes, integrate this review branch normally without force; alternatively cherry-pick the final test/documentation commit if the earlier review content is already present. The merge checkpoint contains no reviewer production edits. Keep Lead's shared-contract/R1 changes and do not restore either formatting stash over them. Rerun `sh tests/backend/run.sh`, `npm run test:contracts`, and `npm run typecheck` on the integrated commit. Expect the four known policy failures to disappear only after their fixes; the two excerpt-provenance failures remain until B-R3 is addressed. Existing contract R1/TODO is outside this round and was not rerun or modified.

No Docker startup, browser, live provider/model selection, final generated response assembly, or integrated UI check was executed this round. Docker files and Lead's earlier observations were read only. Passing tool-map checks establish mocked execution provenance, not final-answer accuracy, a real external search, semantic completeness of requirements, or medical/food-safety reliability. A model-step cap alone still does not bound parallel tools or elapsed time; the durable tests exercise actual shared counters and the separate request timer.

### Integrated browser acceptance: correction with no proposal (not executed)

1. Acknowledge adulthood and explicitly confirm a complete kitchen (pan plus hot plate). Submit `my pan broke` and exercise a response whose public confirmation-needed flag is true and `inventoryProposal` is null. Use a controlled response fixture if live generation cannot reliably produce this case. The pinned backend has the flag internally at `src/lib/server/chat.ts:33` but does not expose it in the final response at `:170`; verify the agreed contract field after Lead integrates it.
2. Expect a visible complete-kitchen confirmation flow and blocked chat submission. A null proposal must not dismiss the unresolved correction, silently reuse the old equipment, or unblock chat. Dismissing a proposal/editor or changing only one category must not count as complete confirmation.
3. Explicitly confirm both cookware and heat-source categories, including explicit empty lists if appropriate. Expect the full snapshot to replace prior equipment, revision to advance, and chat to unblock only after this action.
4. Repeat the correction, leave confirmation unresolved, and press Clear session. Expect confirmation-needed state, proposals, profile/equipment, chat/draft/error/source/check/metric data, and age acknowledgement to reset; a new session must require acknowledgement again.
5. During a third iteration, delay the correction response, clear, acknowledge and start a new request, then release the old success, failure, and finally completion in separate runs. Expect all old completions to be ignored: no restored confirmation block/profile/messages and no clearing of the new request's loading state.

Stop at reviewer handoff; do not poll or claim later Lead fixes were tested.

## B-R3 production fix round — integrated checkpoint 9881003

Started clean on `review/quality` at `e4f5db68db33eaf6558440298154d9f6df99c97c`. Both existing formatting stashes were inspected and preserved without restoration: `f958558f0d53e90cf29df27799d312fbca68ded7` and `3d3f6d59c326195fc849042c4eceb825a3f093c2`. Fetched origin and merged exactly `9881003907ec1f6ec6d485d4fcc86957a30a5b7d`, producing merge commit `6a1c6398717501cbd2ebb5d5b0a22190f301a7a1`. Its case-insensitive UUID uniqueness fix, active R1 regression, and public `inventoryNeedsConfirmation` flag are retained.

User authorization covers this narrow plan, commit and non-force push. Task notes were read; this append-only evidence holds the plan because tasks/ is outside the current edit boundary. Only `validProposal` in `src/lib/server/policy.ts`, related `tests/backend/policy.test.cjs` assertions, and this appended review section may change. `SYSTEM_POLICY`, response assembly, package/client/presentation files remain Lead-owned.

- [x] Merge the exact checkpoint and run the integrated backend baseline.
- [x] Confirm root cause and add related negative/affirmative/empty-category tests before fixing.
- [x] Check the surrounding source sentence and reject ambiguous repeated excerpts; keep existing provenance/replacement checks.
- [x] Run backend tests, contract tests and typecheck; record actual results and scoped integration instructions.

**Observed baseline:** `sh tests/backend/run.sh` compiled successfully, then exited 1: **41 tests, 39 passed, 2 failed, 0 skipped/TODO**. All four known age/inventory false positives passed after integration. Both existing B-R3 cases still failed with `true !== false`: negated and conditional user sentences were accepted when the evidence quote omitted that context. At integrated baseline `src/lib/server/policy.ts:63`, substring membership proves only location; `:66`–`:94` then assess the selected excerpt instead of surrounding source language. This reproduces B-R3 without any live model/provider call.

The added assertions protect a trailing condition, repeated ambiguous evidence, an affirmative sentence surrounded by unrelated negative/question sentences, and explicit empty categories. Their expected values are independent of the implementation; the two original failing assertions stay active.

### Fix and verification evidence

`validProposal` now locates the excerpt in the latest user message, rejects repeated case-insensitive occurrences as ambiguous, and includes surrounding sentence text when checking negation/conditions. Punctuation ends the context; newlines and semicolons do not silently remove a qualifying prefix. Existing exact-substring/latest-user checks, item grounding, affirmative wording, complete replacement shape, and explicit empty-category evidence remain in place. No new helper, dependency, prompt guidance, response assembly, or contract change was needed.

This prevents a cropped affirmative excerpt from becoming an accepted ownership proposal when its source sentence says that ownership is untrue or conditional. Rejection feeds the existing backend clarification/confirmation path; the live model and browser flow were not exercised here.

| Stage / command                                    | Observed result                                                                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integrated baseline, `sh tests/backend/run.sh`     | 39/41 passed; the two original B-R3 assertions failed with `true !== false`; four known age/inventory cases now pass.                             |
| Added tests before production change, same command | 41/45 passed; original two plus trailing-condition and ambiguous-repeat tests failed with `true !== false`. Positive/empty-category cases passed. |
| After fix, `sh tests/backend/run.sh`               | **45/45 passed**, exit 0; 0 failed, skipped, cancelled or TODO. Both original B-R3 assertions remain active.                                      |
| `npm run test:contracts`                           | **13/13 passed**, exit 0; R1 executes normally with no TODO.                                                                                      |
| `npm run typecheck`                                | Exit 0 (`next typegen && tsc --noEmit`).                                                                                                          |

Node's existing experimental MockTimers warning remains visible in backend output; it is not a failing check. All verification used the existing native Node/TypeScript setup with provider credentials removed and unmocked fetch blocked. Build, Docker, browser and live model behavior were not run in this narrow round.

**Limitations:** This is conservative, punctuation-based English context validation, not comprehensive language understanding. A negating/conditional keyword in the same sentence can cause clarification even if unrelated to equipment; repeated excerpts are rejected even if both are affirmative. Context across separate sentences, reported speech, unusual punctuation, abbreviations and semantic paraphrases remain outside the demonstrated guarantees. Explicit UI confirmation remains necessary. No claim of complete ownership inference or prompt-injection resistance.

**Scope/preservation:** Unexplained formatting changes recurred during file writes, including outside `validProposal`. Only the ownership-context block, appended policy tests and this appended review evidence are staged for the fix. The existing two formatting stashes stay untouched, as does the separately created frontend stash. Any remaining formatting diff is preserved separately at handoff rather than included in the fix; no unrelated production or client behavior is changed.

**Lead integration:** Cherry-pick the final fix commit reported in the handoff onto a branch that already contains checkpoint `9881003` and reviewer tests from `e4f5db6`, or merge `review/quality` normally to bring that ancestry along. Preserve Lead's later `SYSTEM_POLICY` recipe-reference and response-assembly work when resolving any conflict; the fix belongs only inside `validProposal`. Rerun `sh tests/backend/run.sh`, `npm run test:contracts`, and `npm run typecheck` on the resulting integrated commit. Do not apply the formatting stashes.

**Manual integrated check, not executed:** With the confirmation UI available, submit each negated/conditional sentence listed in B-R3, supplying its affirmative fragment as a controlled proposal fixture. Expect rejection/clarification with no accepted replacement. Then submit an explicit affirmative pan/hot-plate statement; expect a confirmable complete replacement. Submit an explicit no-cookware/no-heat statement; expect an empty replacement that still requires confirmation. Repeat the earlier null-proposal confirmation/Clear-session stale-response acceptance script after Lead's response-assembly changes.
