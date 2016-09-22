var XRegExp = require("xregexp");
var chevrotain = require("../../examples/grammars/node_modules/chevrotain/lib/chevrotain");

// ----------------- lexer -----------------
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;


// Based on the specs in:
// https://www.w3.org/TR/CSS21/grammar.html

// A little mini DSL for easier lexer definition using xRegExp.
var fragments = {}

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
var extendToken = function() {
    var newToken = chevrotain.extendLazyToken.apply(null, arguments);
    cssTokens.push(newToken);
    return newToken;
}

// The order of fragments definitions is important
FRAGMENT('nl', '\\n|\\r|\\f');
FRAGMENT('h', '[0-9a-f]');
FRAGMENT('nonascii', '[\\u0240-\\uffff]');
FRAGMENT('unicode', '\\{{h}}{1,6}');
FRAGMENT('escape', '{{unicode}}|\\\\[^\\r\\n\\f0-9a-f]');
FRAGMENT('nmstart', '[_a-zA-Z]|{{nonascii}}|{{escape}}');
FRAGMENT('nmchar', '[_a-zA-Z0-9-]|{{nonascii}}|{{escape}}');
FRAGMENT('string1', '\\"([^\\n\\r\\f\\"]|\\{{nl}}|{{escape}})*\\"');
FRAGMENT('string2', "\\'([^\\n\\r\\f\\']|\\{{nl}}|{{escape}})*\\'");
FRAGMENT('comment', '\\/\\*[^*]*\\*+([^/*][^*]*\\*+)*\\/');
FRAGMENT("name", "({{nmchar}})+");
FRAGMENT("url", "([!#\\$%&*-~]|{{nonascii}}|{{escape}})*");
FRAGMENT("spaces", "[ \\t\\r\\n\\f]+");
FRAGMENT("ident", "-?{{nmstart}}{{nmchar}}*");
FRAGMENT("num", "[0-9]+|[0-9]*\\.[0-9]+");

