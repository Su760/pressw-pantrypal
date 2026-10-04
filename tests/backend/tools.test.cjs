const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  createCookingTools,
  checkRecipe,
} = require("../../dist/backend-tests/src/lib/server/tools.js");
const {
  CHAT_LIMITS: limits,
  request,
  recipe,
  execute,
  deferred,
} = require("./fixtures.cjs");

beforeEach((t) => t.mock.method(console, "info", () => {}));
const cooking = (req = request(), signal = new AbortController().signal) =>
  createCookingTools(req, signal, "synthetic-test-key");

test("unknown, confirmed-empty, missing heat and matching equipment remain distinct", () => {
  for (const [equipment, status, cookware, heat] of [
    [{ status: "unknown" }, "unknown", [], []],
    [
      { status: "confirmed", cookware: [], heatSources: [] },
      "missing",
      ["pan"],
      ["hot plate"],
    ],
    [
      { status: "confirmed", cookware: ["pan"], heatSources: [] },
      "missing",
      [],
      ["hot plate"],
    ],
    [
      { status: "confirmed", cookware: ["pan"], heatSources: ["hot plate"] },
      "feasible",
      [],
      [],
    ],
  ]) {
    const result = checkRecipe(recipe(), request("Suggest dinner.", equipment));
    assert.equal(result.status, status);
    assert.deepEqual(result.missingCookware, cookware);
    assert.deepEqual(result.missingHeatSources, heat);
  }
});

test("detected omitted method equipment or heat prevents a feasibility claim", () => {
  for (const changed of [
    { ...recipe(), requiredCookware: [] },
    { ...recipe(), requiredHeatSources: [] },
    { ...recipe(), steps: ["Boil the beans."], requiredHeatSources: [] },
  ]) {
    const result = checkRecipe(changed, request());
    assert.equal(result.status, "unknown");
    assert.deepEqual(result.missingCookware, []);
    assert.deepEqual(result.missingHeatSources, []);
  }
});

test("parallel searches reserve the request-wide allowance before awaiting fetch", async (t) => {
  const gate = deferred();
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    await gate.promise;
    return Response.json({ results: [] });
  });
  const execution = cooking();
  const count = limits.maxSearchCalls + 4;
  const pending = Array.from({ length: count }, () =>
    execute(execution.tools.searchRecipes, { query: "beans recipe" }),
  );
  try {
    assert.equal(fetch.mock.callCount(), limits.maxSearchCalls);
    assert.equal(execution.counts.search, limits.maxSearchCalls);
  } finally {
    gate.resolve();
  }
  const results = await Promise.all(pending);
  assert.equal(
    results.filter((result) => result.error === "budget_exhausted").length,
    count - limits.maxSearchCalls,
  );
  assert.equal(
    (await execute(execution.tools.searchRecipes, { query: "another recipe" }))
      .error,
    "budget_exhausted",
  );
  assert.equal(fetch.mock.callCount(), limits.maxSearchCalls);
});

test("parallel search and equipment executions share one total budget; new requests get a fresh budget", async (t) => {
  const gate = deferred();
  t.mock.method(globalThis, "fetch", async () => {
    await gate.promise;
    return Response.json({ results: [] });
  });
  const execution = cooking();
  const searches = Array.from({ length: limits.maxSearchCalls }, () =>
    execute(execution.tools.searchRecipes, { query: "beans" }),
  );
  const checks = Array.from({ length: limits.maxToolCalls + 1 }, () =>
    execute(execution.tools.checkEquipment, recipe()),
  );
  gate.resolve();
  const results = await Promise.all([...searches, ...checks]);
  assert.equal(
    results.filter((result) => result.ok).length,
    limits.maxToolCalls,
  );
  assert.equal(execution.counts.total, limits.maxToolCalls);
  assert.equal(
    execution.recipes.size,
    limits.maxToolCalls - limits.maxSearchCalls,
  );
  assert.equal(
    (await execute(execution.tools.checkEquipment, recipe())).error,
    "budget_exhausted",
  );
  const fresh = cooking();
  assert.equal((await execute(fresh.tools.checkEquipment, recipe())).ok, true);
  assert.equal(fresh.counts.total, 1);
});

