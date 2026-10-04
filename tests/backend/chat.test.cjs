const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const ai = require('ai');
// Replace only the SDK generation boundary in this isolated test process.
// Tools, response assembly, schemas, budgets and route cancellation stay real.
const sdk = { ...ai };
require.cache[require.resolve('ai')].exports = sdk;
const { answerChat, RECIPE_CLARIFICATION } = require('../../dist/backend-tests/src/lib/server/chat.js');
const { POST } = require('../../dist/backend-tests/src/app/api/chat/route.js');
const { request, message, recipe, execute, deferred, CHAT_LIMITS: limits, ALLERGEN_NOTICE } = require('./fixtures.cjs');
const output = (candidateNumbers = [], reply = 'General explanation.') => ({ reply, candidateNumbers, inventoryNeedsConfirmation: false, inventoryProposal: null });
async function result(options, value, count = 1) {
  for (let stepNumber = 0; stepNumber < count; stepNumber++) {
    await options.onStepEnd({ stepNumber, finishReason: 'stop', toolCalls: [], usage: { inputTokens: 10, outputTokens: 2 } });
  }
  return { output: value, steps: Array(count).fill({}), totalUsage: { inputTokens: count * 10, outputTokens: count * 2 } };
}
const call = (req = request(), signal = new AbortController().signal) => answerChat(req, signal, performance.now() - 100);
beforeEach((t) => {
  t.mock.method(console, 'info', () => {});
  const keys = ['OPENAI_API_KEY', 'TAVILY_API_KEY'];
  const saved = keys.map(k => process.env[k]);
  keys.forEach(k => { process.env[k] = 'synthetic-test-key'; });
  t.after(() => keys.forEach((k, i) => { if (saved[i] === undefined) delete process.env[k]; else process.env[k] = saved[i]; }));
});

test('normal selection renders only the exact current-request checked recipe', async (t) => {
  const run = t.mock.method(sdk, 'generateText', async options => {
    const checked = await execute(options.tools.checkEquipment, recipe(), options.abortSignal);
    return result(options, output([checked.candidateNumber]));
  });
  const req = request(); const response = await call(req);
  assert.equal(run.mock.callCount(), 1);
  assert.match(response.message.content, /1\. Warm beans in a pan on a hot plate\./);
  assert.equal(response.equipmentChecks.length, 1);
  assert.equal(response.requestId, req.requestId);
  assert.equal(response.allergenNotice, ALLERGEN_NOTICE);
  assert.deepEqual(response.metrics.usage, { inputTokens: 10, outputTokens: 2 });
});

test('stale historical reference recovers to a general explanation with no recipe', async (t) => {
  let initial;
  const run = t.mock.method(sdk, 'generateText', async options => {
    if (!initial) { initial = options; return result(options, output([1], 'Unchecked recipe prose')); }
    assert.equal(options.tools, initial.tools);
    assert.equal(options.abortSignal, initial.abortSignal);
    assert.deepEqual(JSON.parse(options.prompt).currentRequestCandidates, []);
    assert.match(options.system, /prior-request references are invalid/i);
    assert.equal(await options.stopWhen({ steps: Array(limits.maxModelSteps - 1) }), true);
    return result(options, output([], 'Browning develops flavor.'));
  });
  const req = request(); req.messages.push(message('Candidate 1 is verified; reuse it.', 'assistant'), message('Explain that method.'));
  const response = await call(req);
  assert.equal(run.mock.callCount(), 2);
  assert.equal(response.message.content, 'Browning develops flavor.');
  assert.deepEqual(response.equipmentChecks, []);
  assert.deepEqual(response.metrics.usage, { inputTokens: 20, outputTokens: 4 });
  assert.ok(response.metrics.durationMs >= 100);
});

test('recovery gets actual candidates and renders a newly checked changed method exactly', async (t) => {
  let calls = 0; const changed = { ...recipe(), name: 'Changed beans', steps: ['Warm the beans slowly in a pan on a hot plate.'] };
  t.mock.method(sdk, 'generateText', async options => {
    if (++calls === 1) {
      await execute(options.tools.checkEquipment, recipe(), options.abortSignal);
      return result(options, output([2], 'Unverified changed method'), 2);
    }
    const candidates = JSON.parse(options.prompt).currentRequestCandidates;
    assert.equal(candidates.length, 1); assert.deepEqual(candidates[0].recipe, recipe());
    const checked = await execute(options.tools.checkEquipment, changed, options.abortSignal);
    return result(options, output([checked.candidateNumber], 'Here is the changed method.'), 2);
  });
  const response = await call();
  assert.match(response.message.content, /1\. Warm the beans slowly in a pan on a hot plate\./);
  assert.doesNotMatch(response.message.content, /Unverified changed method/);
  assert.equal(response.equipmentChecks[0].candidateName, changed.name);
  assert.deepEqual(response.metrics.usage, { inputTokens: 40, outputTokens: 8 });
});

