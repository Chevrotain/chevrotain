function initExamplesDropDown() {
    examplesDropdown.find("option").remove()
    _.forEach(_.keys(samples), function (exampleName, idx) {
        examplesDropdown.append("<option value=\"" + exampleName + "\">" + exampleName + "</option>")
    })
}


function loadExample(exampleName, firstTime) {
    var sample = samples[exampleName]
    // reduce whitespace used for Indentation, 2 spaces is also used in the code mirror editor
    var sampleText = "(" + sample.implementation.toString().replace(/    /g, "  ") + "())"
    // the users of the playground don't care about the @formatter tag of intellij...
    sampleText = sampleText.replace(/\s*\/\/ @formatter:(on|off)/g, "")
    javaScriptEditor.setValue(sampleText)
    updateSamplesDropDown()
    if (firstTime) {
        onImplementationEditorContentChange() // can't wait for debounce on the first load as loadSamples will trigger lexAndParse
    }
    loadSamples(samplesDropdown.val())
}


function loadSamples(sampleKey) {
    var exampleKey = examplesDropdown.val()
    inputEditor.setValue(samples[exampleKey].sampleInputs[sampleKey])
    parserOutput.setValue("")
}


function updateSamplesDropDown() {
    samplesDropdown.find("option").remove()
    _.forOwn(samples[examplesDropdown.val()].sampleInputs, function (exampleValue, exampleName) {
        samplesDropdown.append("<option>" + exampleName + "</option>")
    })
}


