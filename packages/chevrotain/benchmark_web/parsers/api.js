// ----------------- wrapping it all together -----------------
var parserInstance;
var lexerInstance;
var lexResult;

self.parseBench = function (
  text,
  lexerDefinition,
  customLexer,
  parser,
  rootRule,
  options,
  parserConfig,
) {
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

  if (lexResult === undefined || options.lexerOnly) {
    lexResult = lexerInstance.tokenize(text);
    if (lexResult.errors.length > 0) {
      throw Error("Lexing errors detected");
    }
  }

  // It is recommended to only initialize a Chevrotain Parser once
  // and reset it's state instead of re-initializing it
  if (parserInstance === undefined) {
    var start = new Date().getTime();
    parserInstance = new parser(parserConfig);
    var end = new Date().getTime();
    console.log("Parser init time: " + (end - start));
  }

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
