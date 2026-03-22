/**
 * JSON grammar factory for benchmarking.
 * Mirrors the implementation in examples/grammars/json/json.js
 * but accepts a chevrotain module to allow version-swapping.
 */
import type { GrammarFactory } from "../types.ts";

export const createJsonBenchmark: GrammarFactory = (chevrotain, options) => {
  const { createToken, CstParser, Lexer } = chevrotain;

  // ----------------- Tokens -----------------
  const True = createToken({ name: "True", pattern: /true/ });
  const False = createToken({ name: "False", pattern: /false/ });
  const Null = createToken({ name: "Null", pattern: /null/ });
  const LCurly = createToken({ name: "LCurly", pattern: /{/ });
  const RCurly = createToken({ name: "RCurly", pattern: /}/ });
  const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
  const RSquare = createToken({ name: "RSquare", pattern: /]/ });
  const Comma = createToken({ name: "Comma", pattern: /,/ });
  const Colon = createToken({ name: "Colon", pattern: /:/ });
  const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
  });
  const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
  });
  const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t\n\r]+/,
    group: Lexer.SKIPPED,
  });

  const jsonTokens = [
    WhiteSpace,
    NumberLiteral,
    StringLiteral,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    Comma,
    Colon,
    True,
    False,
    Null,
  ];

  // ----------------- Lexer -----------------
  const lexer = new Lexer(jsonTokens);

  // ----------------- Parser -----------------
  class JsonParser extends CstParser {
    constructor() {
      super(jsonTokens, { outputCst: options.outputCst });

      const $ = this as any;

      $.RULE("json", () => {
        $.OR([
          { ALT: () => $.SUBRULE($.object) },
          { ALT: () => $.SUBRULE($.array) },
        ]);
      });

      $.RULE("object", () => {
        $.CONSUME(LCurly);
        $.OPTION(() => {
          $.SUBRULE($.objectItem);
          $.MANY(() => {
            $.CONSUME(Comma);
            $.SUBRULE2($.objectItem);
          });
        });
        $.CONSUME(RCurly);
      });

      $.RULE("objectItem", () => {
        $.CONSUME(StringLiteral);
        $.CONSUME(Colon);
        $.SUBRULE($.value);
      });

      $.RULE("array", () => {
        $.CONSUME(LSquare);
        $.OPTION(() => {
          $.SUBRULE($.value);
          $.MANY(() => {
            $.CONSUME(Comma);
            $.SUBRULE2($.value);
          });
        });
        $.CONSUME(RSquare);
      });

      $.RULE("value", () => {
        $.OR([
          { ALT: () => $.CONSUME(StringLiteral) },
          { ALT: () => $.CONSUME(NumberLiteral) },
          { ALT: () => $.SUBRULE($.object) },
          { ALT: () => $.SUBRULE($.array) },
          { ALT: () => $.CONSUME(True) },
          { ALT: () => $.CONSUME(False) },
          { ALT: () => $.CONSUME(Null) },
        ]);
      });

      this.performSelfAnalysis();
    }
  }

  const parser = new JsonParser() as any;

  // ----------------- API -----------------
  return {
    lex(text: string) {
      const lexResult = lexer.tokenize(text);
      return lexResult.tokens;
    },

    parse(tokens: any[]) {
      parser.input = tokens;
      parser.json();
    },

    fullFlow(text: string) {
      const lexResult = lexer.tokenize(text);
      parser.input = lexResult.tokens;
      parser.json();
    },

    name: "JSON",
  };
};
