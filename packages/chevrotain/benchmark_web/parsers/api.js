// ----------------- wrapping it all together -----------------
var parserInstance;
var lexerInstance;
var lexResult;
var parserBenchmark;
var parserBenchmarkErrorCount = 0;
var parserBenchmarkErrorTrackingEnabled = false;

function ensureLexer(lexerDefinition, customLexer) {
  if (lexerInstance === undefined) {
    if (customLexer !== undefined) {
      lexerInstance = customLexer;
    } else {
      var start = new Date().getTime();
      lexerInstance = new chevrotain.Lexer(lexerDefinition, {
        // TODO: extract lexer options to global config
        positionTracking: "onlyOffset",
      });
      var end = new Date().getTime();
      console.log("Lexer init time: " + (end - start));
    }
  }
}

function ensureParser(parser, parserConfig) {
  if (parserInstance === undefined) {
    var start = new Date().getTime();
    parserInstance = new parser(parserConfig);
    var end = new Date().getTime();
    console.log("Parser init time: " + (end - start));
  }
}

function checksumString(value) {
  var hash = 2166136261;
  for (var i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function checksumTokens(tokens) {
  var parts = new Array(tokens.length);
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    parts[i] = [
      token.tokenType && token.tokenType.name,
      token.image,
      token.startOffset,
      token.endOffset,
    ].join("|");
  }
  return checksumString(parts.join("\n"));
}

function setOriginalText(text) {
  if ("orgText" in parserInstance) {
    parserInstance.orgText = text;
  }
}

function validateParse(text, tokens, rootRule, expectErrors) {
  setOriginalText(text);
  parserInstance.input = tokens;
  parserInstance[rootRule]();
  var errors = parserInstance.errors;
  if (expectErrors ? errors.length === 0 : errors.length > 0) {
    throw Error(
      expectErrors
        ? "Expected parser validation errors"
        : "Parsing errors detected during benchmark setup",
    );
  }
  if (!expectErrors && !parserInstance.isAtEndOfInput()) {
    throw Error("Parser validation did not consume the complete token vector");
  }
}

function validateEcmaLineTerminators(rootRule) {
  var validText = "function f(){return\n1;}";
  var invalidText = "function f(){throw\n1;}";
  var validTokens = lexerInstance.tokenize(validText);
  var invalidTokens = lexerInstance.tokenize(invalidText);

  if (validTokens.errors.length > 0 || invalidTokens.errors.length > 0) {
    throw Error("ECMA5 line terminator validation failed during lexing");
  }

  validateParse(validText, validTokens.tokens, rootRule, false);
  validateParse(invalidText, invalidTokens.tokens, rootRule, true);
}

self.setupParserBench = function (
  text,
  lexerDefinition,
  customLexer,
  parser,
  rootRule,
  parserConfig,
  benchmarkConfig,
) {
  ensureLexer(lexerDefinition, customLexer);
  ensureParser(parser, parserConfig);

  if (!parserBenchmarkErrorTrackingEnabled) {
    var originalSaveError = parserInstance.SAVE_ERROR;
    Object.defineProperty(Object.getPrototypeOf(parserInstance), "SAVE_ERROR", {
      configurable: true,
      writable: true,
      value: function (error) {
        parserBenchmarkErrorCount++;
        return originalSaveError.call(this, error);
      },
    });
    parserBenchmarkErrorTrackingEnabled = true;
  }

  lexResult = lexerInstance.tokenize(text);
  if (lexResult.errors.length > 0) {
    throw Error("Lexing errors detected during benchmark setup");
  }

  var tokenCount = lexResult.tokens.length;
  var tokenChecksum = checksumTokens(lexResult.tokens);
  if (benchmarkConfig.validateEcmaLineTerminators) {
    validateEcmaLineTerminators(rootRule);
  }
  validateParse(text, lexResult.tokens, rootRule, false);
  if (
    lexResult.tokens.length !== tokenCount ||
    checksumTokens(lexResult.tokens) !== tokenChecksum
  ) {
    throw Error("Token vector changed during parser benchmark setup");
  }
  parserBenchmark = {
    tokens: lexResult.tokens,
    rootRule: rootRule,
    tokenCount: tokenCount,
    tokenChecksum: tokenChecksum,
    errorCount: parserBenchmarkErrorCount,
  };

  return {
    grammarId: benchmarkConfig.grammarId,
    sampleId: benchmarkConfig.sampleId,
    sourceScripts: benchmarkConfig.importScripts.slice(),
    inputBytes: new TextEncoder().encode(text).length,
    inputChecksum: checksumString(text),
    tokenCount: parserBenchmark.tokenCount,
    tokenChecksum: tokenChecksum,
    parserConfig: { ...parserConfig },
    chevrotainVersion: chevrotain.VERSION,
    userAgent: navigator.userAgent,
  };
};

self.runParserBatch = function (iterations) {
  if (parserBenchmark === undefined) {
    throw Error("Parser benchmark setup has not completed");
  }
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw Error("Batch iterations must be a positive integer");
  }

  var tokens = parserBenchmark.tokens;
  if (
    tokens.length !== parserBenchmark.tokenCount ||
    checksumTokens(tokens) !== parserBenchmark.tokenChecksum
  ) {
    throw Error("Token vector changed before parser batch");
  }

  var completedIterations = 0;
  var start = performance.now();
  for (var i = 0; i < iterations; i++) {
    parserInstance.input = tokens;
    parserInstance[parserBenchmark.rootRule]();
    completedIterations++;
  }
  var elapsedMs = performance.now() - start;

  if (parserBenchmarkErrorCount !== parserBenchmark.errorCount) {
    throw Error("Parsing errors detected during one or more batch iterations");
  }
  if (parserInstance.errors.length > 0) {
    throw Error("Parsing errors detected during parser batch");
  }
  if (!parserInstance.isAtEndOfInput()) {
    throw Error("Parser batch did not consume the complete token vector");
  }
  if (
    tokens.length !== parserBenchmark.tokenCount ||
    checksumTokens(tokens) !== parserBenchmark.tokenChecksum
  ) {
    throw Error("Token vector changed during parser batch");
  }

  return {
    elapsedMs: elapsedMs,
    completedIterations: completedIterations,
  };
};

