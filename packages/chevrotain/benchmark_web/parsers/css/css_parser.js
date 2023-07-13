// ----------------- lexer -----------------
var Lexer = chevrotain.Lexer;

// Based on the specs in:
// https://www.w3.org/TR/CSS21/grammar.html

// A little mini DSL for easier lexer definition using xRegExp.
var fragments = {};

function FRAGMENT(name, def) {
  fragments[name] = XRegExp.build(def, fragments);
}

function MAKE_PATTERN(def, flags) {
  return XRegExp.build(def, fragments, flags);
}

// ----------------- Lexer -----------------

// A Little wrapper to save us the trouble of manually building the
// array of cssTokens
var cssTokens = [];
var createToken = function (config) {
  var newToken = chevrotain.createToken(config);
  cssTokens.push(newToken);
  return newToken;
};

// The order of fragments definitions is important
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

var Whitespace = createToken({
  name: "Whitespace",
  pattern: MAKE_PATTERN("{{spaces}}"),
  // the W3C specs are are defined in a whitespace sensitive manner.
  // This implementation ignores that crazy mess, This means that this grammar may be a superset of the css 2.1 grammar.
  // Checking for whitespace related errors can be done in a separate process AFTER parsing.
  group: Lexer.SKIPPED,
});

var Comment = createToken({
  name: "Comment",
  pattern: /\/\*[^*]*\*+([^/*][^*]*\*+})*\//,
  group: Lexer.SKIPPED,
});

// This group has to be defined BEFORE Ident as their prefix is a valid Ident
var Uri = createToken({ name: "Uri", pattern: Lexer.NA });
var UriString = createToken({
  name: "UriString",
  pattern: MAKE_PATTERN(
    "url\\((:?{{spaces}})?({{string1}}|{{string2}})(:?{{spaces}})?\\)",
  ),
  categories: Uri,
});
var UriUrl = createToken({
  name: "UriUrl",
  pattern: MAKE_PATTERN("url\\((:?{{spaces}})?{{url}}(:?{{spaces}})?\\)"),
  categories: Uri,
});
var Func = createToken({
  name: "Func",
  pattern: MAKE_PATTERN("{{ident}}\\("),
});

var Cdo = createToken({ name: "Cdo", pattern: "<!--" });
// Cdc must be before Minus
var Cdc = createToken({ name: "Cdc", pattern: "-->" });
var Includes = createToken({ name: "Includes", pattern: "~=" });
var Dasmatch = createToken({ name: "Dasmatch", pattern: "|=" });
var Exclamation = createToken({ name: "Exclamation", pattern: "!" });
var Dot = createToken({ name: "Dot", pattern: "." });
var LCurly = createToken({ name: "LCurly", pattern: "{" });
var RCurly = createToken({ name: "RCurly", pattern: "}" });
var LSquare = createToken({ name: "LSquare", pattern: "[" });
var RSquare = createToken({ name: "RSquare", pattern: "]" });
var LParen = createToken({ name: "LParen", pattern: "(" });
var RParen = createToken({ name: "RParen", pattern: ")" });
var Comma = createToken({ name: "Comma", pattern: "," });
var Colon = createToken({ name: "Colon", pattern: ":" });
var SemiColon = createToken({ name: "SemiColon", pattern: ";" });
var Equals = createToken({ name: "Equals", pattern: "=" });
var Star = createToken({ name: "Star", pattern: "*" });
var Plus = createToken({ name: "Plus", pattern: "+" });
var GreaterThan = createToken({ name: "GreaterThan", pattern: ">" });
var Slash = createToken({ name: "Slash", pattern: "/" });

var StringLiteral = createToken({
  name: "StringLiteral",
  pattern: MAKE_PATTERN("{{string1}}|{{string2}}"),
});
var Hash = createToken({
  name: "Hash",
  pattern: MAKE_PATTERN("#{{name}}"),
});

// note that the spec defines import as : @{I}{M}{P}{O}{R}{T}
// Where every letter is defined in this pattern:
// i|\\0{0,4}(49|69)(\r\n|[ \t\r\n\f])?|\\i
// Lets count the number of ways to write the letter 'i'
// i // 2 options due to case insensitivity
// |
// \\0{0,4} // 5 options for number of spaces
// (49|69) // 2 options for asci value
// (\r\n|[ \t\r\n\f])? // 7 options, so the total for this alternative is 5 * 2 * 7 = 70 (!!!)
// |
// \\i // 1 option.
// so there are a total of 73 options to write the letter 'i'
// This gives us 73^6 options to write the word "import" which is a number with 12 digits...
// This implementation does not bother with this crap :) and instead settles for
// "just" 64 option to write "impPorT" (case due to case insensitivity)
var ImportSym = createToken({
  name: "ImportSym",
  pattern: /@import/i,
});
var PageSym = createToken({ name: "PageSym", pattern: /@page/i });
var MediaSym = createToken({ name: "MediaSym", pattern: /@media/i });
var CharsetSym = createToken({
  name: "CharsetSym",
  pattern: /@charset/i,
});
var ImportantSym = createToken({
  name: "ImportantSym",
  pattern: /important/i,
});

var Ems = createToken({
  name: "Ems",
  pattern: MAKE_PATTERN("{{num}}em", "i"),
});
var Exs = createToken({
  name: "Exs",
  pattern: MAKE_PATTERN("{{num}}ex", "i"),
});

var Length = createToken({ name: "Length", pattern: Lexer.NA });
var Px = createToken({
  name: "Px",
  pattern: MAKE_PATTERN("{{num}}px", "i"),
  categories: Length,
});
var Cm = createToken({
  name: "Cm",
  pattern: MAKE_PATTERN("{{num}}cm", "i"),
  categories: Length,
});
var Mm = createToken({
  name: "Mm",
  pattern: MAKE_PATTERN("{{num}}mm", "i"),
  categories: Length,
});
var In = createToken({
  name: "In",
  pattern: MAKE_PATTERN("{{num}}in", "i"),
  categories: Length,
});
var Pt = createToken({
  name: "Pt",
  pattern: MAKE_PATTERN("{{num}}pt", "i"),
  categories: Length,
});
var Pc = createToken({
  name: "Pc",
  pattern: MAKE_PATTERN("{{num}}pc", "i"),
  categories: Length,
});

var Angle = createToken({ name: "Angle", pattern: Lexer.NA });
var Deg = createToken({
  name: "Deg",
  pattern: MAKE_PATTERN("{{num}}deg", "i"),
  categories: Angle,
});
var Rad = createToken({
  name: "Rad",
  pattern: MAKE_PATTERN("{{num}}rad", "i"),
  categories: Angle,
});
var Grad = createToken({
  name: "Grad",
  pattern: MAKE_PATTERN("{{num}}grad", "i"),
  categories: Angle,
});

var Time = createToken({ name: "Time", pattern: Lexer.NA });
var Ms = createToken({
  name: "Ms",
  pattern: MAKE_PATTERN("{{num}}ms", "i"),
  categories: Time,
});
var Sec = createToken({
  name: "Sec",
  pattern: MAKE_PATTERN("{{num}}sec", "i"),
  categories: Time,
});

var Freq = createToken({ name: "Freq", pattern: Lexer.NA });
var Hz = createToken({
  name: "Hz",
  pattern: MAKE_PATTERN("{{num}}hz", "i"),
  categories: Freq,
});
var Khz = createToken({
  name: "Khz",
  pattern: MAKE_PATTERN("{{num}}khz", "i"),
  categories: Freq,
});

var Percentage = createToken({
  name: "Percentage",
  pattern: MAKE_PATTERN("{{num}}%", "i"),
});

// Num must appear after all the num forms with a suffix
var Num = createToken({
  name: "Num",
  pattern: MAKE_PATTERN("{{num}}"),
});

// Ident must be before Minus
var Ident = createToken({
  name: "Ident",
  pattern: MAKE_PATTERN("{{ident}}"),
});

var Minus = createToken({ name: "Minus", pattern: /-/ });

self.lexerDefinition = cssTokens;

var ChevrotainParser = self.parserConfig.outputCst
  ? chevrotain.CstParser
  : chevrotain.EmbeddedActionsParser;

// ----------------- parser -----------------
class parser extends ChevrotainParser {
  constructor(config) {
    super(cssTokens, config);

    var $ = this;

    this.RULE("stylesheet", function () {
      // [ CHARSET_SYM STRING ';' ]?
      $.OPTION(function () {
        $.SUBRULE($.charsetHeader);
      });

      // [S|CDO|CDC]*
      $.SUBRULE($.cdcCdo);

      // [ import [ CDO S* | CDC S* ]* ]*
      $.MANY(function () {
        $.SUBRULE($.cssImport);
        $.SUBRULE2($.cdcCdo);
      });

      // [ [ ruleset | media | page ] [ CDO S* | CDC S* ]* ]*
      $.MANY2(function () {
        $.SUBRULE($.contents);
      });
    });

    this.RULE("charsetHeader", function () {
      $.CONSUME(CharsetSym);
      $.CONSUME(StringLiteral);
      $.CONSUME(SemiColon);
    });

    this.RULE("contents", function () {
      // prettier-ignore
      $.OR([
            {ALT: function() {$.SUBRULE($.ruleset)}},
            {ALT: function() {$.SUBRULE($.media)}},
            {ALT: function() {$.SUBRULE($.page)}}
        ])
      $.SUBRULE3($.cdcCdo);
    });

    // factor out repeating pattern for cdc/cdo
    this.RULE("cdcCdo", function () {
      $.MANY(function () {
        // prettier-ignore
        $.OR([
                {ALT: function() {$.CONSUME(Cdo)}},
                {ALT: function() {$.CONSUME(Cdc)}}
            ])
      });
    });

    // IMPORT_SYM S*
    // [STRING|URI] S* media_list? ';' S*
    this.RULE("cssImport", function () {
      $.CONSUME(ImportSym);
      // prettier-ignore
      $.OR([
            {ALT: function() {$.CONSUME(StringLiteral)}},
            {ALT: function() {$.CONSUME(Uri)}}
        ])

      $.OPTION(function () {
        $.SUBRULE($.media_list);
      });

      $.CONSUME(SemiColon);
    });

    // MEDIA_SYM S* media_list '{' S* ruleset* '}' S*
    this.RULE("media", function () {
      $.CONSUME(MediaSym);
      $.SUBRULE($.media_list);
      $.CONSUME(LCurly);
      $.SUBRULE($.ruleset);
      $.CONSUME(RCurly);
    });

    // medium [ COMMA S* medium]*
    this.RULE("media_list", function () {
      $.SUBRULE($.medium);
      $.MANY_SEP({
        SEP: Comma,
        DEF: function () {
          $.SUBRULE2($.medium);
        },
      });
    });

    // IDENT S*
    this.RULE("medium", function () {
      $.CONSUME(Ident);
    });

    // PAGE_SYM S* pseudo_page?
    // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
    this.RULE("page", function () {
      $.CONSUME(PageSym);
      $.OPTION(function () {
        $.SUBRULE($.pseudo_page);
      });

      $.SUBRULE($.declarationsGroup);
    });

    // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
    // factored out repeating grammar pattern
    this.RULE("declarationsGroup", function () {
      $.CONSUME(LCurly);
      $.OPTION(function () {
        $.SUBRULE($.declaration);
      });

      $.MANY(function () {
        $.CONSUME(SemiColon);
        $.OPTION2(function () {
          $.SUBRULE2($.declaration);
        });
      });
      $.CONSUME(RCurly);
    });

    // ':' IDENT S*
    this.RULE("pseudo_page", function () {
      $.CONSUME(Colon);
      $.CONSUME(Ident);
    });

    // '/' S* | ',' S*
    this.RULE("operator", function () {
      // prettier-ignore
      $.OR([
            {ALT: function() {$.CONSUME(Slash)}},
            {ALT: function() {$.CONSUME(Comma)}}
        ])
    });

    // '+' S* | '>' S*
    this.RULE("combinator", function () {
      // prettier-ignore
      $.OR([
            {ALT: function() {$.CONSUME(Plus)}},
            {ALT: function() {$.CONSUME(GreaterThan)}}
        ])
    });

    // '-' | '+'
    this.RULE("unary_operator", function () {
      // prettier-ignore
      $.OR([
            {ALT: function() {$.CONSUME(Minus)}},
            {ALT: function() {$.CONSUME(Plus)}}
        ])
    });

    // IDENT S*
    this.RULE("property", function () {
      $.CONSUME(Ident);
    });

    // selector [ ',' S* selector ]*
    // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
    this.RULE("ruleset", function () {
      $.MANY_SEP({
        SEP: Comma,
        DEF: function () {
          $.SUBRULE($.selector);
        },
      });

      $.SUBRULE($.declarationsGroup);
    });

    // simple_selector [ combinator selector | S+ [ combinator? selector ]? ]?
    this.RULE("selector", function () {
      $.SUBRULE($.simple_selector);
      $.OPTION(function () {
        $.OPTION2(function () {
          $.SUBRULE($.combinator);
        });
        $.SUBRULE($.selector);
      });
    });

    // element_name [ HASH | class | attrib | pseudo ]*
    // | [ HASH | class | attrib | pseudo ]+
    this.RULE("simple_selector", function () {
      $.OR([
        {
          ALT: function () {
            $.SUBRULE($.element_name);
            $.MANY(function () {
              $.SUBRULE($.simple_selector_suffix);
            });
          },
        },
        {
          ALT: function () {
            $.AT_LEAST_ONE(function () {
              $.SUBRULE2($.simple_selector_suffix);
            }, "selector suffix");
          },
        },
      ]);
    });

    // helper grammar rule to avoid repetition
    // [ HASH | class | attrib | pseudo ]+
    this.RULE("simple_selector_suffix", function () {
      // prettier-ignore
      $.OR([
            {ALT: function() {$.CONSUME(Hash)}},
            {ALT: function() {$.SUBRULE($.class)}},
            {ALT: function() {$.SUBRULE($.attrib)}},
            {ALT: function() {$.SUBRULE($.pseudo)}}
        ])
    });

    // '.' IDENT
    this.RULE("class", function () {
      $.CONSUME(Dot);
      $.CONSUME(Ident);
    });

    // IDENT | '*'
    this.RULE("element_name", function () {
      // prettier-ignore
      $.OR([
            {ALT: function() {$.CONSUME(Ident)}},
            {ALT: function() {$.CONSUME(Star)}}
        ])
    });

    // '[' S* IDENT S* [ [ '=' | INCLUDES | DASHMATCH ] S* [ IDENT | STRING ] S* ]? ']'
    this.RULE("attrib", function () {
      $.CONSUME(LSquare);
      $.CONSUME(Ident);

      this.OPTION(function () {
        // prettier-ignore
        $.OR([
                {ALT: function() {$.CONSUME(Equals)}},
                {ALT: function() {$.CONSUME(Includes)}},
                {ALT: function() {$.CONSUME(Dasmatch)}}
            ])

        // prettier-ignore
        $.OR2([
                {ALT: function() {$.CONSUME2(Ident)}},
                {ALT: function() {$.CONSUME(StringLiteral)}}
            ])
      });
      $.CONSUME(RSquare);
    });

    // ':' [ IDENT | FUNCTION S* [IDENT S*]? ')' ]
    this.RULE("pseudo", function () {
      $.CONSUME(Colon);

      // prettier-ignore
      $.OR([
            {ALT: function() {$.CONSUME(Ident)}},
            {
                ALT: function() {
                    $.CONSUME(Func)
                    $.OPTION(function() {
                        $.CONSUME2(Ident)
                    })
                    $.CONSUME(RParen)
                }
            }
        ])
    });

    // property ':' S* expr prio?
    this.RULE("declaration", function () {
      $.SUBRULE($.property);
      $.CONSUME(Colon);
      $.SUBRULE($.expr);

      $.OPTION(function () {
        $.SUBRULE($.prio);
      });
    });

    // IMPORTANT_SYM S*
    this.RULE("prio", function () {
      $.CONSUME(ImportantSym);
    });

    // term [ operator? term ]*
    this.RULE("expr", function () {
      $.SUBRULE($.term);
      $.MANY(function () {
        $.OPTION(function () {
          $.SUBRULE($.operator);
        });
        $.SUBRULE2($.term);
      });
    });

    // unary_operator?
    // [ NUMBER S* | PERCENTAGE S* | LENGTH S* | EMS S* | EXS S* | ANGLE S* |
    // TIME S* | FREQ S* ]
    // | STRING S* | IDENT S* | URI S* | hexcolor | function
    this.RULE("term", function () {
      $.OPTION(function () {
        $.SUBRULE($.unary_operator);
      });

      // prettier-ignore
      $.OR([
            {ALT: function() {$.CONSUME(Num)}},
            {ALT: function() {$.CONSUME(Percentage)}},
            {ALT: function() {$.CONSUME(Length)}},
            {ALT: function() {$.CONSUME(Ems)}},
            {ALT: function() {$.CONSUME(Exs)}},
            {ALT: function() {$.CONSUME(Angle)}},
            {ALT: function() {$.CONSUME(Time)}},
            {ALT: function() {$.CONSUME(Freq)}},
            {ALT: function() {$.CONSUME(StringLiteral)}},
            {ALT: function() {$.CONSUME(Ident)}},
            {ALT: function() {$.CONSUME(Uri)}},
            {ALT: function() {$.SUBRULE($.hexcolor)}},
            {ALT: function() {$.SUBRULE($.cssFunction)}}
        ])
    });

    // FUNCTION S* expr ')' S*
    this.RULE("cssFunction", function () {
      $.CONSUME(Func);
      $.SUBRULE($.expr);
      $.CONSUME(RParen);
    });

    this.RULE("hexcolor", function () {
      $.CONSUME(Hash);
    });

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    this.performSelfAnalysis();
  }
}

self.parser = parser;
