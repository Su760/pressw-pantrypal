const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const c = require('../../dist/contract-tests/src/lib/contracts/chat.js');

const user = () => ({ id: randomUUID(), role: 'user', content: 'What can I cook?' });
const request = () => ({
  requestId: randomUUID(), sessionId: randomUUID(), sessionRevision: 0,
  adultAcknowledged: true,
  profile: { equipment: { status: 'unknown' }, preferences: [], ingredientExclusions: [] },
  messages: [user()],
});
const response = (req) => ({
  ok: true, requestId: req.requestId, sessionId: req.sessionId, sessionRevision: req.sessionRevision,
  message: { id: randomUUID(), role: 'assistant', content: 'What equipment do you have?' },
  allergenNotice: c.ALLERGEN_NOTICE, sources: [], equipmentChecks: [], inventoryProposal: null,
  metrics: { durationMs: 10, usage: null },
});

test('unknown and explicitly empty equipment remain distinct', () => {
  const unknown = c.EquipmentSchema.parse({ status: 'unknown' });
  const empty = c.EquipmentSchema.parse({ status: 'confirmed', cookware: [], heatSources: [] });
  assert.notDeepEqual(unknown, empty);
  assert.equal(c.EquipmentSchema.safeParse({ status: 'unknown', cookware: ['oven'] }).success, false);
  assert.equal(c.EquipmentSchema.safeParse({ status: 'confirmed', cookware: [] }).success, false);
});

test('request rejects forged roles, unknown fields, bad history, and missing age acknowledgement', () => {
  const req = request();
  assert.equal(c.ChatRequestSchema.safeParse(req).success, true);
  for (const changed of [
    { ...req, adultAcknowledged: false },
    { ...req, unexpected: true },
    { ...req, messages: [{ ...user(), role: 'system' }] },
    { ...req, messages: [user(), user()] },
    { ...req, messages: [] },
    { ...req, messages: [{ ...user(), content: 'x'.repeat(c.CHAT_LIMITS.maxMessageCharacters + 1) }] },
  ]) assert.equal(c.ChatRequestSchema.safeParse(changed).success, false);
});

test('a maximum-size valid reply can be used in the next request history', () => {
  const req = request();
  const reply = response(req);
  reply.message.content = 'x'.repeat(c.CHAT_LIMITS.maxReplyCharacters);
  const validated = c.ChatSuccessSchema.parse(reply);
  const next = { ...req, requestId: randomUUID(), messages: [req.messages[0], validated.message, user()] };
  assert.equal(c.ChatRequestSchema.safeParse(next).success, true);
});

test('notice is mandatory on successes and typed failures', () => {
  const reply = response(request());
  assert.equal(c.ChatResponseSchema.safeParse(reply).success, true);
  assert.equal(c.ChatResponseSchema.safeParse({ ...reply, allergenNotice: '' }).success, false);
  const failure = { ok: false, requestId: null, sessionId: null, sessionRevision: null,
    error: { code: 'INVALID_REQUEST', message: 'Invalid request.', retryable: false },
    allergenNotice: c.ALLERGEN_NOTICE };
  assert.equal(c.ChatResponseSchema.safeParse(failure).success, true);
  assert.equal(c.ChatResponseSchema.safeParse({ ...failure, error: { ...failure.error, code: 'MADE_UP' } }).success, false);
});

test('source URLs reject scripts and embedded credentials', () => {
  assert.equal(c.SourceSchema.safeParse({ title: 'Recipe', url: 'https://example.com/recipe' }).success, true);
  for (const url of ['not a URL', '', 'http://[', 'javascript:alert(1)', 'file:///tmp/recipe', 'https://name:password@example.com']) {
    assert.equal(c.SourceSchema.safeParse({ title: 'Recipe', url }).success, false);
  }
});

test('equipment check cannot report feasible with missing items or invent missing requirements', () => {
  const check = { candidateId: randomUUID(), candidateName: 'Soup', status: 'missing',
    requiredCookware: ['pot'], requiredHeatSources: ['stove'], missingCookware: ['pot'], missingHeatSources: [] };
  assert.equal(c.EquipmentCheckSchema.safeParse(check).success, true);
  assert.equal(c.EquipmentCheckSchema.safeParse({ ...check, status: 'feasible' }).success, false);
  assert.equal(c.EquipmentCheckSchema.safeParse({ ...check, missingCookware: ['oven'] }).success, false);
});

const history = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: randomUUID(),
    role: index % 2 === 0 ? "user" : "assistant",
    content: `Turn ${index}`,
  }));
