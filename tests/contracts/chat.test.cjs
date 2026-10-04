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
  for (const url of ['javascript:alert(1)', 'file:///tmp/recipe', 'https://name:password@example.com']) {
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
