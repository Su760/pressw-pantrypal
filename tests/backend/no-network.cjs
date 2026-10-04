// Preloaded in every native Node test process. Individual tests mock fetch explicitly.
globalThis.fetch = async () => {
  throw new Error("Backend regressions prohibit unmocked network requests.");
};
