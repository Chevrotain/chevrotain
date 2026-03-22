export function createJsonBenchmarkFixture(chevrotain, options = {}) {
  const { createToken, Lexer, EmbeddedActionsParser, CstParser } = chevrotain;
  const parserBase = options.useCst ? CstParser : EmbeddedActionsParser;
  const parserConfig = options.useCst ? {} : { outputCst: false };

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

  const JsonLexer = new Lexer(jsonTokens, { positionTracking: "onlyOffset" });

  class JsonParser extends parserBase {
    constructor() {
      super(jsonTokens, parserConfig);

      const $ = this;

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

  const parser = new JsonParser();
  const sample = JSON.stringify(
    Array.from({ length: 50 }, (_, i) => ({
      _id: `id${i}`,
      index: i,
      guid: `xxxxxxxx-${i}`,
      isActive: i % 2 === 0,
      balance: `$${(1000 + i * 13.37).toFixed(2)}`,
      name: `Person ${i}`,
      tags: [`tag${i % 5}`, `tag${(i + 1) % 5}`, `tag${(i + 2) % 5}`],
      address: `${i * 100} Main St`,
      about: `This is a somewhat longer description field for person ${i}.`,
    })),
  );

  return {
    name: "JSON",
    makeParser() {
      return new JsonParser();
    },
    parseWith(activeParser, tokens) {
      activeParser.input = tokens;
      activeParser.json();
    },
    tokenize() {
      return JsonLexer.tokenize(sample).tokens;
    },
    parse(tokens) {
      this.parseWith(parser, tokens);
    },
    run() {
      this.parse(this.tokenize());
    },
  };
}
