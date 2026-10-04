# PantryPal demo guide

Reviewed source: `7b9bfa3e887354d568f22e5a9078886ea4a399c0`. Per the latest handoff, http://localhost:3103 was the last verified local production URL; confirm availability and served revision. The latest Docker rebuild was blocked by a local engine/filesystem failure. Root documents’ healthy-container claims on 3102 are historical checkpoints requiring final confirmation.

**Three-minute walkthrough — manual script, expected behavior, not recorded outputs:**

- **0:00–0:30:** Select “I am 18 or older.” In the kitchen panel, select “I’m ready to confirm my equipment”; enter frying pan and spatula on separate cookware lines, hot plate under heat sources, then “Confirm kitchen.” Expect confirmed equipment; blank categories do not mean none.
- **0:30–1:10:** Ask: “Find an online chickpea dinner for my confirmed kitchen. List ingredients and sources.” Explain returned links and equipment status; an absent check is not verification. Results vary.
- **1:10–1:40:** Ask: “Modify that recipe to leave out garlic, and check the revised method against my kitchen.” Expect a fresh check for a changed method. If a typed error appears, explain it honestly; use Retry once, then move on. Recipe follow-ups have previously failed.
- **1:40–2:30:** Say: “My pan broke. I only have a microwave-safe bowl and a microwave.” Expect a confirmation block, possibly without a replacement proposal. Inspect any complete proposal and click “Confirm replacement”; otherwise replace both kitchen fields with microwave-safe bowl and microwave, then “Confirm kitchen.” Expect the old pan/hot plate to disappear from confirmed equipment and earlier checks to remain historical.
- **2:30–3:00:** Click “Clear session.” Expect messages, drafts, sources, checks, preferences, equipment, pending corrections, and adulthood acknowledgement to reset. Late replies must not restore them.

**Explain one request:** The client sends conversation, confirmed kitchen, and request/session/revision identifiers. The API bounds and validates JSON (`src/app/api/chat/route.ts:41`). Vercel AI SDK calls the model, which chooses search and equipment tools within limits (`src/lib/server/chat.ts:95`). Checks use the request’s equipment snapshot; sources come from executed searches. The server renders stored checked ingredients/steps, rejecting nonexistent candidate references (`src/lib/server/chat.ts:141`). The client validates the response and correlation identifiers before displaying text, sources, checks, and the allergen notice (`src/lib/client/use-chat.ts:374`).

State lives only in browser memory. Refresh starts over; Clear cannot retract provider requests. Cancellation aborts work and invalidates client correlation first. Limits include 30 seconds overall, eight seconds per search, four model steps, two searches, and eight total tool executions. Recovery stays bounded: tools report failures, alternatives consume the same budget, and retries are user-triggered; provider automatic retries are disabled.

**Three encountered bugs and fixes:**

- `src/lib/server/policy.ts:16`: “I’m 10 minutes from home” matched a minor disclosure; age matching now excludes unit contexts.
- `src/lib/server/policy.ts:39`: ingredient/preference corrections triggered kitchen confirmation; detection now requires an equipment reference.
- `src/lib/server/policy.ts:66`: cropped ownership quotes hid negation/conditions; validation now examines surrounding sentences and rejects ambiguous repetitions.

Recorded regression evidence is in `docs/REVIEW.md`; nothing was rerun for this guide. English heuristics and model-supplied requirements remain imperfect. Prior recipe-reference follow-ups returned safe 502 errors. Equipment compatibility does not establish food or allergen safety; adulthood acknowledgement is not verified age assurance.