const equipmentCheck = () => ({
  candidateId: randomUUID(),
  candidateName: "Soup",
  status: "unknown",
  requiredCookware: ["pot"],
  requiredHeatSources: ["stove"],
  missingCookware: [],
  missingHeatSources: [],
});

test("duplicate IDs are rejected across roles and retry keeps one pending user turn", () => {
  const req = { ...request(), messages: history(3) };
  const snapshot = structuredClone(req);
  const retry = { ...req, requestId: randomUUID() };
  assert.deepEqual(c.ChatRequestSchema.parse(retry).messages, req.messages);
  assert.notEqual(retry.requestId, req.requestId);
  for (const index of [1, 2]) {
    const duplicate = structuredClone(req);
    duplicate.messages[index].id = duplicate.messages[0].id;
    const result = c.ChatRequestSchema.safeParse(duplicate);
    assert.equal(result.success, false);
    assert.ok(
      result.error.issues.some(
        (issue) => issue.message === "Message IDs must be unique.",
      ),
    );
  }
  assert.deepEqual(req, snapshot);
});

test("history accepts its last complete boundary and rejects excess without truncating", () => {
  const largestOddCount =
    c.CHAT_LIMITS.maxMessages % 2
      ? c.CHAT_LIMITS.maxMessages
      : c.CHAT_LIMITS.maxMessages - 1;
  const req = { ...request(), messages: history(largestOddCount) };
  req.messages[0].content = "x".repeat(c.CHAT_LIMITS.maxMessageCharacters);
  assert.deepEqual(c.ChatRequestSchema.parse(req).messages, req.messages);
  const over = { ...req, messages: history(largestOddCount + 2) };
  const snapshot = structuredClone(over);
  const result = c.ChatRequestSchema.safeParse(over);
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some(
      (issue) => issue.code === "too_big" && issue.path[0] === "messages",
    ),
  );
  assert.deepEqual(over, snapshot);
  assert.equal(
    c.ChatRequestSchema.safeParse({ ...req, messages: history(2) }).success,
    false,
  );
});

test("malformed nested input, empty text, invalid IDs and revisions fail without throwing", () => {
  const req = request();
  const malformed = [
    null,
    [],
    "not an object",
    { ...req, requestId: "not-a-uuid" },
    { ...req, sessionId: null },
    { ...req, adultAcknowledged: undefined },
    { ...req, profile: null },
    { ...req, profile: { ...req.profile, preferences: "vegetarian" } },
    { ...req, profile: { ...req.profile, ingredientExclusions: [null] } },
    { ...req, profile: { ...req.profile, medicalCondition: "invented" } },
    { ...req, messages: [null] },
    { ...req, messages: [{ ...user(), id: "not-a-uuid" }] },
    { ...req, messages: [{ ...user(), content: " \n\t " }] },
    { ...req, messages: [{ ...user(), content: { text: "Cook dinner" } }] },
    { ...req, messages: [{ ...user(), toolCalls: [] }] },
    ...[-1, 0.5, Number.MAX_SAFE_INTEGER + 1, "0"].map((sessionRevision) => ({
      ...req,
      sessionRevision,
    })),
  ];
  for (const [index, value] of malformed.entries()) {
    assert.equal(
      c.ChatRequestSchema.safeParse(value).success,
      false,
      `malformed case ${index}`,
    );
  }
  assert.equal(
    c.ChatRequestSchema.safeParse({
      ...req,
      sessionRevision: Number.MAX_SAFE_INTEGER,
    }).success,
    true,
  );
});

test("equipment preserves no-heat inventories and validates unknown/missing result states", () => {
  const noHeat = { status: "confirmed", cookware: ["pan"], heatSources: [] };
  assert.deepEqual(c.EquipmentSchema.parse(noHeat), noHeat);
  const labels = Array.from(
    { length: c.CHAT_LIMITS.maxProfileItems },
    (_, index) => `item ${index}`,
  );
  assert.equal(
    c.EquipmentSchema.safeParse({ ...noHeat, cookware: labels }).success,
    true,
  );
  for (const equipment of [
    { ...noHeat, cookware: [...labels, "extra"] },
    { ...noHeat, heatSources: [" "] },
    { ...noHeat, cookware: ["x".repeat(c.CHAT_LIMITS.maxLabelCharacters + 1)] },
  ])
    assert.equal(c.EquipmentSchema.safeParse(equipment).success, false);
  const check = equipmentCheck();
  assert.equal(c.EquipmentCheckSchema.safeParse(check).success, true);
  assert.equal(
    c.EquipmentCheckSchema.safeParse({ ...check, status: "missing" }).success,
    false,
  );
  assert.equal(
    c.EquipmentCheckSchema.safeParse({
      ...check,
      missingHeatSources: ["stove"],
    }).success,
    false,
  );
  assert.equal(
    c.EquipmentCheckSchema.safeParse({
      ...check,
      status: "missing",
      missingHeatSources: ["stove"],
    }).success,
    true,
  );
});

