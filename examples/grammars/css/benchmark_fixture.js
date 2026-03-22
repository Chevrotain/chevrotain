import XRegExp from "xregexp";

export function createCssBenchmarkFixture(chevrotain, options = {}) {
  const {
    Lexer,
    EmbeddedActionsParser,
    CstParser,
    createToken: orgCreateToken,
  } = chevrotain;
  const parserBase = options.useCst ? CstParser : EmbeddedActionsParser;
  const parserConfig = options.useCst ? {} : { outputCst: false };

  const fragments = {};

  function FRAGMENT(name, def) {
    fragments[name] = XRegExp.build(def, fragments);
  }

  function MAKE_PATTERN(def, flags) {
    return XRegExp.build(def, fragments, flags);
  }

  const cssTokens = [];
  const createToken = function () {
    const newToken = orgCreateToken.apply(null, arguments);
    cssTokens.push(newToken);
    return newToken;
  };

  FRAGMENT("nl", "\\n|\\r|\\f");
  FRAGMENT("h", "[0-9a-f]");
  FRAGMENT("nonascii", "[\\u0240-\\uffff]");
  FRAGMENT("unicode", "{{h}}{1,6}");
  FRAGMENT("escape", "{{unicode}}|\\\\[^\\r\\n\\f0-9a-f]");
  FRAGMENT("nmstart", "[_a-zA-Z]|{{nonascii}}|{{escape}}");
  FRAGMENT("nmchar", "[_a-zA-Z0-9-]|{{nonascii}}|{{escape}}");
  FRAGMENT("string1", '\\"([^\\n\\r\\f\\"]|{{nl}}|{{escape}})*\\"');
  FRAGMENT("string2", "\\'([^\\n\\r\\f\\']|{{nl}}|{{escape}})*\\'");
  FRAGMENT("comment", "\\/\\*[^*]*\\*+([^/*][^*]*\\*+)*\\/");
  FRAGMENT("name", "({{nmchar}})+");
  FRAGMENT("url", "([!#\\$%&*-~]|{{nonascii}}|{{escape}})*");
  FRAGMENT("spaces", "[ \\t\\r\\n\\f]+");
  FRAGMENT("ident", "-?{{nmstart}}{{nmchar}}*");
  FRAGMENT("num", "[0-9]+|[0-9]*\\.[0-9]+");

  const Whitespace = createToken({
    name: "Whitespace",
    pattern: MAKE_PATTERN("{{spaces}}"),
    group: Lexer.SKIPPED,
  });
  const Comment = createToken({
    name: "Comment",
    pattern: /\/\*[^*]*\*+([^/*][^*]*\*+})*\//,
    group: Lexer.SKIPPED,
    line_breaks: true,
  });
  const Uri = createToken({ name: "Uri", pattern: Lexer.NA });
  createToken({
    name: "UriString",
    pattern: MAKE_PATTERN(
      "url\\((:?{{spaces}})?({{string1}}|{{string2}})(:?{{spaces}})?\\)",
    ),
    categories: Uri,
  });
  createToken({
    name: "UriUrl",
    pattern: MAKE_PATTERN("url\\((:?{{spaces}})?{{url}}(:?{{spaces}})?\\)"),
    categories: Uri,
  });
  const Func = createToken({
    name: "Func",
    pattern: MAKE_PATTERN("{{ident}}\\("),
  });
  const Cdo = createToken({ name: "Cdo", pattern: /<!--/ });
  const Cdc = createToken({ name: "Cdc", pattern: /-->/ });
  const Includes = createToken({ name: "Includes", pattern: /~=/ });
  const Dasmatch = createToken({ name: "Dasmatch", pattern: /\|=/ });
  createToken({ name: "Exclamation", pattern: /!/ });
  const Dot = createToken({ name: "Dot", pattern: /\./ });
  const LCurly = createToken({ name: "LCurly", pattern: /{/ });
  const RCurly = createToken({ name: "RCurly", pattern: /}/ });
  const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
  const RSquare = createToken({ name: "RSquare", pattern: /\]/ });
  const LParen = createToken({ name: "LParen", pattern: /\(/ });
  const RParen = createToken({ name: "RParen", pattern: /\)/ });
  const Comma = createToken({ name: "Comma", pattern: /,/ });
  const Colon = createToken({ name: "Colon", pattern: /:/ });
  const SemiColon = createToken({ name: "SemiColon", pattern: /;/ });
  const Equals = createToken({ name: "Equals", pattern: /=/ });
  const Star = createToken({ name: "Star", pattern: /\*/ });
  const Plus = createToken({ name: "Plus", pattern: /\+/ });
  const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ });
  const Slash = createToken({ name: "Slash", pattern: /\// });
  const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: MAKE_PATTERN("{{string1}}|{{string2}}"),
  });
  const Hash = createToken({
    name: "Hash",
    pattern: MAKE_PATTERN("#{{name}}"),
  });
  const ImportSym = createToken({ name: "ImportSym", pattern: /@import/i });
  const PageSym = createToken({ name: "PageSym", pattern: /@page/i });
  const MediaSym = createToken({ name: "MediaSym", pattern: /@media/i });
  const CharsetSym = createToken({ name: "CharsetSym", pattern: /@charset/i });
  const ImportantSym = createToken({
    name: "ImportantSym",
    pattern: /important/i,
  });
  const Ems = createToken({
    name: "Ems",
    pattern: MAKE_PATTERN("{{num}}em", "i"),
  });
  const Exs = createToken({
    name: "Exs",
    pattern: MAKE_PATTERN("{{num}}ex", "i"),
  });
  const Length = createToken({ name: "Length", pattern: Lexer.NA });
  createToken({
    name: "Px",
    pattern: MAKE_PATTERN("{{num}}px", "i"),
    categories: Length,
  });
  createToken({
    name: "Cm",
    pattern: MAKE_PATTERN("{{num}}cm", "i"),
    categories: Length,
  });
  createToken({
    name: "Mm",
    pattern: MAKE_PATTERN("{{num}}mm", "i"),
    categories: Length,
  });
  createToken({
    name: "In",
    pattern: MAKE_PATTERN("{{num}}in", "i"),
    categories: Length,
  });
  createToken({
    name: "Pt",
    pattern: MAKE_PATTERN("{{num}}pt", "i"),
    categories: Length,
  });
  createToken({
    name: "Pc",
    pattern: MAKE_PATTERN("{{num}}pc", "i"),
    categories: Length,
  });
  const Angle = createToken({ name: "Angle", pattern: Lexer.NA });
  createToken({
    name: "Deg",
    pattern: MAKE_PATTERN("{{num}}deg", "i"),
    categories: Angle,
  });
  createToken({
    name: "Rad",
    pattern: MAKE_PATTERN("{{num}}rad", "i"),
    categories: Angle,
  });
  createToken({
    name: "Grad",
    pattern: MAKE_PATTERN("{{num}}grad", "i"),
    categories: Angle,
  });
  const Time = createToken({ name: "Time", pattern: Lexer.NA });
  createToken({
    name: "Ms",
    pattern: MAKE_PATTERN("{{num}}ms", "i"),
    categories: Time,
  });
  createToken({
    name: "Sec",
    pattern: MAKE_PATTERN("{{num}}sec", "i"),
    categories: Time,
  });
  const Freq = createToken({ name: "Freq", pattern: Lexer.NA });
  createToken({
    name: "Hz",
    pattern: MAKE_PATTERN("{{num}}hz", "i"),
    categories: Freq,
  });
  createToken({
    name: "Khz",
    pattern: MAKE_PATTERN("{{num}}khz", "i"),
    categories: Freq,
  });
  const Percentage = createToken({
    name: "Percentage",
    pattern: MAKE_PATTERN("{{num}}%", "i"),
  });
  const Num = createToken({ name: "Num", pattern: MAKE_PATTERN("{{num}}") });
  const Ident = createToken({
    name: "Ident",
    pattern: MAKE_PATTERN("{{ident}}"),
  });
  const Minus = createToken({ name: "Minus", pattern: /-/ });

  const CssLexer = new Lexer(cssTokens, { positionTracking: "onlyOffset" });

  class CssParser extends parserBase {
    constructor() {
      super(cssTokens, parserConfig);

      const $ = this;

      $.RULE("stylesheet", () => {
        $.OPTION(() => {
          $.SUBRULE($.charsetHeader);
        });
        $.SUBRULE($.cdcCdo);
        $.MANY(() => {
          $.SUBRULE($.cssImport);
          $.SUBRULE2($.cdcCdo);
        });
        $.MANY2(() => {
          $.SUBRULE($.contents);
        });
      });

      $.RULE("charsetHeader", () => {
        $.CONSUME(CharsetSym);
        $.CONSUME(StringLiteral);
        $.CONSUME(SemiColon);
      });

      $.RULE("contents", () => {
        $.OR([
          { ALT: () => $.SUBRULE($.ruleset) },
          { ALT: () => $.SUBRULE($.media) },
          { ALT: () => $.SUBRULE($.page) },
        ]);
        $.SUBRULE3($.cdcCdo);
      });

      $.RULE("cdcCdo", () => {
        $.MANY(() => {
          $.OR([{ ALT: () => $.CONSUME(Cdo) }, { ALT: () => $.CONSUME(Cdc) }]);
        });
      });

      $.RULE("cssImport", () => {
        $.CONSUME(ImportSym);
        $.OR([
          { ALT: () => $.CONSUME(StringLiteral) },
          { ALT: () => $.CONSUME(Uri) },
        ]);
        $.OPTION(() => {
          $.SUBRULE($.media_list);
        });
        $.CONSUME(SemiColon);
      });

      $.RULE("media", () => {
        $.CONSUME(MediaSym);
        $.SUBRULE($.media_list);
        $.CONSUME(LCurly);
        $.SUBRULE($.ruleset);
        $.CONSUME(RCurly);
      });

      $.RULE("media_list", () => {
        $.SUBRULE($.medium);
        $.MANY_SEP({
          SEP: Comma,
          DEF: () => {
            $.SUBRULE2($.medium);
          },
        });
      });

      $.RULE("medium", () => {
        $.CONSUME(Ident);
      });

      $.RULE("page", () => {
        $.CONSUME(PageSym);
        $.OPTION(() => {
          $.SUBRULE($.pseudo_page);
        });
        $.SUBRULE($.declarationsGroup);
      });

      $.RULE("declarationsGroup", () => {
        $.CONSUME(LCurly);
        $.OPTION(() => {
          $.SUBRULE($.declaration);
        });
        $.MANY(() => {
          $.CONSUME(SemiColon);
          $.OPTION2(() => {
            $.SUBRULE2($.declaration);
          });
        });
        $.CONSUME(RCurly);
      });

      $.RULE("pseudo_page", () => {
        $.CONSUME(Colon);
        $.CONSUME(Ident);
      });

      $.RULE("operator", () => {
        $.OR([
          { ALT: () => $.CONSUME(Slash) },
          { ALT: () => $.CONSUME(Comma) },
        ]);
      });

      $.RULE("combinator", () => {
        $.OR([
          { ALT: () => $.CONSUME(Plus) },
          { ALT: () => $.CONSUME(GreaterThan) },
        ]);
      });

      $.RULE("unary_operator", () => {
        $.OR([{ ALT: () => $.CONSUME(Minus) }, { ALT: () => $.CONSUME(Plus) }]);
      });

      $.RULE("property", () => {
        $.CONSUME(Ident);
      });

      $.RULE("ruleset", () => {
        $.MANY_SEP({
          SEP: Comma,
          DEF: () => {
            $.SUBRULE($.selector);
          },
        });
        $.SUBRULE($.declarationsGroup);
      });

      $.RULE("selector", () => {
        $.SUBRULE($.simple_selector);
        $.OPTION(() => {
          $.OR([
            {
              GATE: () => {
                const prevToken = $.LA(0);
                const nextToken = $.LA(1);
                return nextToken.startOffset > prevToken.endOffset;
              },
              ALT: () => {
                $.OPTION2(() => {
                  $.SUBRULE($.combinator);
                });
                $.SUBRULE($.selector);
              },
            },
            {
              ALT: () => {
                $.SUBRULE2($.combinator);
                $.SUBRULE2($.selector);
              },
            },
          ]);
        });
      });

      $.RULE("simple_selector", () => {
        $.OR([
          {
            ALT: () => {
              $.SUBRULE($.element_name);
              $.MANY(() => {
                $.SUBRULE($.simple_selector_suffix);
              });
            },
          },
          {
            ALT: () => {
              $.AT_LEAST_ONE(() => {
                $.SUBRULE2($.simple_selector_suffix);
              });
            },
          },
        ]);
      });

      $.RULE("simple_selector_suffix", () => {
        $.OR([
          { ALT: () => $.CONSUME(Hash) },
          { ALT: () => $.SUBRULE($.class) },
          { ALT: () => $.SUBRULE($.attrib) },
          { ALT: () => $.SUBRULE($.pseudo) },
        ]);
      });

      $.RULE("class", () => {
        $.CONSUME(Dot);
        $.CONSUME(Ident);
      });

      $.RULE("element_name", () => {
        $.OR([{ ALT: () => $.CONSUME(Ident) }, { ALT: () => $.CONSUME(Star) }]);
      });

      $.RULE("attrib", () => {
        $.CONSUME(LSquare);
        $.CONSUME(Ident);
        $.OPTION(() => {
          $.OR([
            { ALT: () => $.CONSUME(Equals) },
            { ALT: () => $.CONSUME(Includes) },
            { ALT: () => $.CONSUME(Dasmatch) },
          ]);
          $.OR2([
            { ALT: () => $.CONSUME2(Ident) },
            { ALT: () => $.CONSUME(StringLiteral) },
          ]);
        });
        $.CONSUME(RSquare);
      });

      $.RULE("pseudo", () => {
        $.CONSUME(Colon);
        $.OR([
          { ALT: () => $.CONSUME(Ident) },
          {
            ALT: () => {
              $.CONSUME(Func);
              $.OPTION(() => {
                $.CONSUME2(Ident);
              });
              $.CONSUME(RParen);
            },
          },
        ]);
      });

      $.RULE("declaration", () => {
        $.SUBRULE($.property);
        $.CONSUME(Colon);
        $.SUBRULE($.expr);
        $.OPTION(() => {
          $.SUBRULE($.prio);
        });
      });

      $.RULE("prio", () => {
        $.CONSUME(ImportantSym);
      });

      $.RULE("expr", () => {
        $.SUBRULE($.term);
        $.MANY(() => {
          $.OPTION(() => {
            $.SUBRULE($.operator);
          });
          $.SUBRULE2($.term);
        });
      });

      $.RULE("term", () => {
        $.OPTION(() => {
          $.SUBRULE($.unary_operator);
        });
        $.OR([
          { ALT: () => $.CONSUME(Num) },
          { ALT: () => $.CONSUME(Percentage) },
          { ALT: () => $.CONSUME(Length) },
          { ALT: () => $.CONSUME(Ems) },
          { ALT: () => $.CONSUME(Exs) },
          { ALT: () => $.CONSUME(Angle) },
          { ALT: () => $.CONSUME(Time) },
          { ALT: () => $.CONSUME(Freq) },
          { ALT: () => $.CONSUME(StringLiteral) },
          { ALT: () => $.CONSUME(Ident) },
          { ALT: () => $.CONSUME(Uri) },
          { ALT: () => $.CONSUME(Hash) },
          {
            ALT: () => {
              $.CONSUME(Func);
              $.SUBRULE($.expr);
              $.CONSUME(RParen);
            },
          },
        ]);
      });

      this.performSelfAnalysis();
    }
  }

  const parser = new CssParser();
  const sample = Array.from(
    { length: 100 },
    (_, i) => `
.class${i}, .class${i}:hover {
  color: red;
  font-size: 14px;
  margin: 0;
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
}
`,
  ).join("\n");

  return {
    name: "CSS",
    charsPerOp: sample.length,
    makeParser() {
      return new CssParser();
    },
    parseWith(activeParser, tokens) {
      activeParser.input = tokens;
      activeParser.stylesheet();
    },
    tokenize() {
      return CssLexer.tokenize(sample).tokens;
    },
    parse(tokens) {
      this.parseWith(parser, tokens);
    },
    run() {
      this.parse(this.tokenize());
    },
  };
}
