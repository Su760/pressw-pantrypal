const { randomUUID } = require("node:crypto");
const contracts = require("../../dist/backend-tests/src/lib/contracts/chat.js");

const confirmed = () => ({
  status: "confirmed",
  cookware: ["pan"],
  heatSources: ["hot plate"],
});
const message = (content, role = "user") => ({
  id: randomUUID(),
  role,
  content,
});
const request = (
  content = "Suggest a bean dinner.",
  equipment = confirmed(),
) => ({
  requestId: randomUUID(),
  sessionId: randomUUID(),
  sessionRevision: 0,
  adultAcknowledged: true,
  profile: { equipment, preferences: [], ingredientExclusions: [] },
  messages: [message(content)],
});
const recipe = () => ({
  name: "Beans",
  ingredients: ["beans"],
  steps: ["Warm beans in a pan on a hot plate."],
  requiredCookware: ["pan"],
  requiredHeatSources: ["hot plate"],
});
const proposal = (req, quote = req.messages.at(-1).content) => ({
  kind: "replace_equipment",
  basedOnMessageId: req.messages.at(-1).id,
  evidenceQuote: quote,
  equipment: confirmed(),
});
const execute = (tool, input, signal = new AbortController().signal) =>
  tool.execute(input, {
    toolCallId: randomUUID(),
    messages: [],
    abortSignal: signal,
  });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
module.exports = {
  ...contracts,
  confirmed,
  message,
  request,
  recipe,
  proposal,
  execute,
  deferred,
};
