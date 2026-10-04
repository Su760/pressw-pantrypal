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