test("sources come only from actual successful mocked search results and obey filtering/bounds", async (t) => {
  const hits = [
    {
      title: "Beans",
      url: "https://example.com/beans",
      content: "x".repeat(limits.maxSearchSnippetCharacters + 5),
    },
    { title: "Duplicate", url: "https://example.com/beans" },
    { title: "Script", url: "javascript:alert(1)" },
    { title: "Credentials", url: "https://user:secret@example.com/recipe" },
    { title: "Rice", url: "https://example.com/rice" },
    { title: "Outside result limit", url: "https://example.com/ignored" },
  ];
  const fetch = t.mock.method(globalThis, "fetch", async (_url, init) => {
    assert.equal(JSON.parse(init.body).max_results, limits.maxSearchResults);
    assert.equal(init.signal.aborted, false);
    return Response.json({ results: hits });
  });
  const execution = cooking();
  assert.equal(execution.sources.size, 0);
  await execute(execution.tools.checkEquipment, recipe());
  assert.equal(execution.sources.size, 0);
  const result = await execute(execution.tools.searchRecipes, {
    query: "beans recipe",
  });
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(result.ok, true);
  assert.equal(
    result.results[0].excerpt.length,
    limits.maxSearchSnippetCharacters,
  );
  assert.deepEqual(
    [...execution.sources.keys()],
    ["https://example.com/beans", "https://example.com/rice"],
  );
  assert.deepEqual(execution.searchOutcomes, ["success"]);
});

for (const [name, response, expected] of [
  ["rate limit", () => new Response("", { status: 429 }), "rate_limited"],
  ["HTTP failure", () => new Response("", { status: 503 }), "upstream_error"],
  ["malformed JSON", () => new Response("{"), "failed_or_timed_out"],
  [
    "wrong shape",
    () => Response.json({ answer: "invented" }),
    "failed_or_timed_out",
  ],
  [
    "oversized response",
    () => new Response("x".repeat(limits.maxSearchResponseBytes + 1)),
    "failed_or_timed_out",
  ],
  [
    "network failure",
    () => {
      throw new Error("synthetic unavailable");
    },
    "failed_or_timed_out",
  ],
  ["empty results", () => Response.json({ results: [] }), "empty"],
])
  test(`search handles ${name} without invented sources`, async (t) => {
    t.mock.method(globalThis, "fetch", response);
    const execution = cooking();
    const result = await execute(execution.tools.searchRecipes, {
      query: "beans",
    });
    assert.equal(result.ok, expected === "empty");
    assert.deepEqual(result.results, []);
    assert.deepEqual(execution.searchOutcomes, [expected]);
    assert.equal(execution.sources.size, 0);
    assert.equal(
      execution.counts.search,
      1,
      "failed calls also consume budget",
    );
  });

test("cancellation reaches pending search fetch and prevents subsequent tool work", async (t) => {
  const controller = new AbortController();
  const started = deferred();
  let fetchSignal;
  t.mock.method(globalThis, "fetch", (_url, { signal }) => {
    fetchSignal = signal;
    started.resolve();
    return new Promise((_resolve, reject) =>
      signal.addEventListener("abort", () => reject(signal.reason), {
        once: true,
      }),
    );
  });
  const execution = cooking(request(), controller.signal);
  const reason = new Error("synthetic cancellation");
  const pending = execute(
    execution.tools.searchRecipes,
    { query: "beans" },
    controller.signal,
  );
  const rejected = assert.rejects(pending, (error) => error === reason);
  await started.promise;
  controller.abort(reason);
  await rejected;
  assert.equal(fetchSignal.aborted, true);
  assert.equal(execution.sources.size, 0);
  await assert.rejects(
    execute(execution.tools.checkEquipment, recipe()),
    (error) => error === reason,
  );
  assert.equal(execution.counts.total, 1);
});

test("explicit excluded ingredient cannot create a stored checked candidate", async () => {
  const req = request();
  req.profile.ingredientExclusions = ["beans"];
  const execution = cooking(req);
  const result = await execute(execution.tools.checkEquipment, recipe());
  assert.equal(result.error, "explicit_ingredient_excluded");
  assert.equal(execution.recipes.size, 0);
  assert.equal(execution.sources.size, 0);
});
