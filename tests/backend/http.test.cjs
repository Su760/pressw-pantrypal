const test = require("node:test");
const assert = require("node:assert/strict");
const { POST } = require("../../dist/backend-tests/src/app/api/chat/route.js");
const {
  readBoundedJson,
  withAbort,
} = require("../../dist/backend-tests/src/lib/server/http.js");
const {
  ChatError,
} = require("../../dist/backend-tests/src/lib/server/errors.js");
const {
  request,
  CHAT_LIMITS: limits,
  ChatResponseSchema,
  ALLERGEN_NOTICE,
} = require("./fixtures.cjs");

const signal = () => new AbortController().signal;
const body = (text) => new Response(text).body;
const httpRequest = (payload, options = {}) =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    ...options,
  });
const stalled = (cancel = () => {}) => new ReadableStream({ cancel });
async function failure(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = ChatResponseSchema.parse(await response.json());
  assert.equal(data.ok, false);
  assert.equal(data.error.code, code);
  assert.equal(data.allergenNotice, ALLERGEN_NOTICE);
  return data;
}

test("body limit measures UTF-8 bytes and accepts the exact boundary across chunks", async () => {
  const text = JSON.stringify({ ingredient: "🍳" });
  const bytes = new TextEncoder().encode(text);
  const chunks = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, bytes.length - 3));
      controller.enqueue(bytes.slice(bytes.length - 3));
      controller.close();
    },
  });
  assert.deepEqual(
    await readBoundedJson(chunks, bytes.length, signal()),
    JSON.parse(text),
  );
  await assert.rejects(
    readBoundedJson(body(text), bytes.length - 1, signal()),
    { code: "PAYLOAD_TOO_LARGE" },
  );
});

test("malformed JSON, invalid UTF-8 and missing body are controlled invalid requests", async () => {
  for (const stream of [body("{"), body(new Uint8Array([0xff])), null]) {
    await assert.rejects(
      readBoundedJson(stream, limits.maxRequestBytes, signal()),
      { code: "INVALID_REQUEST" },
    );
  }
});

test("overflow cancels the stream and releases the reader without reading the remaining body", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(limits.maxRequestBytes + 1));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    readBoundedJson(stream, limits.maxRequestBytes, signal()),
    { code: "PAYLOAD_TOO_LARGE" },
  );
  assert.equal(cancelled, true);
  assert.equal(stream.locked, false);
});

test("aborting a stalled body cancels the reader and preserves the cancellation reason", async () => {
  const controller = new AbortController();
  let cancelled = false;
  const stream = stalled(() => {
    cancelled = true;
  });
  const pending = readBoundedJson(
    stream,
    limits.maxRequestBytes,
    controller.signal,
  );
  const reason = new ChatError("CANCELLED");
  const rejected = assert.rejects(pending, (error) => error === reason);
  controller.abort(reason);
  await rejected;
  assert.equal(cancelled, true);
  assert.equal(stream.locked, false);
});

test("withAbort releases a caller even when underlying work never settles", async () => {
  const controller = new AbortController();
  const reason = new ChatError("TIMEOUT");
  const pending = withAbort(new Promise(() => {}), controller.signal);
  const rejected = assert.rejects(pending, (error) => error === reason);
  controller.abort(reason);
  await rejected;
  assert.equal(await withAbort(Promise.resolve("ready"), signal()), "ready");
});

test("HTTP rejects oversized actual bytes with absent or false Content-Length", async () => {
  for (const headers of [
    { "Content-Type": "application/json" },
    { "Content-Type": "application/json", "Content-Length": "1" },
  ]) {
    const response = await POST(
      httpRequest("x".repeat(limits.maxRequestBytes + 1), { headers }),
    );
    const data = await failure(response, 413, "PAYLOAD_TOO_LARGE");
    assert.equal(data.requestId, null);
    assert.match(data.error.message, /shorten|clear/i);
  }
});

test("HTTP malformed JSON and invalid schema fail before generation; missing config retains validated correlation", async () => {
  for (const text of ["{", "{}"]) {
    const data = await failure(
      await POST(httpRequest(text)),
      400,
      "INVALID_REQUEST",
    );
    assert.equal(data.requestId, null);
    assert.equal(data.sessionId, null);
    assert.equal(data.sessionRevision, null);
  }
  const req = request();
  const data = await failure(
    await POST(httpRequest(JSON.stringify(req))),
    503,
    "CONFIGURATION_ERROR",
  );
  assert.equal(data.requestId, req.requestId);
  assert.equal(data.sessionId, req.sessionId);
  assert.equal(data.sessionRevision, req.sessionRevision);
});

test("HTTP cancellation during body reading returns 499 and releases admission slots", async () => {
  const controllers = Array.from(
    { length: limits.maxConcurrentRequests },
    () => new AbortController(),
  );
  const pending = controllers.map((controller) =>
    POST(httpRequest(stalled(), { duplex: "half", signal: controller.signal })),
  );
  try {
    await failure(await POST(httpRequest("{}")), 429, "RATE_LIMITED");
  } finally {
    controllers.forEach((controller) => controller.abort());
  }
  for (const response of await Promise.all(pending))
    await failure(response, 499, "CANCELLED");
  await failure(await POST(httpRequest("{}")), 400, "INVALID_REQUEST");
});

test("request-wide deadline covers a stalled body before generation", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pending = POST(httpRequest(stalled(), { duplex: "half" }));
  t.mock.timers.tick(limits.requestTimeoutMs);
  await failure(await pending, 504, "TIMEOUT");
  await failure(await POST(httpRequest("{}")), 400, "INVALID_REQUEST");
});