var Whitespace = extendToken('Whitespace', MAKE_PATTERN('{{spaces}}'));
var Comment = extendToken('Comment', /\/\*[^*]*\*+([^/*][^*]*\*+)*\//);
// the W3C specs are are defined in a whitespace sensitive manner.
// This implementation ignores that crazy mess, This means that this grammar may be a superset of the css 2.1 grammar.
// Checking for whitespace related errors can be done in a separate process AFTER parsing.
Whitespace.GROUP = Lexer.SKIPPED;
Comment.GROUP = Lexer.SKIPPED;

// This group has to be defined BEFORE Ident as their prefix is a valid Ident
var Uri = extendToken('Uri', Lexer.NA);
var UriString = extendToken('UriString', MAKE_PATTERN('url\\((:?{{spaces}})?({{string1}}|{{string2}})(:?{{spaces}})?\\)'), Uri);
var UriUrl = extendToken('UriUrl', MAKE_PATTERN('url\\((:?{{spaces}})?{{url}}(:?{{spaces}})?\\)'), Uri);
var Func = extendToken('Func', MAKE_PATTERN('{{ident}}\\('));
// Ident must be before Minus
var Ident = extendToken('Ident', MAKE_PATTERN('{{ident}}'));

var Cdo = extendToken('Cdo', /<!--/);
// Cdc must be before Minus
var Cdc = extendToken('Cdc', /-->/);
var Includes = extendToken('Includes', /~=/);
var Dasmatch = extendToken('Dasmatch', /\|=/);
var Exclamation = extendToken('Exclamation', /!/);
var Dot = extendToken('Dot', /\./);
var LCurly = extendToken('LCurly', /{/);
var RCurly = extendToken('RCurly', /}/);
var LSquare = extendToken('LSquare', /\[/);
var RSquare = extendToken('RSquare', /]/);
var LParen = extendToken('LParen', /\(/);
var RParen = extendToken('RParen', /\)/);
var Comma = extendToken('Comma', /,/);
var Colon = extendToken('Colon', /:/);
var SemiColon = extendToken('SemiColon', /;/);
var Equals = extendToken('Equals', /=/);
var Star = extendToken('Star', /\*/);
var Plus = extendToken('Plus', /\+/);
var Minus = extendToken('Minus', /-/);
var GreaterThan = extendToken('GreaterThan', />/);
var Slash = extendToken('Slash', /\//);

var StringLiteral = extendToken('StringLiteral', MAKE_PATTERN('{{string1}}|{{string2}}'));
var Hash = extendToken('Hash', MAKE_PATTERN('#{{name}}'));

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
var ImportSym = extendToken('ImportSym', /@import/i);
var PageSym = extendToken('PageSym', /@page/i);
var MediaSym = extendToken('MediaSym', /@media/i);
var CharsetSym = extendToken('CharsetSym', /@charset/i);
var ImportantSym = extendToken('ImportantSym', /important/i);


var Ems = extendToken('Ems', MAKE_PATTERN('{{num}}em', 'i'));
var Exs = extendToken('Exs', MAKE_PATTERN('{{num}}ex', 'i'));

var Length = extendToken('Length', Lexer.NA);
var Px = extendToken('Px', MAKE_PATTERN('{{num}}px', 'i'), Length);
var Cm = extendToken('Cm', MAKE_PATTERN('{{num}}cm', 'i'), Length);
var Mm = extendToken('Mm', MAKE_PATTERN('{{num}}mm', 'i'), Length);
var In = extendToken('In', MAKE_PATTERN('{{num}}in', 'i'), Length);
var Pt = extendToken('Pt', MAKE_PATTERN('{{num}}pt', 'i'), Length);
var Pc = extendToken('Pc', MAKE_PATTERN('{{num}}pc', 'i'), Length);

var Angle = extendToken('Angle', Lexer.NA);
var Deg = extendToken('Deg', MAKE_PATTERN('{{num}}deg', 'i'), Angle)
var Rad = extendToken('Rad', MAKE_PATTERN('{{num}}rad', 'i'), Angle)
var Grad = extendToken('Grad', MAKE_PATTERN('{{num}}grad', 'i'), Angle)

var Time = extendToken('Time', Lexer.NA);
var Ms = extendToken('Ms', MAKE_PATTERN('{{num}}ms', 'i'), Time)
var Sec = extendToken('Sec', MAKE_PATTERN('{{num}}sec', 'i'), Time)

var Freq = extendToken('Freq', Lexer.NA);
var Hz = extendToken('Hz', MAKE_PATTERN('{{num}}hz', 'i'), Freq)
var Khz = extendToken('Khz', MAKE_PATTERN('{{num}}khz', 'i'), Freq)

var Percentage = extendToken('Percentage', MAKE_PATTERN('{{num}}%', 'i'))

// Num must appear after all the num forms with a suffix
var Num = extendToken('Num', MAKE_PATTERN('{{num}}'));


var CssLexer = new Lexer(cssTokens);

// ----------------- parser -----------------

function CssParser(input) {
    Parser.call(this, input, cssTokens);
    var $ = this;

    this.stylesheet = this.RULE('stylesheet', function() {

        // [ CHARSET_SYM STRING ';' ]?
        $.OPTION(function() {
            $.SUBRULE($.charsetHeader)
        })

        // [S|CDO|CDC]*
        $.SUBRULE($.cdcCdo)

        // [ import [ CDO S* | CDC S* ]* ]*
        $.MANY(function() {
            $.SUBRULE($.cssImport)
            $.SUBRULE2($.cdcCdo)
        })

        // [ [ ruleset | media | page ] [ CDO S* | CDC S* ]* ]*
        $.MANY2(function() {
            $.SUBRULE($.contents)
        })
    });

    this.charsetHeader = this.RULE('charsetHeader', function() {
        $.CONSUME(CharsetSym)
        $.CONSUME(StringLiteral)
        $.CONSUME(SemiColon)
    })

    this.contents = this.RULE('contents', function() {
        // @formatter:off
            $.OR([
                {ALT: function() { $.SUBRULE($.ruleset)}},
                {ALT: function() { $.SUBRULE($.media)}},
                {ALT: function() { $.SUBRULE($.page)}}
            ]);
            // @formatter:on
        $.SUBRULE3($.cdcCdo)
    })

    // factor out repeating pattern for cdc/cdo
    this.cdcCdo = this.RULE('cdcCdo', function() {
        // @formatter:off
            $.MANY(function () {
                $.OR([
                    {ALT: function() { $.CONSUME(Cdo)}},
                    {ALT: function() { $.CONSUME(Cdc)}}
                ]);
            })
            // @formatter:on
    })

    // IMPORT_SYM S*
    // [STRING|URI] S* media_list? ';' S*
    this.cssImport = this.RULE('cssImport', function() {
        $.CONSUME(ImportSym)
        // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(StringLiteral)}},
                {ALT: function() { $.CONSUME(Uri)}}
            ]);
            // @formatter:on

        $.OPTION(function() {
            $.SUBRULE($.media_list)
        })

        $.CONSUME(SemiColon)
    });

    // MEDIA_SYM S* media_list '{' S* ruleset* '}' S*
    this.media = this.RULE('media', function() {
        $.CONSUME(MediaSym)
        $.SUBRULE($.media_list)
        $.CONSUME(LCurly)
        $.SUBRULE($.ruleset)
        $.CONSUME(RCurly)
    });

    // medium [ COMMA S* medium]*
    this.media_list = this.RULE('media_list', function() {
        $.SUBRULE($.medium)
        $.MANY_SEP(Comma, function() {
            $.SUBRULE2($.medium)
        })
    });

    // IDENT S*
    this.medium = this.RULE('medium', function() {
        $.CONSUME(Ident)
    });

    // PAGE_SYM S* pseudo_page?
    // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
    this.page = this.RULE('page', function() {
        $.CONSUME(PageSym)
        $.OPTION(function() {
            $.SUBRULE($.pseudo_page)
        })

        $.SUBRULE($.declarationsGroup)
    });

    // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
    // factored out repeating grammar pattern
    this.declarationsGroup = this.RULE('declarationsGroup', function() {
        $.CONSUME(LCurly)
        $.OPTION(function() {
            $.SUBRULE($.declaration)
        })

        $.MANY(function() {
            $.CONSUME(SemiColon)
            $.OPTION2(function() {
                $.SUBRULE2($.declaration)
            })
        })
        $.CONSUME(RCurly)
    });

    // ':' IDENT S*
    this.pseudo_page = this.RULE('pseudo_page', function() {
        $.CONSUME(Colon)
        $.CONSUME(Ident)
    });

    // '/' S* | ',' S*
    this.operator = this.RULE('operator', function() {
        // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Slash)}},
                {ALT: function() { $.CONSUME(Comma)}}
            ]);
            // @formatter:on
    });

    // '+' S* | '>' S*
    this.combinator = this.RULE('combinator', function() {
        // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Plus)}},
                {ALT: function() { $.CONSUME(GreaterThan)}}
            ]);
            // @formatter:on
    });

    // '-' | '+'
    this.unary_operator = this.RULE('unary_operator', function() {
        // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Minus)}},
                {ALT: function() { $.CONSUME(Plus)}}
            ]);
            // @formatter:on
    });

    // IDENT S*
    this.property = this.RULE('property', function() {
        $.CONSUME(Ident)
    });

    // selector [ ',' S* selector ]*
    // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
    this.ruleset = this.RULE('ruleset', function() {
        $.AT_LEAST_ONE_SEP(Comma, function() {
            $.SUBRULE($.selector)
        })

        $.SUBRULE($.declarationsGroup)
    });

    // simple_selector [ combinator selector | S+ [ combinator? selector ]? ]?
    this.selector = this.RULE('selector', function() {
        $.SUBRULE($.simple_selector)
        $.OPTION(function() {
            $.OPTION2(function() {
                $.SUBRULE($.combinator)
            })
            $.SUBRULE($.selector)
        })
    });

    // element_name [ HASH | class | attrib | pseudo ]*
    // | [ HASH | class | attrib | pseudo ]+
    this.simple_selector = this.RULE('simple_selector', function() {
        // @formatter:off
            $.OR([
                {ALT: function() {
                    $.SUBRULE($.element_name)
                    $.MANY(function() {
                        $.SUBRULE($.simple_selector_suffix)
                    })

                }},
                {ALT: function() {
                    $.AT_LEAST_ONE(function() {
                        $.SUBRULE2($.simple_selector_suffix)
                    }, "selector suffix")
                }}
            ]);
            // @formatter:on
    });

    // helper grammar rule to avoid repetition
    // [ HASH | class | attrib | pseudo ]+
    this.simple_selector_suffix = this.RULE('simple_selector_suffix', function() {
        // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Hash) }},
                {ALT: function() { $.SUBRULE($.class) }},
                {ALT: function() { $.SUBRULE($.attrib) }},
                {ALT: function() { $.SUBRULE($.pseudo) }}
            ]);
            // @formatter:on
    })

    // '.' IDENT
    this.class = this.RULE('class', function() {
        $.CONSUME(Dot)
        $.CONSUME(Ident)
    });

    // IDENT | '*'
    this.element_name = this.RULE('element_name', function() {
        // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Ident) }},
                {ALT: function() { $.CONSUME(Star) }}
            ]);
            // @formatter:on
    });

    // '[' S* IDENT S* [ [ '=' | INCLUDES | DASHMATCH ] S* [ IDENT | STRING ] S* ]? ']'
    this.attrib = this.RULE('attrib', function() {
        $.CONSUME(LSquare)
        $.CONSUME(Ident)

        this.OPTION(function() {
            // @formatter:off
                $.OR([
                    {ALT: function() { $.CONSUME(Equals) }},
                    {ALT: function() { $.CONSUME(Includes) }},
                    {ALT: function() { $.CONSUME(Dasmatch) }}
                ]);

                $.OR2([
                    {ALT: function() { $.CONSUME2(Ident) }},
                    {ALT: function() { $.CONSUME(StringLiteral) }}
                ]);
                // @formatter:on
        })
        $.CONSUME(RSquare)
    });

    // ':' [ IDENT | FUNCTION S* [IDENT S*]? ')' ]
    this.pseudo = this.RULE('pseudo', function() {
        $.CONSUME(Colon)
        // @formatter:off
            $.OR([
                {ALT: function() {
                    $.CONSUME(Ident)
                }},
                {ALT: function() {
                    $.CONSUME(Func)
                    $.OPTION(function() {
                        $.CONSUME2(Ident)
                    })
                    $.CONSUME(RParen)
                }}
            ]);
            // @formatter:on
    });

    // property ':' S* expr prio?
    this.declaration = this.RULE('declaration', function() {
        $.SUBRULE($.property)
        $.CONSUME(Colon)
        $.SUBRULE($.expr)

        $.OPTION(function() {
            $.SUBRULE($.prio)
        })
    });

    // IMPORTANT_SYM S*
    this.prio = this.RULE('prio', function() {
        $.CONSUME(ImportantSym)
    });

    // term [ operator? term ]*
    this.expr = this.RULE('expr', function() {
        $.SUBRULE($.term)
        $.MANY(function() {
            $.OPTION(function() {
                $.SUBRULE($.operator)
            })
            $.SUBRULE2($.term)
        })
    });

    // unary_operator?
    // [ NUMBER S* | PERCENTAGE S* | LENGTH S* | EMS S* | EXS S* | ANGLE S* |
    // TIME S* | FREQ S* ]
    // | STRING S* | IDENT S* | URI S* | hexcolor | function
    this.term = this.RULE('term', function() {
        $.OPTION(function() {
            $.SUBRULE($.unary_operator)
        })

        // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Num) }},
                {ALT: function() { $.CONSUME(Percentage) }},
                {ALT: function() { $.CONSUME(Length) }},
                {ALT: function() { $.CONSUME(Ems) }},
                {ALT: function() { $.CONSUME(Exs) }},
                {ALT: function() { $.CONSUME(Angle) }},
                {ALT: function() { $.CONSUME(Time) }},
                {ALT: function() { $.CONSUME(Freq) }},
                {ALT: function() { $.CONSUME(StringLiteral) }},
                {ALT: function() { $.CONSUME(Ident) }},
                {ALT: function() { $.CONSUME(Uri) }},
                {ALT: function() { $.SUBRULE($.hexcolor) }},
                {ALT: function() { $.SUBRULE($.cssFunction) }}
            ]);
            // @formatter:on
    });

    // FUNCTION S* expr ')' S*
    this.cssFunction = this.RULE('cssFunction', function() {
        $.CONSUME(Func)
        $.SUBRULE($.expr)
        $.CONSUME(RParen)
    });

    this.hexcolor = this.RULE('hexcolor', function() {
        $.CONSUME(Hash)
    });

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    Parser.performSelfAnalysis(this);
}

CssParser.prototype = Object.create(Parser.prototype);
CssParser.prototype.constructor = CssParser;


// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
var parser = new CssParser([]);

module.exports = function (text, lexOnly) {
    var lexResult = CssLexer.tokenize(text);
    if (lexResult.errors.length > 0) {
        throw "Lexing errors encountered " + lexResult.errors[0].message
    }

    var value
    if (!lexOnly) {
        // setting a new input will RESET the parser instance's state.
        parser.input = lexResult.tokens;

        // any top level rule may be used as an entry point
        value = parser.stylesheet();


        if (parser.errors.length > 0) {
            throw "parsing errors encountered " + parser.errors[0].message

        }
    }

    return {
        value:       value, // this is a pure grammar, the value will always be <undefined>
        lexErrors:   lexResult.errors,
        parseErrors: parser.errors
    };
};