function jsonExample() {
    // ----------------- Lexer -----------------
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;

    // In ES6, custom inheritance implementation
    // (such as the one above) can be replaced
    // with a more simple: "class X extends Y"...
    var True = extendToken("True", /true/);
    var False = extendToken("False", /false/);
    var Null = extendToken("Null", /null/);
    var LCurly = extendToken("LCurly", /{/);
    var RCurly = extendToken("RCurly", /}/);
    var LSquare = extendToken("LSquare", /\[/);
    var RSquare = extendToken("RSquare", /]/);
    var Comma = extendToken("Comma", /,/);
    var Colon = extendToken("Colon", /:/);
    var StringLiteral = extendToken("StringLiteral",
        /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral",
        /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;


    var jsonTokens = [WhiteSpace, NumberLiteral, StringLiteral, RCurly, LCurly,
        LSquare, RSquare, Comma, Colon, True, False, Null];

    var ChevJsonLexer = new Lexer(jsonTokens, true);

    // Labels only affect error messages and Diagrams.
    LCurly.LABEL = "'{'";
    RCurly.LABEL = "'}'";
    LSquare.LABEL = "'['";
    RSquare.LABEL = "']'";
    Comma.LABEL = "','";
    Colon.LABEL = "':'";


    // ----------------- parser -----------------
    var Parser = chevrotain.Parser;

    function JsonParser(input) {
        Parser.call(this, input, jsonTokens, {recoveryEnabled: true});
        var $ = this;

        this.json = this.RULE("json", function () {
            // @formatter:off
            return $.OR([
                { ALT: function () { return $.SUBRULE($.object) }},
                { ALT: function () { return $.SUBRULE($.array) }}
            ]);
            // @formatter:on
        });

        this.object = this.RULE("object", function () {
            // uncomment the debugger statement and open dev tools in chrome/firefox
            // to debug the parsing flow.
            // debugger;
            var obj = {}

            $.CONSUME(LCurly);
            $.MANY_SEP(Comma, function () {
                _.assign(obj, $.SUBRULE($.objectItem));
            });
            $.CONSUME(RCurly);

            return obj;
        });


        this.objectItem = this.RULE("objectItem", function () {
            var lit, key, value, obj = {};

            lit = $.CONSUME(StringLiteral)
            $.CONSUME(Colon);
            value = $.SUBRULE($.value);

            // an empty json key is not valid, use "BAD_KEY" instead
            key = lit.isInsertedInRecovery ?
                "BAD_KEY" : lit.image.substr(1, lit.image.length - 2);
            obj[key] = value;
            return obj;
        });


        this.array = this.RULE("array", function () {
            var arr = [];
            $.CONSUME(LSquare);
            $.MANY_SEP(Comma, function () {
                arr.push($.SUBRULE($.value));
            });
            $.CONSUME(RSquare);

            return arr;
        });


        // @formatter:off
        this.value = this.RULE("value", function () {
            return $.OR([
                { ALT: function () {
                    var stringLiteral = $.CONSUME(StringLiteral).image
                    // chop of the quotation marks
                    return stringLiteral.substr(1, stringLiteral.length  - 2);
                }},
                { ALT: function () { return Number($.CONSUME(NumberLiteral).image) }},
                { ALT: function () { return $.SUBRULE($.object) }},
                { ALT: function () { return $.SUBRULE($.array) }},
                { ALT: function () {
                    $.CONSUME(True);
                    return true;
                }},
                { ALT: function () {
                    $.CONSUME(False);
                    return false;
                }},
                { ALT: function () {
                    $.CONSUME(Null);
                    return null;
                }}
            ]);
        });
        // @formatter:on

        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        Parser.performSelfAnalysis(this);
    }

    JsonParser.prototype = Object.create(Parser.prototype);
    JsonParser.prototype.constructor = JsonParser;

    // for the playground to work the returned object must contain these fields
    return {
        lexer: ChevJsonLexer,
        parser: JsonParser,
        defaultRule: "json"
    };
}

function jsonGrammarOnlyExample() {
    // ----------------- Lexer -----------------
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;

    var True = extendToken("True", /true/);
    var False = extendToken("False", /false/);
    var Null = extendToken("Null", /null/);
    var LCurly = extendToken("LCurly", /{/);
    var RCurly = extendToken("RCurly", /}/);
    var LSquare = extendToken("LSquare", /\[/);
    var RSquare = extendToken("RSquare", /]/);
    var Comma = extendToken("Comma", /,/);
    var Colon = extendToken("Colon", /:/);
    var StringLiteral = extendToken("StringLiteral",
        /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral",
        /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;


    var jsonTokens = [WhiteSpace, NumberLiteral, StringLiteral, RCurly, LCurly,
        LSquare, RSquare, Comma, Colon, True, False, Null];

    var ChevJsonLexer = new Lexer(jsonTokens, true);

    // Labels only affect error messages and Diagrams.
    LCurly.LABEL = "'{'";
    RCurly.LABEL = "'}'";
    LSquare.LABEL = "'['";
    RSquare.LABEL = "']'";
    Comma.LABEL = "','";
    Colon.LABEL = "':'";


    // ----------------- parser -----------------
    var Parser = chevrotain.Parser;

    function JsonParser(input) {
        Parser.call(this, input, jsonTokens, {recoveryEnabled: true});
        var $ = this;

        this.json = this.RULE("json", function () {
            // @formatter:off
            return $.OR([
                { ALT: function () { return $.SUBRULE($.object) }},
                { ALT: function () { return $.SUBRULE($.array) }}
            ]);
            // @formatter:on
        });

        this.object = this.RULE("object", function () {
            $.CONSUME(LCurly);
            $.MANY_SEP(Comma, function () {
                $.SUBRULE($.objectItem);
            });
            $.CONSUME(RCurly);
        });


        this.objectItem = this.RULE("objectItem", function () {
            $.CONSUME(StringLiteral)
            $.CONSUME(Colon);
            $.SUBRULE($.value);
        });


        this.array = this.RULE("array", function () {
            $.CONSUME(LSquare);
            $.MANY_SEP(Comma, function () {
                $.SUBRULE($.value);
            });
            $.CONSUME(RSquare);
        });


        // @formatter:off
        this.value = this.RULE("value", function () {
            return $.OR([
                { ALT: function () { $.CONSUME(StringLiteral) }},
                { ALT: function () { $.CONSUME(NumberLiteral) }},
                { ALT: function () { $.SUBRULE($.object) }},
                { ALT: function () { $.SUBRULE($.array) }},
                { ALT: function () { $.CONSUME(True) }},
                { ALT: function () { $.CONSUME(False) }},
                { ALT: function () { $.CONSUME(Null); }}
            ]);
        });
        // @formatter:on

        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        Parser.performSelfAnalysis(this);
    }

    JsonParser.prototype = Object.create(Parser.prototype);
    JsonParser.prototype.constructor = JsonParser;

    // for the playground to work the returned object must contain these fields
    return {
        lexer: ChevJsonLexer,
        parser: JsonParser,
        defaultRule: "json"
    };
}

function cssExample() {
    // Based on the specs in:
    // https://www.w3.org/TR/CSS21/grammar.html

    // A little mini DSL for easier lexer definition using xRegExp.
    var fragments = {}

    function FRAGMENT(name, def) {
        fragments[name] = XRegExp.build(def, fragments)
    }

    function MAKE_PATTERN(def, flags) {
        return XRegExp.build(def, fragments, flags)
    }

    // ----------------- Lexer -----------------
    var Lexer = chevrotain.Lexer;

    // A Little wrapper to save us the trouble of manually building the
    // array of cssTokens
    var cssTokens = [];
    var extendToken = function () {
        var newToken = chevrotain.extendToken.apply(null, arguments);
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
    var UriString = extendToken('UriString', MAKE_PATTERN('url\\((:?{{spaces}})?({{string1}}|{{string2}})(:?{{spaces}})?\\)'));
    var UriUrl = extendToken('UriUrl', MAKE_PATTERN('url\\((:?{{spaces}})?{{url}}(:?{{spaces}})?\\)'));
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


    var CssLexer = new Lexer(cssTokens, true);

    // ----------------- parser -----------------
    var Parser = chevrotain.Parser;

    function CssParser(input) {
        Parser.call(this, input, cssTokens,
            {recoveryEnabled: true, maxLookahead: 3});
        var $ = this;

        this.stylesheet = this.RULE('stylesheet', function () {

            // [ CHARSET_SYM STRING ';' ]?
            $.OPTION(function () {
                $.SUBRULE($.charsetHeader)
            })

            // [S|CDO|CDC]*
            $.SUBRULE($.cdcCdo)

            // [ import [ CDO S* | CDC S* ]* ]*
            $.MANY(function () {
                $.SUBRULE($.cssImport)
                $.SUBRULE2($.cdcCdo)
            })

            // [ [ ruleset | media | page ] [ CDO S* | CDC S* ]* ]*
            $.MANY2(function () {
                $.SUBRULE($.contents)
            })
        });

        this.charsetHeader = this.RULE('charsetHeader', function () {
            $.CONSUME(CharsetSym)
            $.CONSUME(StringLiteral)
            $.CONSUME(SemiColon)
        })

        this.contents = this.RULE('contents', function () {
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
        this.cdcCdo = this.RULE('cdcCdo', function () {
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
        this.cssImport = this.RULE('cssImport', function () {
            $.CONSUME(ImportSym)
            // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(StringLiteral)}},
                {ALT: function() { $.CONSUME(Uri)}}
            ]);
            // @formatter:on

            $.OPTION(function () {
                $.SUBRULE($.media_list)
            })

            $.CONSUME(SemiColon)
        });

        // MEDIA_SYM S* media_list '{' S* ruleset* '}' S*
        this.media = this.RULE('media', function () {
            $.CONSUME(MediaSym)
            $.SUBRULE($.media_list)
            $.CONSUME(LCurly)
            $.SUBRULE($.ruleset)
            $.CONSUME(RCurly)
        });

        // medium [ COMMA S* medium]*
        this.media_list = this.RULE('media_list', function () {
            $.MANY_SEP(Comma, function () {
                $.SUBRULE($.medium)
            })
        });

        // IDENT S*
        this.medium = this.RULE('medium', function () {
            $.CONSUME(Ident)
        });

        // PAGE_SYM S* pseudo_page?
        // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
        this.page = this.RULE('page', function () {
            $.CONSUME(PageSym)
            $.OPTION(function () {
                $.SUBRULE($.pseudo_page)
            })

            $.SUBRULE($.declarationsGroup)
        });

        // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
        // factored out repeating grammar pattern
        this.declarationsGroup = this.RULE('declarationsGroup', function () {
            $.CONSUME(LCurly)
            $.OPTION(function () {
                $.SUBRULE($.declaration)
            })

            $.MANY(function () {
                $.CONSUME(SemiColon)
                $.OPTION2(function () {
                    $.SUBRULE2($.declaration)
                })
            })
            $.CONSUME(RCurly)
        });

        // ':' IDENT S*
        this.pseudo_page = this.RULE('pseudo_page', function () {
            $.CONSUME(Colon)
            $.CONSUME(Ident)
        });

        // '/' S* | ',' S*
        this.operator = this.RULE('operator', function () {
            // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Slash)}},
                {ALT: function() { $.CONSUME(Comma)}}
            ]);
            // @formatter:on
        });

        // '+' S* | '>' S*
        this.combinator = this.RULE('combinator', function () {
            // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Plus)}},
                {ALT: function() { $.CONSUME(GreaterThan)}}
            ]);
            // @formatter:on
        });

        // '-' | '+'
        this.unary_operator = this.RULE('unary_operator', function () {
            // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Minus)}},
                {ALT: function() { $.CONSUME(Plus)}}
            ]);
            // @formatter:on
        });

        // IDENT S*
        this.property = this.RULE('property', function () {
            $.CONSUME(Ident)
        });

        // selector [ ',' S* selector ]*
        // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
        this.ruleset = this.RULE('ruleset', function () {
            $.MANY_SEP(Comma, function () {
                $.SUBRULE($.selector)
            })

            $.SUBRULE($.declarationsGroup)
        });

        // simple_selector [ combinator selector | S+ [ combinator? selector ]? ]?
        this.selector = this.RULE('selector', function () {
            $.SUBRULE($.simple_selector)
            $.OPTION(function () {
                $.OPTION2(function () {
                    $.SUBRULE($.combinator)
                })
                $.SUBRULE($.selector)
            })
        });

        // element_name [ HASH | class | attrib | pseudo ]*
        // | [ HASH | class | attrib | pseudo ]+
        this.simple_selector = this.RULE('simple_selector', function () {
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
                    })
                }}
            ]);
            // @formatter:on
        });

        // helper grammar rule to avoid repetition
        // [ HASH | class | attrib | pseudo ]+
        this.simple_selector_suffix = this.RULE('simple_selector_suffix', function () {
            // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Hash) }},
                {ALT: function() { $.SUBRULE($.class) }},
                {ALT: function() { $.SUBRULE($.attrib) }},
                {ALT: function() { $.SUBRULE($.pseudo) }}
            ]);
            // @formatter:off
        })

        // '.' IDENT
        this.class = this.RULE('class', function () {
            $.CONSUME(Dot)
            $.CONSUME(Ident)
        });

        // IDENT | '*'
        this.element_name = this.RULE('element_name', function () {
            // @formatter:off
            $.OR([
                {ALT: function() { $.CONSUME(Ident) }},
                {ALT: function() { $.CONSUME(Star) }}
            ]);
            // @formatter:off
        });

        // '[' S* IDENT S* [ [ '=' | INCLUDES | DASHMATCH ] S* [ IDENT | STRING ] S* ]? ']'
        this.attrib = this.RULE('attrib', function () {
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
                // @formatter:off
            })
            $.CONSUME(RSquare)
        });

        // ':' [ IDENT | FUNCTION S* [IDENT S*]? ')' ]
        this.pseudo = this.RULE('pseudo', function () {
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
        this.declaration = this.RULE('declaration', function () {
            $.SUBRULE($.property)
            $.CONSUME(Colon)
            $.SUBRULE($.expr)

            $.OPTION(function () {
                $.SUBRULE($.prio)
            })
        });

        // IMPORTANT_SYM S*
        this.prio = this.RULE('prio', function () {
            $.CONSUME(ImportantSym)
        });

        // term [ operator? term ]*
        this.expr = this.RULE('expr', function () {
            $.SUBRULE($.term)
            $.MANY(function () {
                $.OPTION(function () {
                    $.SUBRULE($.operator)
                })
                $.SUBRULE2($.term)
            })
        });

        // unary_operator?
        // [ NUMBER S* | PERCENTAGE S* | LENGTH S* | EMS S* | EXS S* | ANGLE S* |
        // TIME S* | FREQ S* ]
        // | STRING S* | IDENT S* | URI S* | hexcolor | function
        this.term = this.RULE('term', function () {
            $.OPTION(function () {
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
        this.cssFunction = this.RULE('cssFunction', function () {
            $.CONSUME(Func)
            $.SUBRULE($.expr)
            $.CONSUME(RParen)
        });

        this.hexcolor = this.RULE('hexcolor', function () {
            $.CONSUME(Hash)
        });


        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        Parser.performSelfAnalysis(this);
    }

    CssParser.prototype = Object.create(Parser.prototype);
    CssParser.prototype.constructor = CssParser;

    // for the playground to work the returned object must contain these fields
    return {
        lexer: CssLexer,
        parser: CssParser,
        defaultRule: "stylesheet"
    };
}


function calculatorExample() {
    // ----------------- lexer -----------------
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;
    var Parser = chevrotain.Parser;

    // using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
    // AdditionOperator defines a Tokens hierarchy but only leafs in this hierarchy
    // define actual Tokens that can appear in the text
    var AdditionOperator = extendToken("AdditionOperator", Lexer.NA);
    var Plus = extendToken("Plus", /\+/, AdditionOperator);
    var Minus = extendToken("Minus", /-/, AdditionOperator);

    var MultiplicationOperator = extendToken("MultiplicationOperator", Lexer.NA);
    var Multi = extendToken("Multi", /\*/, MultiplicationOperator);
    var Div = extendToken("Div", /\//, MultiplicationOperator);

    var LParen = extendToken("LParen", /\(/);
    var RParen = extendToken("RParen", /\)/);
    var NumberLiteral = extendToken("NumberLiteral", /[1-9]\d*/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    var allTokens = [WhiteSpace,
        Plus, Minus, Multi, Div, LParen, RParen,
        NumberLiteral, AdditionOperator, MultiplicationOperator];
    var CalculatorLexer = new Lexer(allTokens, true);


    // ----------------- parser -----------------
    function Calculator(input) {
        // By default if {recoveryEnabled: true} is not passed in the config object
        // error recovery / fault tolerance capabilities will be disabled
        Parser.call(this, input, allTokens);

        var $ = this;

        this.expression = $.RULE("expression", function () {
            // uncomment the debugger statement and open dev tools in chrome/firefox
            // to debug the parsing flow.
            // debugger;
            return $.SUBRULE($.additionExpression)
        });


        // Lowest precedence thus it is first in the rule chain
        // The precedence of binary expressions is determined by
        // how far down the Parse Tree the binary expression appears.
        this.additionExpression = $.RULE("additionExpression", function () {
            var value, op, rhsVal;

            // parsing part
            value = $.SUBRULE($.multiplicationExpression);
            $.MANY(function () {
                // consuming 'AdditionOperator' will consume
                // either Plus or Minus as they are subclasses of AdditionOperator
                op = $.CONSUME(AdditionOperator);
                //  the index "2" in SUBRULE2 is needed to identify the unique
                // position in the grammar during runtime
                rhsVal = $.SUBRULE2($.multiplicationExpression);

                // interpreter part
                if (op instanceof Plus) {
                    value += rhsVal
                } else { // op instanceof Minus
                    value -= rhsVal
                }
            });

            return value
        });


        this.multiplicationExpression = $.RULE("multiplicationExpression", function () {
            var value, op, rhsVal;

            // parsing part
            value = $.SUBRULE($.atomicExpression);
            $.MANY(function () {
                op = $.CONSUME(MultiplicationOperator);
                //  the index "2" in SUBRULE2 is needed to identify the unique
                // position in the grammar during runtime
                rhsVal = $.SUBRULE2($.atomicExpression);

                // interpreter part
                if (op instanceof Multi) {
                    value *= rhsVal
                } else { // op instanceof Div
                    value /= rhsVal
                }
            });

            return value
        });


        this.atomicExpression = $.RULE("atomicExpression", function () {
            // @formatter:off
            return $.OR([
                // parenthesisExpression has the highest precedence and thus it
                // appears in the "lowest" leaf in the expression ParseTree.
                {ALT: function(){ return $.SUBRULE($.parenthesisExpression)}},
                {ALT: function(){ return parseInt($.CONSUME(NumberLiteral).image, 10)}}
            ]);
            // @formatter:on
        });


        this.parenthesisExpression = $.RULE("parenthesisExpression", function () {
            var expValue;

            $.CONSUME(LParen);
            expValue = $.SUBRULE($.expression);
            $.CONSUME(RParen);

            return expValue
        });

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    // avoids inserting number literals as these have a additional meaning.
    // and we can never choose the "right meaning".
    // For example: a Comma has just one meaning, but a Number may be any of:
    // 1,2,3,...n, 0.4E+3 which value should we used when inserting... ?
    Calculator.prototype.canTokenTypeBeInsertedInRecovery = function (tokClass) {
        return tokClass !== NumberLiteral
    };


    Calculator.prototype = Object.create(Parser.prototype);
    Calculator.prototype.constructor = Calculator;

    // for the playground to work the returned object must contain these fields
    return {
        lexer: CalculatorLexer,
        parser: Calculator,
        defaultRule: "expression"
    };
}


function tutorialLexerExample() {
    // Written Docs for this tutorial step can be found here:
    // https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step1_lexing.md

    // Tutorial Step 1:
    // Implementation of A lexer for a simple SELECT statement grammar
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;

    // extendToken is used to create a constructor for a Token class
    // The Lexer's output will contain an array of
    // instances created by these constructors
    var Select = extendToken("Select", /SELECT/);
    var From = extendToken("From", /FROM/);
    var Where = extendToken("Where", /WHERE/);
    var Comma = extendToken("Comma", /,/);
    var Identifier = extendToken("identifier", /\w+/);
    var Integer = extendToken("Integer", /0|[1-9]\d+/);
    var GreaterThan = extendToken("GreaterThan", /</);
    var LessThan = extendToken("LessThan", />/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    var allTokens = [WhiteSpace, Select, From, Where, Comma,
        Identifier, Integer, GreaterThan, LessThan];

    var SelectLexer = new Lexer(allTokens, true);

    return {
        // because only a lexer is returned the output will display
        // the Lexed token array.
        lexer: SelectLexer
    };
}

// TODO: avoid duplication of code from step 1
function tutorialGrammarExample() {
    // Written Docs for this tutorial step can be found here:
    // https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md

    // Tutorial Step 2:

    // Adding a Parser (grammar only, only reads the input
    // without any actions) using the Tokens defined in the previous step.
    // modification to the grammar will be displayed in the syntax diagrams panel.

    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;
    var Parser = chevrotain.Parser;

    var Select = extendToken("Select", /SELECT/);
    var From = extendToken("From", /FROM/);
    var Where = extendToken("Where", /WHERE/);
    var Comma = extendToken("Comma", /,/);
    var Identifier = extendToken("Identifier", /\w+/);
    var Integer = extendToken("Integer", /0|[1-9]\d+/);
    var GreaterThan = extendToken("GreaterThan", /</);
    var LessThan = extendToken("LessThan", />/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    var allTokens = [WhiteSpace, Select, From, Where, Comma,
        Identifier, Integer, GreaterThan, LessThan];
    var SelectLexer = new Lexer(allTokens, true);


    // ----------------- parser -----------------
    function SelectParser(input) {
        // By default if {recoveryEnabled: true} is not passed in the config object
        // error recovery / fault tolerance capabilities will be disabled
        Parser.call(this, input, allTokens);
        var $ = this;


        this.selectStatement = $.RULE("selectStatement", function () {
            $.SUBRULE($.selectClause)
            $.SUBRULE($.fromClause)
            $.OPTION(function () {
                $.SUBRULE($.whereClause)
            })
        });


        this.selectClause = $.RULE("selectClause", function () {
            $.CONSUME(Select);
            $.AT_LEAST_ONE_SEP(Comma, function () {
                $.CONSUME(Identifier);
            });
        });


        this.fromClause = $.RULE("fromClause", function () {
            $.CONSUME(From);
            $.CONSUME(Identifier);

            // example:
            // replace the contents of this rule with the commented out lines
            // below to implement multiple tables to select from (implicit join).

            //$.CONSUME(From);
            //$.AT_LEAST_ONE_SEP(Comma, function () {
            //    $.CONSUME(Identifier);
            //});
        });


        this.whereClause = $.RULE("whereClause", function () {
            $.CONSUME(Where)
            $.SUBRULE($.expression)
        });


        this.expression = $.RULE("expression", function () {
            $.SUBRULE($.atomicExpression);
            $.SUBRULE($.relationalOperator);
            $.SUBRULE2($.atomicExpression); // note the '2' suffix to distinguish
                                            // from the 'SUBRULE(atomicExpression)'
                                            // 2 lines above.
        });


        this.atomicExpression = $.RULE("atomicExpression", function () {
            // @formatter:off
            $.OR([
                {ALT: function(){ $.CONSUME(Integer)}},
                {ALT: function(){ $.CONSUME(Identifier)}}
            ]);
            // @formatter:on
        });


        this.relationalOperator = $.RULE("relationalOperator", function () {
            // @formatter:off
            $.OR([
                {ALT: function(){ $.CONSUME(GreaterThan)}},
                {ALT: function(){ $.CONSUME(LessThan)}}
            ]);
            // @formatter:on
        });


        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    SelectParser.prototype = Object.create(Parser.prototype);
    SelectParser.prototype.constructor = SelectParser;

    return {
        lexer: SelectLexer,
        parser: SelectParser,
        defaultRule: "selectStatement"
    };
}

function tutorialGrammarActionsExample() {
    // Written Docs for this tutorial step can be found here:
    // https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step3_adding_actions.md

    // Tutorial Step 3:

    // Adding grammar action to build an AST instead of just reading the input.
    // The output AST can be observed in the output panel.

    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;
    var Parser = chevrotain.Parser;

    var Select = extendToken("Select", /SELECT/);
    var From = extendToken("From", /FROM/);
    var Where = extendToken("Where", /WHERE/);
    var Comma = extendToken("Comma", /,/);
    var Identifier = extendToken("Identifier", /\w+/);
    var Integer = extendToken("Integer", /0|[1-9]\d+/);
    var GreaterThan = extendToken("GreaterThan", /</);
    var LessThan = extendToken("LessThan", />/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    var allTokens = [WhiteSpace, Select, From, Where, Comma,
        Identifier, Integer, GreaterThan, LessThan];
    var SelectLexer = new Lexer(allTokens, true);


    // ----------------- parser -----------------
    function SelectParser(input) {
        Parser.call(this, input, allTokens);
        var $ = this;


        this.selectStatement = $.RULE("selectStatement", function () {
            var select, from, where
            select = $.SUBRULE($.selectClause)
            from = $.SUBRULE($.fromClause)
            $.OPTION(function () {
                where = $.SUBRULE($.whereClause)
            })

            // a parsing rule may return a value.
            // In this case our AST is is a simple javascript object.
            // Generally the returned value may be any javascript value.
            return {
                type: "SELECT_STMT", selectClause: select,
                fromClause: from, whereClause: where
            }
        });


        this.selectClause = $.RULE("selectClause", function () {
            var columns = []

            $.CONSUME(Select);
            $.AT_LEAST_ONE_SEP(Comma, function () {
                // accessing a token's string via .image property
                columns.push($.CONSUME(Identifier).image);
            });

            return {type: "SELECT_CLAUSE", columns: columns}
        });


        this.fromClause = $.RULE("fromClause", function () {
            var table

            $.CONSUME(From);
            table = $.CONSUME(Identifier).image;

            return {type: "FROM_CLAUSE", table: table}
        });


        this.whereClause = $.RULE("whereClause", function () {
            var condition
            // uncomment the debugger statement and open dev tools in chrome/firefox
            // to debug the parsing flow.
            // debugger;

            $.CONSUME(Where)
            // a SUBRULE call will return the value the called rule returns.
            condition = $.SUBRULE($.expression)

            return {type: "WHERE_CLAUSE", condition: condition}
        });


        this.expression = $.RULE("expression", function () {
            var lhs, operator, rhs

            lhs = $.SUBRULE($.atomicExpression);
            operator = $.SUBRULE($.relationalOperator);
            rhs = $.SUBRULE2($.atomicExpression);

            return {type: "EXPRESSION", lhs: lhs, operator: operator, rhs: rhs}
        });


        this.atomicExpression = $.RULE("atomicExpression", function () {
            // @formatter:off
            return $.OR([ // OR returns the value of the chosen alternative.
                {ALT: function(){ return $.CONSUME(Integer)}},
                {ALT: function(){ return $.CONSUME(Identifier)}}
            ]).image;
            // @formatter:on
        });


        this.relationalOperator = $.RULE("relationalOperator", function () {
            // @formatter:off
            return $.OR([
                {ALT: function(){ return $.CONSUME(GreaterThan)}},
                {ALT: function(){ return $.CONSUME(LessThan)}}
            ]).image;
            // @formatter:on
        });


        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    SelectParser.prototype = Object.create(Parser.prototype);
    SelectParser.prototype.constructor = SelectParser;

    return {
        lexer: SelectLexer,
        parser: SelectParser,
        defaultRule: "selectStatement"
    };
}

function tutorialErrorRecoveryExample() {
    // Written Docs for this tutorial step can be found here:
    // https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step4_fault_tolerance.md

    // ----------------- Lexer -----------------
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;

    // In ES6, custom inheritance implementation
    // (such as the one above) can be replaced
    // with a more simple: "class X extends Y"...
    var True = extendToken("True", /true/);
    var False = extendToken("False", /false/);
    var Null = extendToken("Null", /null/);
    var LCurly = extendToken("LCurly", /{/);
    var RCurly = extendToken("RCurly", /}/);
    var LSquare = extendToken("LSquare", /\[/);
    var RSquare = extendToken("RSquare", /]/);
    var Comma = extendToken("Comma", /,/);
    var Colon = extendToken("Colon", /:/);
    var StringLiteral = extendToken("StringLiteral",
        /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral",
        /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;


    var jsonTokens = [WhiteSpace, NumberLiteral, StringLiteral, RCurly, LCurly,
        LSquare, RSquare, Comma, Colon, True, False, Null];

    var ChevJsonLexer = new Lexer(jsonTokens, true);

    // ----------------- parser -----------------
    var Parser = chevrotain.Parser;

    function JsonParser(input) {
        // change to false to completely disable error recovery.
        var isRecoveryEnabled = true
        Parser.call(this, input, jsonTokens, {recoveryEnabled: isRecoveryEnabled});
        var $ = this;

        this.json = this.RULE("json", function () {
            // @formatter:off
            return $.OR([
                { ALT: function () { return $.SUBRULE($.object) }},
                { ALT: function () { return $.SUBRULE($.array) }}
            ]);
            // @formatter:on
        });

        this.object = this.RULE("object", function () {
            // uncomment the debugger statement and open dev tools in chrome/firefox
            // to debug the parsing flow.
            // debugger;
            var obj = {}

            $.CONSUME(LCurly);
            $.MANY_SEP(Comma, function () {
                _.assign(obj, $.SUBRULE($.objectItem));
            });
            $.CONSUME(RCurly);

            return obj;
        });


        function invalidObjectItem() {
            return {ALARM: "recovered objectItem"}
        }

        this.objectItem = this.RULE("objectItem", function () {
            var lit, key, value, obj = {};

            lit = $.CONSUME(StringLiteral)
            $.CONSUME(Colon);
            value = $.SUBRULE($.value);

            // an empty json key is not valid, use "BAD_KEY" instead
            key = lit.isInsertedInRecovery ?
                "BAD_KEY" : lit.image.substr(1, lit.image.length - 2);
            obj[key] = value;
            return obj;

            // CUSTOM returned value from recovered production:
            // <InvalidObjectItem> will be invoked to replace the returned value of objectItem in case of
            // between rules re-sync recovery.
        }, {recoveryValueFunc: invalidObjectItem});


        this.array = this.RULE("array", function () {
            var arr = [];
            $.CONSUME(LSquare);
            $.MANY_SEP(Comma, function () {
                arr.push($.SUBRULE($.value));
            });
            $.CONSUME(RSquare);

            return arr;
        });


        // @formatter:off
        this.value = this.RULE("value", function () {
            return $.OR([
                { ALT: function () {
                    var stringLiteral = $.CONSUME(StringLiteral).image
                    // chop of the quotation marks
                    return stringLiteral.substr(1, stringLiteral.length  - 2);
                }},
                { ALT: function () { return Number($.CONSUME(NumberLiteral).image) }},
                { ALT: function () { return $.SUBRULE($.object) }},
                { ALT: function () { return $.SUBRULE($.array) }},
                { ALT: function () {
                    $.CONSUME(True);
                    return true;
                }},
                { ALT: function () {
                    $.CONSUME(False);
                    return false;
                }},
                { ALT: function () {
                    $.CONSUME(Null);
                    return null;
                }}
            ]);
        });
        // @formatter:on

        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        Parser.performSelfAnalysis(this);
    }

    JsonParser.prototype = Object.create(Parser.prototype);
    JsonParser.prototype.constructor = JsonParser;

    // customize the allowed types of tokens which are allowed to be inserted in single token insertion
    JsonParser.prototype.canTokenTypeBeInsertedInRecovery = function (tokClass) {
        // comment in to disable insertion for colons
        // if (tokClass === Colon) {
        //     return false;
        // }

        return true;
    }

    // for the playground to work the returned object must contain these fields
    return {
        lexer: ChevJsonLexer,
        parser: JsonParser,
        defaultRule: "json"
    };
}

var samples = {

    "JSON grammar only": {
        implementation: jsonGrammarOnlyExample,
        sampleInputs: {
            'valid': '{' +
            '\n\t"firstName": "John",' +
            '\n\t"lastName": "Smith",' +
            '\n\t"isAlive": true,' +
            '\n\t"age": 25' +
            '\n}',

            'missing colons': '{' +
            '\n\t"look" "mom",' +
            '\n\t"no" "colons",' +
            '\n\t"!" "success!",' +
            '\n}',

            'missing value': '{' +
            '\n\t"the": "dog",' +
            '\n\t"ate": "my",' +
            '\n\t"will be lost in recovery":,' +
            '\n\t"value": "success!"' +
            '\n}',

            'too many commas': '{' +
            '\n\t"three commas" : 3,,,' +
            '\n\t"five commas": 5,,,,,' +
            '\n\t"!" : "success"' +
            '\n}',

            'missing comma': '{' +
            '\n\t"missing ": "comma->" ' +
            '\n\t"I will be lost in": "recovery", ' +
            '\n\t"but I am still": "here",' +
            '\n\t"partial success": "only one property lost"' +
            '\n}',

            'missing comma in array': '{' +
            '\n\t"name" : "Bobby",' +
            '\n\t"children ages" : [1, 2 3, 4],' +
            '\n\t"partial success": "only one array element lost"' +
            '\n}'
        }
    },

    "JSON grammar and actions": {
        implementation: jsonExample,
        sampleInputs: {
            'valid': '{' +
            '\n\t"firstName": "John",' +
            '\n\t"lastName": "Smith",' +
            '\n\t"isAlive": true,' +
            '\n\t"age": 25' +
            '\n}',

            'missing colons': '{' +
            '\n\t"look" "mom",' +
            '\n\t"no" "colons",' +
            '\n\t"!" "success!",' +
            '\n}',

            'missing value': '{' +
            '\n\t"the": "dog",' +
            '\n\t"ate": "my",' +
            '\n\t"will be lost in recovery":,' +
            '\n\t"value": "success!"' +
            '\n}',

            'too many commas': '{' +
            '\n\t"three commas" : 3,,,' +
            '\n\t"five commas": 5,,,,,' +
            '\n\t"!" : "success"' +
            '\n}',

            'missing comma': '{' +
            '\n\t"missing ": "comma->" ' +
            '\n\t"I will be lost in": "recovery", ' +
            '\n\t"but I am still": "here",' +
            '\n\t"partial success": "only one property lost"' +
            '\n}',

            'missing comma in array': '{' +
            '\n\t"name" : "Bobby",' +
            '\n\t"children ages" : [1, 2 3, 4],' +
            '\n\t"partial success": "only one array element lost"' +
            '\n}'
        }
    },
    
    calculator: {
        implementation: calculatorExample,
        sampleInputs: {
            "parenthesis precedence": "2 * ( 3 + 7)",
            "operator precedence": "2 + 4 * 5 / 10",
            "unidentified Token - success": "1 + @@1 + 1"
        }
    },

    CSS: {
        implementation: cssExample,
        sampleInputs: {
            simpleCss: "@charset \"UTF-8\";\r\n\/* CSS Document *\/\r\n\r\n\/** Structure *\/\r\nbody" +
            " {\r\n  font-family: Arial, sans-serif;\r\n  margin: 0;\r\n  font-size: 14px;\r\n}\r\n\r\n#system-error" +
            " {\r\n  font-size: 1.5em;\r\n  text-align: center;\r\n}",


            "won't stop on first error": "@charset \"UTF-8\";\r\n\/* CSS Document *\/\r\n\r\n\/** Structure *\/\r\nbody" +
            " {\r\n  font-family Arial, sans-serif;\r\n  margin: 0;\r\n  font-size: 14px;\r\n}\r\n\r\n#system-error" +
            " {\r\n  font-size 1.5em;\r\n  text-align: center;\r\n}"
        }
    },

    "tutorial lexer": {
        implementation: tutorialLexerExample,
        sampleInputs: {
            "valid": "SELECT name, age FROM students WHERE age > 22",
            "invalid tokens": "SELECT lastName, wage #$@#$ FROM employees ? WHERE wage > 666"
        }
    },

    "tutorial grammar": {
        implementation: tutorialGrammarExample,
        sampleInputs: {
            "valid": "SELECT name, age FROM students WHERE age > 22",
            "invalid tokens": "SELECT lastName, wage #$@#$ FROM employees ? WHERE wage > 666"
        }
    },

    "tutorial actions": {
        implementation: tutorialGrammarActionsExample,
        sampleInputs: {
            "valid": "SELECT name, age FROM students WHERE age > 22",
            "invalid tokens": "SELECT lastName, wage #$@#$ FROM employees ? WHERE wage > 666"
        }
    },

    "tutorial fault tolerance": {
        implementation: tutorialErrorRecoveryExample,
        sampleInputs: {
            "single token insertion": '{ "key"   666}',
            "single token deletion": '{ "key" }: 666}',
            "in rule repetition re-sync recovery:": '{\n"key1" : 1, \n"key2" : 2 666 \n"key3"  : 3, \n"key4"  : 4 }',
            "between rules re-sync recovery": '{ \n"firstName": "John",\n "someData": { "bad" :: "part" }, \n "isAlive": true, \n"age": 25 }'
        }
    }
}

