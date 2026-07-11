self.initialized = false;

function postSuccess(requestId, result) {
  postMessage({ type: "response", requestId, ok: true, result });
}

function postFailure(requestId, phase, error) {
  postMessage({
    type: "response",
    requestId,
    ok: false,
    error: {
      phase,
      name: error && error.name ? error.name : "Error",
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : undefined,
    },
  });
}

onmessage = async function (event) {
  var request = event.data;
  var requestId = request.requestId;

  try {
    if (request.type === "init") {
      var config = request.config;
      self.parserConfig = config.parserConfig;
      self.benchmarkConfig = config;

      for (const elem of config.importScripts) {
        await import(elem);
      }

      if (config.sampleUrl) {
        var response = await fetch(config.sampleUrl);
        if (!response.ok) {
          throw Error(`Unable to load sample: ${response.status}`);
        }
        self.sample = await response.text();
      }
      self.startRule = config.startRule;
      self.initialized = true;
      postSuccess(requestId, { version: self.chevrotain.VERSION });
      return;
    }

    if (!self.initialized) {
      throw Error("Worker has not been initialized");
    }

    if (request.type === "setup") {
      postSuccess(
        requestId,
        self.setupParserBench(
          self.sample,
          self.lexerDefinition || undefined,
          self.customLexer || undefined,
          self.parser,
          self.startRule,
          self.parserConfig,
          self.benchmarkConfig,
        ),
      );
    } else if (request.type === "batch") {
      postSuccess(requestId, self.runParserBatch(request.iterations));
    } else if (request.type === "legacyRun") {
      var options = request.options;
      if (options.initLexer || options.initParser) {
        self.initBench(
          self.lexerDefinition || undefined,
          self.customLexer || undefined,
          self.parser,
          self.parserConfig,
          options,
        );
      } else {
        self.parseBench(
          self.sample,
          self.lexerDefinition || undefined,
          self.customLexer || undefined,
          self.parser,
          self.startRule,
          options,
          self.parserConfig,
        );
      }
      postSuccess(requestId, null);
    } else {
      throw Error(`Unknown worker request type: ${request.type}`);
    }
  } catch (error) {
    console.error(error);
    postFailure(requestId, request.type, error);
  }
};
