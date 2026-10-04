const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const {
  boundaryReply,
  MINOR_NOTICE,
  inventoryConflict,
  validProposal,
} = require("../../dist/backend-tests/src/lib/server/policy.js");
const {
  checkRecipe,
} = require("../../dist/backend-tests/src/lib/server/tools.js");
const { request, message, recipe, proposal } = require("./fixtures.cjs");

for (const [text, expected] of [
  ["I'm 10 minutes from home", null],
  ["I'm 12", MINOR_NOTICE],
  ["I'm 12 years old", MINOR_NOTICE],
  ["I'm 18 years old", null],
])
  test(`age boundary: ${text}`, () =>
    assert.equal(boundaryReply(request(text)), expected));

test("a user minor disclosure survives follow-up; assistant text is not an age disclosure", () => {
  const req = request("I'm 12");
  req.messages.push(
    message("Adults only.", "assistant"),
    message("What can I cook?"),
  );
  assert.equal(boundaryReply(req), MINOR_NOTICE);
  req.messages = [
    message("Hi"),
    message("I'm 12", "assistant"),
    message("What can I cook?"),
  ];
  assert.equal(boundaryReply(req), null);
});

for (const [text, conflict] of [
  ["I only have eggs and rice", false],
  ["I don't have garlic", false],
  ["Actually, make it spicy.", false],
  ["I only have a microwave", true],
  ["my pan broke", true],
])
  test(`inventory correction: ${text}`, () => {
    const req = request(text);
    assert.equal(inventoryConflict(req), conflict);
    assert.equal(
      checkRecipe(recipe(), req).status,
      conflict ? "unknown" : "feasible",
    );
  });

test("proposal must quote the latest user message and support every proposed item", () => {
  const req = request("I have a pan and a hot plate.");
  const valid = proposal(req);
  assert.equal(validProposal(valid, req), true);
  assert.equal(
    validProposal({ ...valid, basedOnMessageId: randomUUID() }, req),
    false,
  );
  assert.equal(
    validProposal({ ...valid, evidenceQuote: "I have an oven." }, req),
    false,
  );
  assert.equal(
    validProposal(
      { ...valid, equipment: { ...valid.equipment, cookware: ["oven"] } },
      req,
    ),
    false,
  );
  const assistant = message(req.messages[0].content, "assistant");
  req.messages.push(assistant, message("Please suggest dinner."));
  assert.equal(
    validProposal(valid, req),
    false,
    "old user turn must not replace current inventory",
  );
  assert.equal(
    validProposal({ ...valid, basedOnMessageId: assistant.id }, req),
    false,
  );
});

for (const text of [
  "I don't have a pan. I have a hot plate.",
  "I have no pan but I have a hot plate.",
  "I have a pan but no hot plate.",
  "If I have a pan and a hot plate, could I cook this?",
])
  test(`proposal rejects negated/conditional ownership: ${text}`, () => {
    const req = request(text);
    assert.equal(validProposal(proposal(req), req), false);
  });

for (const text of [
  "It is not true that I have a pan and a hot plate.",
  "If I have a pan and a hot plate, I could try that recipe.",
])
  test(`proposal cannot cherry-pick affirmative evidence from: ${text}`, () => {
    const req = request(text);
    assert.equal(
      validProposal(proposal(req, "I have a pan and a hot plate"), req),
      false,
    );
  });

test("proposal cannot infer an unspecified empty equipment category", () => {
  const req = request("I have a pan.");
  assert.equal(
    validProposal(
      {
        ...proposal(req),
        equipment: { status: "confirmed", cookware: ["pan"], heatSources: [] },
      },
      req,
    ),
    false,
  );
});

test("proposal rejects a condition following the selected ownership excerpt", () => {
  const req = request("I have a pan and a hot plate if I borrow them.");
  assert.equal(
    validProposal(proposal(req, "I have a pan and a hot plate"), req),
    false,
  );
});

test("proposal rejects repeated evidence with ambiguous ownership context", () => {
  const quote = "I have a pan and a hot plate";
  const req = request(`${quote}. It is not true that ${quote}.`);
  assert.equal(validProposal(proposal(req, quote), req), false);
});

test("explicit affirmative ownership remains valid beside unrelated negative or conditional sentences", () => {
  const req = request(
    "I don't have garlic. I have a pan and a hot plate. Could you suggest dinner?",
  );
  for (const quote of [
    "I have a pan and a hot plate",
    "I have a pan and a hot plate.",
  ]) {
    assert.equal(validProposal(proposal(req, quote), req), true);
  }
});

test("complete replacement proposals preserve explicitly empty equipment categories", () => {
  for (const [text, cookware] of [
    ["I have no cookware and no heat sources.", []],
    ["I have a pan and no heat sources.", ["pan"]],
  ]) {
    const req = request(text);
    const replacement = {
      ...proposal(req),
      equipment: { status: "confirmed", cookware, heatSources: [] },
    };
    assert.equal(validProposal(replacement, req), true);
    assert.deepEqual(replacement.equipment.heatSources, []);
  }
});