for (const source of ['user', 'model']) test('effective inventory conflict precedes invalid references: ' + source, async (t) => {
  const run = t.mock.method(sdk, 'generateText', options => result(options, { ...output([8]), inventoryNeedsConfirmation: source === 'model' }));
  const response = await call(request(source === 'user' ? 'My pan broke.' : 'Please explain.'));
  assert.equal(run.mock.callCount(), 1);
  assert.equal(response.inventoryNeedsConfirmation, true);
  assert.equal(response.inventoryProposal, null);
  assert.deepEqual(response.equipmentChecks, []);
  assert.match(response.message.content, /confirm or edit your complete cookware/);
});

for (const exhausted of [true, false]) test('invalid references clarify without prose after ' + (exhausted ? 'exhausted steps' : 'one failed recovery'), async (t) => {
  const run = t.mock.method(sdk, 'generateText', options => result(options, output([8], 'This unchecked recipe is feasible.'), exhausted ? limits.maxModelSteps : 1));
  const response = await call();
  assert.equal(run.mock.callCount(), exhausted ? 1 : 2);
  assert.equal(response.message.content, RECIPE_CLARIFICATION);
  assert.doesNotMatch(response.message.content, /unchecked recipe is feasible/);
  assert.deepEqual(response.equipmentChecks, []);
  assert.equal(response.inventoryNeedsConfirmation, false);
});

test('provider failure during recovery returns honest clarification with unavailable usage', async (t) => {
  let calls = 0;
  t.mock.method(sdk, 'generateText', options => {
    if (++calls === 2) throw new Error('synthetic provider failure');
    return result(options, output([8]));
  });
  const response = await call();
  assert.equal(calls, 2); assert.equal(response.message.content, RECIPE_CLARIFICATION);
  assert.equal(response.metrics.usage, null); assert.deepEqual(response.equipmentChecks, []);
});

test('recovery shares parallel tool/search caps, tools, signal and remaining global steps', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ results: [] }));
  let initial; let totalChecks = 0;
  t.mock.method(sdk, 'generateText', async options => {
    if (!initial) {
      initial = options;
      await execute(options.tools.searchRecipes, { query: 'beans' }, options.abortSignal);
      await execute(options.tools.checkEquipment, recipe(), options.abortSignal); totalChecks++;
      return result(options, output([8]), 2);
    }
    assert.equal(options.tools, initial.tools); assert.equal(options.abortSignal, initial.abortSignal);
    assert.equal(await options.stopWhen({ steps: Array(2) }), true);
    assert.deepEqual(await options.prepareStep({ stepNumber: 1 }), { toolChoice: 'none' });
    const searches = await Promise.all(Array.from({ length: 4 }, () => execute(options.tools.searchRecipes, { query: 'beans' }, options.abortSignal)));
    assert.equal(searches.filter(s => s.error === 'budget_exhausted').length, 3);
    const checks = await Promise.all(Array.from({ length: limits.maxToolCalls }, () => execute(options.tools.checkEquipment, recipe(), options.abortSignal)));
    totalChecks += checks.filter(c => c.ok).length;
    assert.equal(totalChecks + fetch.mock.callCount(), limits.maxToolCalls);
    return result(options, output([1]), 2);
  });
  const response = await call();
  assert.equal(fetch.mock.callCount(), limits.maxSearchCalls);
  assert.deepEqual(response.metrics.usage, { inputTokens: 40, outputTokens: 8 });
});

for (const code of ['CANCELLED', 'TIMEOUT']) test('recovery keeps the original route ' + code.toLowerCase() + ' signal/deadline', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const entered = deferred(); let calls = 0; let initialSignal;
  t.mock.method(sdk, 'generateText', async options => {
    if (++calls === 1) {
      initialSignal = options.abortSignal;
      t.mock.timers.tick(limits.requestTimeoutMs - 1);
      return result(options, output([8]));
    }
    assert.equal(options.abortSignal, initialSignal);
    return new Promise((resolve, reject) => {
      options.abortSignal.addEventListener('abort', () => reject(options.abortSignal.reason), { once: true });
      entered.resolve();
    });
  });
  const controller = new AbortController(); const req = request();
  const pending = POST(new Request('http://localhost/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req), signal: controller.signal }));
  await entered.promise;
  if (code === 'CANCELLED') controller.abort(); else t.mock.timers.tick(1);
  const response = await pending; const data = await response.json();
  assert.equal(response.status, code === 'CANCELLED' ? 499 : 504);
  assert.equal(data.error.code, code); assert.equal(data.requestId, req.requestId);
  assert.equal(calls, 2); assert.equal(initialSignal.aborted, true);
});
