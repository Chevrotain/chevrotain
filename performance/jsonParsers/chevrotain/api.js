import { JsonParser, jsonLexer } from "./chevrotainEmbeddedParser.mjs";

// ----------------- wrapping it all together -----------------
let parserInstance;
function parse(text) {
  const lexResult = jsonLexer.tokenize(text);
  if (lexResult.errors.length > 0) {
    throw Error("Lexing errors detected");
  }

  // It is recommended to only initialize a Chevrotain Parser once
  // and reset it's state instead of re-initializing it
  if (parserInstance === undefined) {
    parserInstance = new JsonParser({
      outputCst: false,
    });
  }

  // setting a new input will RESET the parser instance's state.
  parserInstance.input = lexResult.tokens;

  // any top level rule may be used as an entry point
  const value = parserInstance.json();

  if (parserInstance.errors.length > 0) {
    throw Error("Parsing Errors detected");
  }
  return {
    value: value, // this is a pure grammar, the value will always be <undefined>
    lexErrors: lexResult.errors,
    parseErrors: parserInstance.errors,
  };
}

// Benchmark logic expects each iframe to expose a `parse` function on itself (window)
window.parse = parse;
parse("{}");
