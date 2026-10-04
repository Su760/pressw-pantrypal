# Scope and foundation round

Authorization: the user's Phase A / Phase B instructions approve this plan, both commits, a non-force push, and sibling worktrees. Proceed between phases without another approval. LEAD is the sole writer this round; no feature implementation.

- [x] Read all assessment artifacts and DEVELOPMENT.md; inspect local Git and remote state.
- [x] Write and commit the six-section scope before application code.
- [x] Preserve original README as ASSESSMENT.md; add minimal Next.js/TypeScript scaffold, compatible locked dependencies, validated shared contract, and safe exclusions.
- [x] Run typecheck, production build, and focused foundation verification; record observed results and limitations.
- [x] Commit and push foundation; create sibling frontend/reviewer worktrees. Initial base 77a9483 pushed and both clean worktrees created; final parser correction is committed/pushed and fast-forwarded as the final handoff operation.

Edit boundary: SCOPING.md; DEVELOPMENT.md; tasks/todo.md; tasks/lessons.md; ASSESSMENT.md; README.md; package.json; package-lock.json; tsconfig.json; next-env.d.ts; next.config.ts; .gitignore; .dockerignore; .env.example; .nvmrc; src/app/layout.tsx; src/app/page.tsx; src/app/globals.css; src/lib/contracts/chat.ts; config/limits.json; docs/CHAT_CONTRACT.md; tests/contracts/chat.test.cjs. Original brief/, REQUIREMENTS.md, and assessment.json remain unchanged. No chat endpoint or model/tool implementation in this round.

Foundation verification refinement: add focused native Node contract checks (no test-framework dependency) after finding reply/history length mismatch. Verify the failure before sharing the assistant schema between responses and history.

Final evidence update will touch only DEVELOPMENT.md and tasks/todo.md after the foundation commit/push and worktree creation, so observed Git outcomes can be recorded without rewriting history.

Final malformed-input verification exposed an uncaught URL-constructor exception in SourceSchema. Reproduce in the existing focused test, guard parsing, rerun checks, commit/push the correction, and safely fast-forward both clean worktrees without changing their branches.

# Round two — backend and Docker

User explicitly approved implementation, API checkpoint commit/push, then Docker and handoff. Start verified on main at 3ae1af9 with a clean worktree; other sessions work independently. Keep shared JSON contract stable; do not merge or edit frontend/reviewer files.

- [x] Verify repository/worktrees; read current contract/scope/log and installed SDK docs; record confirmed timing.
- [x] Implement bounded request parsing, typed errors, deadline/cancellation, model-selected tools and request-wide budgets, grounded metadata/proposals, content boundaries and usage/latency.
- [x] Run existing contract checks, typecheck/build, focused backend assertions and small live API/tool smoke; document actual failures/results; commit/push API checkpoint.
- [x] Add minimal Node 22+ Docker/Compose with runtime-only credentials; verify build/start and update README/log.
- [x] Commit/push Docker checkpoint; report evidence and stop without merging other branches.