self.parseBench = function (
  text,
  lexerDefinition,
  customLexer,
  parser,
  rootRule,
  options,
  parserConfig,
) {
  ensureLexer(lexerDefinition, customLexer);

  if (lexResult === undefined || options.lexerOnly) {
    lexResult = lexerInstance.tokenize(text);
    if (lexResult.errors.length > 0) {
      throw Error("Lexing errors detected");
    }
  }

  // It is recommended to only initialize a Chevrotain Parser once
  // and reset it's state instead of re-initializing it
  ensureParser(parser, parserConfig);

  if (options.lexerOnly) {
    return lexResult.tokens;
  } else {
    // setting a new input will RESET the parser instance's state.
    parserInstance.input = lexResult.tokens;
    var lexErrors = lexResult.errors;

    // only performing the lexing ONCE if we are only interested in the parsing speed
    if (!options.parserOnly) {
      lexResult = undefined;
    }

    // any top level rule may be used as an entry point
    var value = parserInstance[rootRule]();

    if (parserInstance.errors.length > 0) {
      throw Error("Parsing Errors detected");
    }
    return {
      value: value, // this is a pure grammar, the value will always be <undefined>
      lexErrors: lexErrors,
      parseErrors: parserInstance.errors,
    };
  }
};

// ----------------- initialization benchmarking -----------------
// Unlike parseBench which reuses singleton instances, initBench creates
// NEW Lexer/Parser instances on every call to measure construction time.
self.initBench = function (
  lexerDefinition,
  customLexer,
  parser,
  parserConfig,
  options,
) {
  if (options.initLexer) {
    if (customLexer !== undefined) {
      // Custom lexers (e.g., ECMA5/Acorn) are external to Chevrotain
      // and cannot be meaningfully re-created.
    } else {
      new chevrotain.Lexer(lexerDefinition, {
        positionTracking: "onlyOffset",
      });
    }
  }

  if (options.initParser) {
    new parser(parserConfig);
  }
};
