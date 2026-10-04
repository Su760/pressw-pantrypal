# PantryPal MVP scope

This is the initial scope, committed before application code. The assessment and four stakeholder briefs are authoritative; DEVELOPMENT.md records implementation decisions and evidence. This round delivers only scope and the shared foundation. The following commitments describe the eventual assessment MVP.

## Scope committed

- A TypeScript Next.js chat application for general cooking questions, requested recipes, and meals from supplied ingredients. Keep a warm, direct voice. Cooking techniques, equipment, and meal/hosting logistics fit; redirect unrelated requests. Identify missing ingredients instead of assuming pantry staples.
- Editable, user-confirmed cookware and heat sources, with no starter inventory. Unknown inventory differs from a confirmed empty list. Explicit corrections replace conflicting state after confirmation. Check recipe requirements against authoritative session equipment; offer useful substitutions, methods, or another recipe when infeasible, checking alternatives afresh. Never present an unchecked recipe as verified feasible.
- All model calls through Vercel AI SDK with its OpenAI provider. The model chooses whether to call Tavily search and an equipment-checking tool; no fixed search/check sequence. Return real source links when search is used. Bound history, output, tool calls, and runtime; measure completed-answer latency and token usage with one configurable model.
- Keep current-session preferences and explicit ingredient exclusions. Include a deterministic visible allergen notice with every assistant response. Decline medical tailoring, nutritional suitability claims, and specific consumption-safety guidance; refer health and food-safety questions to qualified professionals or authorities respectively.
- Browser-memory session only, with Clear session removing conversation, equipment, preferences, exclusions, and pending results. No application persistence or transcript logging. Adults-only prototype with acknowledgement and a boundary for disclosed minors. Include reproducible Docker execution and accurate setup/trade-off documentation before final assessment delivery.

## Scope cut, with reasons

- Persistent memory, accounts, and cross-session profiles: CEO/CX correctly identify continuity as valuable, but retaining health-adjacent information needs consent, deletion, access control, and provider-retention decisions. Session continuity is a deliberate product compromise: returning users must re-enter their preferences and inventory.
- Favorites, PDF ingestion, voice, grocery exports, and weekly meal planning: each adds state, parsing, interaction, or export work before the core cooking/equipment loop is reliable. Defer even session favorites until the core acceptance checks pass.
- Complex model routing and a guaranteed two-second completed answer: tool round trips and model variability prevent a defensible guarantee in this timebox. Give immediate loading feedback, cap work, and report measured latency and usage. Restaurant recommendations and broader lifestyle advice are also deferred.

## Contradictions resolved

- Legal boundaries override CEO health-personalization ambitions and the PM's chicken-doneness example. Honor explicitly named ingredient exclusions and nonmedical preferences without inferring restrictions from conditions or assuring safety. Refer consumption-safety questions rather than supplying specific doneness/spoilage advice. Personality does not remove disclosures; every assistant response receives the notice to avoid brittle recipe detection.
- PM/CX equipment evidence overrides the assumed starter kit. User-confirmed inventory is authoritative, including an explicit absence of heat sources. A model can propose a correction grounded in the user's words, but cannot invent ownership or silently merge away a contradiction.
- PM's core cooking scope is the floor; CEO direction does not automatically expand v1. Legal retention concerns take precedence over cross-session memory. Quality and useful alternatives take precedence over the PM's unsupported latency guarantee. README says the assessment clock starts at delivery while REQUIREMENTS describes separate setup time: use the delivery system's deadline, do not assume an extension, and label post-window work honestly.

## Clarifying questions

- What exact delivery deadline does the assessment system show? For production, which jurisdictions, age-assurance measures, retention periods, provider settings, and approved health/allergen/referral wording apply?
- Which ingredient exclusions and nonmedical preference accommodations does counsel approve? How should the product respond when users disclose conditions or ask safety questions inside an otherwise valid recipe request?
- What latency percentile and cost per completed turn are acceptable? Which equipment synonyms/capabilities should be supported, and does validating cross-session memory justify the added privacy/account scope after this MVP?

## Assumptions made

- The supplied MVP is approved for this timebox. Normal JSON final responses with immediate client loading feedback are sufficient; streaming and a hosted deployment are not assessment requirements. The user supplies runtime provider/search credentials, kept outside Git and Docker images.
- Explicit ingredient exclusions can be honored as user instructions without diagnosing conditions, promising allergy safety, or claiming nutritional suitability. Equipment proposals require visible confirmation; the UI can always edit and replace the complete confirmed inventory.
- Session data exists transiently in browser/server memory and is sent to providers as required for generation/search. Clear session cannot retract completed provider processing or promise provider-side deletion. Refresh starts over. Adults-only acknowledgement is a prototype policy, not verified age assurance or proof of compliance.

## Risks accepted

- Model output and external search can be inaccurate or contain hostile instructions. Validation, bounded tools, untrusted-content handling, source links, equipment checks, and notices reduce risk but cannot prove perfect content safety or injection resistance. Unknown equipment equivalences require clarification.
- User-supplied history/profile state is untrusted; there is no authenticated identity or durable inventory. Unknown versus empty and explicit confirmation reduce false ownership claims, while adding some conversational friction. Deferring memory leaves a known CEO/CX retention gap.
- Live latency/cost, provider retention, Docker execution, age boundaries, and model/tool behavior require later verification. Request cancellation is best effort upstream; stale completions must never restore cleared state. No production availability, legal-compliance, or food-safety guarantee is claimed by this prototype.