test("response collection limits and malformed metrics/envelopes are enforced", () => {
  const reply = response(request());
  reply.sources = Array.from(
    { length: c.CHAT_LIMITS.maxSources },
    (_, index) => ({
      title: `Source ${index}`,
      url: `https://example.com/${index}`,
    }),
  );
  reply.equipmentChecks = Array.from(
    { length: c.CHAT_LIMITS.maxEquipmentChecks },
    equipmentCheck,
  );
  assert.equal(c.ChatResponseSchema.safeParse(reply).success, true);
  const malformed = [
    { ...reply, sources: [...reply.sources, reply.sources[0]] },
    { ...reply, equipmentChecks: [...reply.equipmentChecks, equipmentCheck()] },
    {
      ...reply,
      message: {
        ...reply.message,
        content: "x".repeat(c.CHAT_LIMITS.maxReplyCharacters + 1),
      },
    },
    { ...reply, message: { ...reply.message, role: "user" } },
    { ...reply, requestId: null },
    { ...reply, sessionRevision: -1 },
    { ...reply, inventoryProposal: undefined },
    { ...reply, metrics: { durationMs: -1, usage: null } },
    {
      ...reply,
      metrics: { durationMs: 0, usage: { inputTokens: 0.5, outputTokens: 1 } },
    },
    {
      ...reply,
      metrics: { durationMs: 0, usage: { inputTokens: 1, outputTokens: -1 } },
    },
    {
      ...reply,
      error: {
        code: "INTERNAL_ERROR",
        message: "Mixed envelope",
        retryable: false,
      },
    },
  ];
  for (const [index, value] of malformed.entries()) {
    assert.equal(
      c.ChatResponseSchema.safeParse(value).success,
      false,
      `response case ${index}`,
    );
  }
  assert.equal(
    c.ChatResponseSchema.safeParse({
      ...reply,
      metrics: { durationMs: 0, usage: { inputTokens: 0, outputTokens: 0 } },
    }).success,
    true,
  );
  const failure = {
    ok: false,
    requestId: null,
    sessionId: null,
    sessionRevision: null,
    error: {
      code: "PAYLOAD_TOO_LARGE",
      message: "Clear session or reduce the input.",
      retryable: false,
    },
    allergenNotice: c.ALLERGEN_NOTICE,
  };
  assert.equal(c.ChatResponseSchema.safeParse(failure).success, true);
  assert.equal(
    c.ChatResponseSchema.safeParse({ ...failure, allergenNotice: undefined })
      .success,
    false,
  );
  assert.equal(
    c.ChatResponseSchema.safeParse({ ...failure, message: reply.message })
      .success,
    false,
  );
});

test("inventory proposals require a complete confirmed replacement and bounded evidence", () => {
  const proposal = {
    kind: "replace_equipment",
    basedOnMessageId: randomUUID(),
    evidenceQuote: "x".repeat(c.CHAT_LIMITS.maxMessageCharacters),
    equipment: { status: "confirmed", cookware: [], heatSources: [] },
  };
  assert.deepEqual(c.InventoryProposalSchema.parse(proposal), proposal);
  assert.equal(
    c.ChatResponseSchema.safeParse({
      ...response(request()),
      inventoryProposal: proposal,
    }).success,
    true,
  );
  for (const changed of [
    { ...proposal, kind: "merge_equipment" },
    { ...proposal, basedOnMessageId: "not-a-uuid" },
    { ...proposal, evidenceQuote: " " },
    { ...proposal, evidenceQuote: `${proposal.evidenceQuote}x` },
    { ...proposal, equipment: { status: "unknown" } },
    { ...proposal, equipment: { status: "confirmed", cookware: ["pan"] } },
    { ...proposal, confirmed: true },
  ])
    assert.equal(c.InventoryProposalSchema.safeParse(changed).success, false);
});

test(
  "R1: duplicate UUIDs differing only in letter case must be rejected",
  {
    todo: "R1: shared IdSchema/uniqueness fix belongs to LEAD; see docs/REVIEW.md",
  },
  () => {
    const req = { ...request(), messages: history(3) };
    req.messages[0].id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    req.messages[2].id = req.messages[0].id.toUpperCase();
    assert.equal(c.ChatRequestSchema.safeParse(req).success, false);
  },
);
