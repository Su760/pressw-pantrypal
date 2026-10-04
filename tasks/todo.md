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
- [ ] Add minimal Node 22+ Docker/Compose with runtime-only credentials; verify build/start and update README/log.
- [ ] Commit/push Docker checkpoint; report evidence and stop without merging other branches.

Edit boundary: src/app/api/chat/route.ts; src/lib/server/{errors,http,policy,tools,chat}.ts; config/limits.json; config/server.json; README.md; DEVELOPMENT.md; tasks/{todo,lessons}.md; Dockerfile; compose.yaml; .dockerignore; next.config.ts; package.json/package-lock.json only if needed. Contract src/lib/contracts/chat.ts stays unchanged. Existing tests may be run but tests/** and all frontend-owned files are read-only. Focused ad hoc backend assertions may run from temporary locations without writing reviewer-owned tests.
