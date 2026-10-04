# PantryPal

Scope and shared foundation for the cooking-assistant assessment. **Chat, model/tools, session controls, and Docker execution are not implemented yet.** The app currently serves a static shell; `/api/chat` is absent and returns 404.

Public repository: https://github.com/Su760/pressw-pantrypal

The original assessment README is preserved byte-for-byte in [ASSESSMENT.md](ASSESSMENT.md). Stakeholder briefs and requirements are unchanged. See [SCOPING.md](SCOPING.md), [DEVELOPMENT.md](DEVELOPMENT.md), and the [shared contract](docs/CHAT_CONTRACT.md).

## Run the foundation

Use Node.js 22+ (`.nvmrc` records the verified local version) and npm.

```sh
npm ci
npm run typecheck
npm run test:contracts
npm run build
npm start
```

Open http://localhost:3000. For development, use `npm run dev` instead of build/start. No live API keys are required to install, typecheck, build, or open the shell.

For later backend integration, copy `.env.example` to ignored `.env.local`, privately replace placeholders for `OPENAI_API_KEY`, `TAVILY_API_KEY`, and `OPENAI_MODEL`, and never expose them through `NEXT_PUBLIC_` variables. No model ID is selected by this foundation. Runtime configuration validation belongs to T2. Never commit real environment files or pass credentials as Docker build arguments.

Dependencies are pinned in `package.json` and `package-lock.json`. Tunable request/tool bounds live in `config/limits.json`; runtime work bounds remain to be wired into the backend. Validation schemas/types are exported by `src/lib/contracts/chat.ts`. The contract specifies normal JSON responses, equipment confirmation, errors, cancellation, and Clear session behavior. There is no successful chat curl example until T2 is implemented.

## Parallel work

LEAD owns shared/backend/configuration files. FRONTEND and REVIEWER use separate sibling worktrees on `feat/frontend` and `review/quality`; see contract ownership and the development log. Ignored environment files and installed `node_modules` do not copy into new worktrees: run `npm ci` there and provision runtime credentials privately only when needed. All sessions were read-only except LEAD during foundation creation.

Docker/Compose, focused behavioral tests, real AI/tool verification, and `TRADEOFFS.md` remain later assessment milestones. Do not interpret foundation build success as evidence that the scoped cooking assistant works.
