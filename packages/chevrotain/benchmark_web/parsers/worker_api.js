var parserWorker;
var globalDeferred;

function initWorker(options) {
  // relative to the nested iframe
  parserWorker = new Worker("../worker_impel.js", { type: "module" });

  parserWorker.postMessage(options);
  parserWorker.onmessage = function (event) {
    if (event.data && event.data.type === "init") {
      // Capture the Chevrotain version reported by the worker after initialization.
      self.chevrotainVersion = event.data.version;
    } else {
      globalDeferred.resolve();
    }
  };
}

function parse(options, deferred) {
  globalDeferred = deferred;
  parserWorker.postMessage([options]);
}
