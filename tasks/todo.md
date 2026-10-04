# Scope and foundation round

Authorization: the user's Phase A / Phase B instructions approve this plan, both commits, a non-force push, and sibling worktrees. Proceed between phases without another approval. LEAD is the sole writer this round; no feature implementation.

- [x] Read all assessment artifacts and DEVELOPMENT.md; inspect local Git and remote state.
- [x] Write and commit the six-section scope before application code.
- [x] Preserve original README as ASSESSMENT.md; add minimal Next.js/TypeScript scaffold, compatible locked dependencies, validated shared contract, and safe exclusions.
- [x] Run typecheck, production build, and focused foundation verification; record observed results and limitations.
- [ ] Commit and push foundation; create sibling frontend/reviewer worktrees; hand off ownership and stop.

Edit boundary: SCOPING.md; DEVELOPMENT.md; tasks/todo.md; tasks/lessons.md; ASSESSMENT.md; README.md; package.json; package-lock.json; tsconfig.json; next-env.d.ts; next.config.ts; .gitignore; .dockerignore; .env.example; .nvmrc; src/app/layout.tsx; src/app/page.tsx; src/app/globals.css; src/lib/contracts/chat.ts; config/limits.json; docs/CHAT_CONTRACT.md; tests/contracts/chat.test.cjs. Original brief/, REQUIREMENTS.md, and assessment.json remain unchanged. No chat endpoint or model/tool implementation in this round.

Foundation verification refinement: add focused native Node contract checks (no test-framework dependency) after finding reply/history length mismatch. Verify the failure before sharing the assistant schema between responses and history.

Final evidence update will touch only DEVELOPMENT.md and tasks/todo.md after the foundation commit/push and worktree creation, so observed Git outcomes can be recorded without rewriting history.