Edit boundary: src/app/api/chat/route.ts; src/lib/server/{errors,http,policy,tools,chat}.ts; config/limits.json; config/server.json; README.md; DEVELOPMENT.md; tasks/{todo,lessons}.md; Dockerfile; compose.yaml; .dockerignore; next.config.ts; package.json/package-lock.json only if needed. Contract src/lib/contracts/chat.ts stays unchanged. Existing tests may be run but tests/** and all frontend-owned files are read-only. Focused ad hoc backend assertions may run from temporary locations without writing reviewer-owned tests.

# Round three — integrated checkpoint

Authorization: the user's explicit integration/fix request approves this plan, normal merges of the two pinned commits, verification, and commit/push on main. Do not merge later frontend polish or reviewer backend tests.

- [x] Verify clean main, fetch origin, inspect worktrees and integrate only reviewer a53fe79 and frontend 1c71172 with normal merges.
- [x] Fix case-insensitive IDs, age/quantity detection, equipment correction context, and persistent confirmation flag.
- [x] Run focused temporary regressions, merged contract tests, typecheck/build, integrated live browser/API cases.
- [x] Rebuild/start Docker away from port 3001; verify browser chat, real tools and follow-up.
- [x] Update README, TRADEOFFS, DEVELOPMENT with actual results. Commit/push is the final handoff operation; report its observed outcome without claiming it in advance.

Edit boundary for this round: src/lib/contracts/chat.ts; src/lib/server/{policy,chat}.ts; src/lib/client/use-chat.ts; tests/contracts/chat.test.cjs (R1 TODO only); docs/CHAT_CONTRACT.md; README.md; TRADEOFFS.md; DEVELOPMENT.md; tasks/{todo,lessons}.md. Temporary ignored dist/ checks may be written. Other merged frontend files remain untouched.

# Round four — bounded recipe-reference recovery

User authorizes the pinned merges, narrow backend recovery, regressions, verification and main commit/push. Preserve both existing stashes, all round-three contract/client fixes, and concurrent ownership boundaries.

- [x] Verify original directory, clean main at 9881003, remote/stashes; fetch and normally merge FRONTEND 9a6eafb and REVIEWER e4f5db6 only.
- [x] Add deterministic conflict-first/invalid-reference fallback, then at most one recovery sharing execution, steps, usage, signal and original deadline.
- [x] Add durable response/recovery regressions and test:backend; run backend/contracts/typecheck/build, report reviewer-owned known failures unchanged.
- [ ] Docker rebuild on 3102 blocked by BuildKit read-only filesystem; no new container verification claimed. Equivalent real-provider sequence passed on current local production build at 3103, including an actual recovery. Engine restart awaits approval because it affects unrelated containers.
- [x] Update integration docs with actual evidence and limitations. Commit/push is the final operation; report its observed outcome in the handoff without polling other sessions.

Edit boundary: src/lib/server/chat.ts (optional narrow response helper only if necessary); SYSTEM_POLICY recipe-reference/recovery wording in src/lib/server/policy.ts only; tests/backend/chat.test.cjs; package.json scripts; tests/backend/run.sh only if runner compilation needs the new helper; README.md, DEVELOPMENT.md, TRADEOFFS.md; tasks/todo.md and tasks/lessons.md. validProposal and reviewer policy tests/review notes are read-only. All presentation files and existing shared contract/client code are read-only.

# Final integration baseline

Authorization: the user's final integration instructions approve this exact plan, pinned merges, verification, documentation, commit and non-force push on main. Original assessment worktree verified clean at 4a2721a; all four stashes preserved. Aim for handoff within eight minutes; hard stop October 3, 23:34:09 CDT.

- [x] Fetch and normally merge REVIEWER 7b9bfa3e887354d568f22e5a9078886ea4a399c0 and FRONTEND 58db1769ccc5876e3215b2ebfba7cca032b03edd only.
- [x] Run backend/contracts/typecheck/build; check Docker once and attempt current build/start on 3102 if healthy. Use current local production fallback if blocked.
- [x] Verify real search/checked recipe and follow-up, browser null-proposal correction and Clear session; label mock evidence explicitly.
- [x] Update README, TRADEOFFS and DEVELOPMENT; verify deliverables/artifact integrity and safe staging.
- Final operation: commit and non-force push the verified baseline, then report the observed hash/remote equality in the handoff and stop.

Edit boundary: README.md, TRADEOFFS.md, DEVELOPMENT.md, tasks/todo.md, tasks/lessons.md. Reviewed code/tests/docs enter only through the specified merges. Temporary verification evidence stays ignored under dist/. No edits to separately owned presentation files or docs/DEMO.md; no dependency copies, credential changes, Docker repair or cache/image/volume deletion.

Final plan update authorized by user: add exact REVIEWER demo commit 59b288a05034d1fe0dfb7a1faf40943f90a7e00e and finalize docs/DEMO.md recovery/retry wording, historical 502, verified Docker URL, and stale line references. This adds docs/DEMO.md to the edit boundary. Do not wait for frontend styling.

# Final CSS styling integration

User authorizes exact FRONTEND d65275914696ae5d1c3e387f4aed0caabc5d1c6d integration from verified main e361e66, Docker rebuild/start on 3102, focused desktop/375px checks, documentation and non-force commit/push by approximately 23:30 CDT (hard deadline 23:34:09). Scope: pinned merge of src/app/globals.css; DEVELOPMENT.md and task logs only. Preserve behavior and unrelated work; no backend/provider-suite rerun.

- [x] Verify clean main at e361e66, four stashes, independent HTTP 200 and healthy Docker before integration; inspect exact CSS-only diff.
- [x] Merge pinned styling commit and rebuild/start final Docker image on 3102.
- [x] Check desktop/375px readable notices, kitchen confirmation/composer reachability, overflow and Clear session; update DEVELOPMENT.md.
- Final operation: verify safe staged docs, commit and non-force push; report actual remote equality and stop.
