// importing from globals currently,
// TODO: replace with ESM imports...
const { createToken, Lexer, EmbeddedActionsParser } = chevrotain;

// ----------------- Lexer -----------------
const True = createToken({ name: "True", pattern: "true" });
const False = createToken({ name: "False", pattern: "false" });
const Null = createToken({ name: "Null", pattern: "null" });
const LCurly = createToken({ name: "LCurly", pattern: "{" });
const RCurly = createToken({ name: "RCurly", pattern: "}" });
const LSquare = createToken({ name: "LSquare", pattern: "[" });
const RSquare = createToken({ name: "RSquare", pattern: "]" });
const Comma = createToken({ name: "Comma", pattern: "," });
const Colon = createToken({ name: "Colon", pattern: ":" });

const stringLiteralPattern = /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/;
const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: stringLiteralPattern,
});
const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
});
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \t\n\r]+/,
  group: Lexer.SKIPPED,
});

const jsonTokens = [
  WhiteSpace,
  StringLiteral,
  NumberLiteral,
  Comma,
  Colon,
  LCurly,
  RCurly,
  LSquare,
  RSquare,
  True,
  False,
  Null,
];
// Tracking only the offset provides a small speed boost.
const ChevJsonLexer = new Lexer(jsonTokens, { positionTracking: "onlyOffset" });

// ----------------- parser -----------------

// https://chevrotain.io/docs/guide/performance.html#using-a-singleton-parser
// (Do not create a new Parser instance for each new input.)

class ChevrotainJsonParser extends EmbeddedActionsParser {
  constructor(options) {
    super(jsonTokens, options);

    const $ = this;

    $.RULE("json", () => {
      // prettier-ignore
      $.OR([
        { ALT: () => { $.SUBRULE($.object);},},
        { ALT: () => { $.SUBRULE($.array);},
        },
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
      // Perf boost: https://github.com/Chevrotain/chevrotain/blob/master/docs/faq.md#PERFORMANCE
      // See "Avoid reinitializing large arrays of alternatives." section
      // prettier-ignore
      $.OR(
        $.c1 ||
          ($.c1 = [
            { ALT: () => { $.CONSUME(StringLiteral);},},
            { ALT: () => { $.CONSUME(NumberLiteral);},},
            { ALT: () => { $.SUBRULE($.object);},},
            { ALT: () => { $.SUBRULE($.array);},},
            { ALT: () => { $.CONSUME(True);},},
            { ALT: () => { $.CONSUME(False);},},
            { ALT: () => { $.CONSUME(Null);},},
          ])
      );
    });

    // very important to call this after all the rules have been setup.
    // otherwise, the parser may not work correctly as it will lack information
    // derived from the self-analysis.
    this.performSelfAnalysis();
  }
}
