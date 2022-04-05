function initExamplesDropDown() {
    examplesDropdown.find("option").remove()
    _.forEach(_.keys(samples), (exampleName, idx) => {
        examplesDropdown.append("<option value=\"" + exampleName + "\">" + exampleName + "</option>")
    })
}


function loadExample(exampleName, firstTime) {
    const sample = samples[exampleName];
    // reduce whitespace used for Indentation, 2 spaces is also used in the code mirror editor
    let sampleText = "(" + sample.implementation.toString().replace(/    /g, "  ") + "())";
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
    const exampleKey = examplesDropdown.val();
    inputEditor.setValue(samples[exampleKey].sampleInputs[sampleKey])
    parserOutput.setValue("")
}


function updateSamplesDropDown() {
    samplesDropdown.find("option").remove()
    _.forOwn(samples[examplesDropdown.val()].sampleInputs, (exampleValue, exampleName) => {
        samplesDropdown.append("<option>" + exampleName + "</option>")
    })
}


function jsonExample() {
    // ----------------- Lexer -----------------
    const createToken = chevrotain.createToken;
    const Lexer = chevrotain.Lexer;

    // In ES6, custom inheritance implementation
    // (such as the one above) can be replaced
    // with a more simple: "class X extends Y"...
    const True = createToken({name: "True", pattern: /true/});
    const False = createToken({name: "False", pattern: /false/});
    const Null = createToken({name: "Null", pattern: /null/});
    const LCurly = createToken({name: "LCurly", pattern: /{/});
    const RCurly = createToken({name: "RCurly", pattern: /}/});
    const LSquare = createToken({name: "LSquare", pattern: /\[/});
    const RSquare = createToken({name: "RSquare", pattern: /]/});
    const Comma = createToken({name: "Comma", pattern: /,/});
    const Colon = createToken({name: "Colon", pattern: /:/});
    const StringLiteral = createToken({
        name: "StringLiteral", pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
    });
    const NumberLiteral = createToken({
        name: "NumberLiteral", pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
    });
    const WhiteSpace = createToken({
        name: "WhiteSpace", pattern: /\s+/,
        group: Lexer.SKIPPED
    });


    const jsonTokens = [WhiteSpace, NumberLiteral, StringLiteral, RCurly, LCurly,
        LSquare, RSquare, Comma, Colon, True, False, Null];

    const JsonLexer = new Lexer(jsonTokens);

    // Labels only affect error messages and Diagrams.
    LCurly.LABEL = "'{'";
    RCurly.LABEL = "'}'";
    LSquare.LABEL = "'['";
    RSquare.LABEL = "']'";
    Comma.LABEL = "','";
    Colon.LABEL = "':'";


    // ----------------- parser -----------------
    const EmbeddedActionsParser = chevrotain.EmbeddedActionsParser;

    class JsonParser extends EmbeddedActionsParser {
        constructor() {
            super(jsonTokens, {recoveryEnabled: true, outputCst: false})

            const $ = this;

            $.RULE("json", () => $.OR([
                {ALT: () => $.SUBRULE($.object)},
                {ALT: () => $.SUBRULE($.array)}
            ]));

            $.RULE("object", () => {
                // uncomment the debugger statement and open dev tools in chrome/firefox
                // to debug the parsing flow.
                // debugger;
                const obj = {};

                $.CONSUME(LCurly);
                $.MANY_SEP({
                    SEP: Comma, DEF: () => {
                        _.assign(obj, $.SUBRULE($.objectItem));
                    }
                });
                $.CONSUME(RCurly);

                return obj;
            });


            $.RULE("objectItem", () => {
                let lit, key, value;
                const obj = {};

                lit = $.CONSUME(StringLiteral)
                $.CONSUME(Colon);
                value = $.SUBRULE($.value);

                // an empty json key is not valid, use "BAD_KEY" instead
                key = lit.isInsertedInRecovery ?
                    "BAD_KEY" : lit.image.substr(1, lit.image.length - 2);
                obj[key] = value;
                return obj;
            });


            $.RULE("array", () => {
                const arr = [];
                $.CONSUME(LSquare);
                $.MANY_SEP({
                    SEP: Comma, DEF: () => {
                        arr.push($.SUBRULE($.value));
                    }
                });
                $.CONSUME(RSquare);

                return arr;
            });


            // @formatter:off
            $.RULE("value", () => $.OR([
                { ALT: () => {
                    const stringLiteral = $.CONSUME(StringLiteral).image;
                    // chop of the quotation marks
                    return stringLiteral.substr(1, stringLiteral.length  - 2);
                }},
                { ALT: () => Number($.CONSUME(NumberLiteral).image)},
                { ALT: () => $.SUBRULE($.object)},
                { ALT: () => $.SUBRULE($.array)},
                { ALT: () => {
                    $.CONSUME(True);
                    return true;
                }},
                { ALT: () => {
                    $.CONSUME(False);
                    return false;
                }},
                { ALT: () => {
                    $.CONSUME(Null);
                    return null;
                }}
            ]));
            // @formatter:on

            // very important to call this after all the rules have been setup.
            // otherwise the parser may not work correctly as it will lack information
            // derived from the self analysis.
            this.performSelfAnalysis();
        }

    }

    // for the playground to work the returned object must contain these fields
    return {
        lexer: JsonLexer,
        parser: JsonParser,
        defaultRule: "json"
    };
}

function jsonGrammarOnlyExample() {
    // ----------------- Lexer -----------------
    const createToken = chevrotain.createToken;
    const Lexer = chevrotain.Lexer;

    const True = createToken({name: "True", pattern: /true/});
    const False = createToken({name: "False", pattern: /false/});
    const Null = createToken({name: "Null", pattern: /null/});
    const LCurly = createToken({name: "LCurly", pattern: /{/});
    const RCurly = createToken({name: "RCurly", pattern: /}/});
    const LSquare = createToken({name: "LSquare", pattern: /\[/});
    const RSquare = createToken({name: "RSquare", pattern: /]/});
    const Comma = createToken({name: "Comma", pattern: /,/});
    const Colon = createToken({name: "Colon", pattern: /:/});
    const StringLiteral = createToken({
        name: "StringLiteral", pattern: /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
    });
    const NumberLiteral = createToken({
        name: "NumberLiteral", pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
    });
    const WhiteSpace = createToken({
        name: "WhiteSpace",
        pattern: /\s+/,
        group: Lexer.SKIPPED
    });

    const jsonTokens = [WhiteSpace, NumberLiteral, StringLiteral, RCurly, LCurly,
        LSquare, RSquare, Comma, Colon, True, False, Null];

    const JsonLexer = new Lexer(jsonTokens, {
        // Less position info tracked, reduces verbosity of the playground output.
        positionTracking: "onlyStart"
    });

    // Labels only affect error messages and Diagrams.
    LCurly.LABEL = "'{'";
    RCurly.LABEL = "'}'";
    LSquare.LABEL = "'['";
    RSquare.LABEL = "']'";
    Comma.LABEL = "','";
    Colon.LABEL = "':'";


    // ----------------- parser -----------------
    const CstParser = chevrotain.CstParser;

    class JsonParser extends CstParser {
        constructor() {
            super(jsonTokens, {
                recoveryEnabled: true
            })

            const $ = this;

            $.RULE("json", () => {
                $.OR([
                    {ALT: () => $.SUBRULE($.object)},
                    {ALT: () => $.SUBRULE($.array)}
                ]);
            });

            $.RULE("object", () => {
                $.CONSUME(LCurly);
                $.MANY_SEP({
                    SEP: Comma, DEF: () => {
                        $.SUBRULE($.objectItem);
                    }
                });
                $.CONSUME(RCurly);
            });


            $.RULE("objectItem", () => {
                $.CONSUME(StringLiteral)
                $.CONSUME(Colon);
                $.SUBRULE($.value);
            });


            $.RULE("array", () => {
                $.CONSUME(LSquare);
                $.MANY_SEP({
                    SEP: Comma, DEF: () => {
                        $.SUBRULE($.value);
                    }
                });
                $.CONSUME(RSquare);
            });


            $.RULE("value", () => {
                $.OR([
                    {ALT: () => $.CONSUME(StringLiteral)},
                    {ALT: () => $.CONSUME(NumberLiteral)},
                    {ALT: () => $.SUBRULE($.object)},
                    {ALT: () => $.SUBRULE($.array)},
                    {ALT: () => $.CONSUME(True)},
                    {ALT: () => $.CONSUME(False)},
                    {ALT: () => $.CONSUME(Null)}
                ]);
            });

            // very important to call this after all the rules have been setup.
            // otherwise the parser may not work correctly as it will lack information
            // derived from the self analysis.
            this.performSelfAnalysis();
        }

    }

    // for the playground to work the returned object must contain these fields
    return {
        lexer: JsonLexer,
        parser: JsonParser,
        defaultRule: "json"
    };
}

function cssExample() {
    // Based on the specs in:
    // https://www.w3.org/TR/CSS21/grammar.html

    // A little mini DSL for easier lexer definition using xRegExp.
    const fragments = {};

    function FRAGMENT(name, def) {
        fragments[name] = XRegExp.build(def, fragments)
    }

    function MAKE_PATTERN(def, flags) {
        return XRegExp.build(def, fragments, flags)
    }

    // ----------------- Lexer -----------------
    const Lexer = chevrotain.Lexer;

    // A Little wrapper to save us the trouble of manually building the
    // array of cssTokens
    const cssTokens = [];
    const createToken = (config) => {
        const newToken = chevrotain.createToken(config);
        cssTokens.push(newToken);
        return newToken;
    };

    // The order of fragments definitions is important
    FRAGMENT('nl', '\\n|\\r|\\f');
    FRAGMENT('h', '[0-9a-f]');
    FRAGMENT('nonascii', '[\\u0240-\\uffff]');
    FRAGMENT('unicode', '{{h}}{1,6}');
    FRAGMENT('escape', '{{unicode}}|\\\\[^\\r\\n\\f0-9a-f]');
    FRAGMENT('nmstart', '[_a-zA-Z]|{{nonascii}}|{{escape}}');
    FRAGMENT('nmchar', '[_a-zA-Z0-9-]|{{nonascii}}|{{escape}}');
    FRAGMENT('string1', '\\"([^\\n\\r\\f\\"]|{{nl}}|{{escape}})*\\"');
    FRAGMENT('string2', "\\'([^\\n\\r\\f\\']|{{nl}}|{{escape}})*\\'");
    FRAGMENT('comment', '\\/\\*[^*]*\\*+([^/*][^*]*\\*+)*\\/');
    FRAGMENT("name", "({{nmchar}})+");
    FRAGMENT("url", "([!#\\$%&*-~]|{{nonascii}}|{{escape}})*");
    FRAGMENT("spaces", "[ \\t\\r\\n\\f]+");
    FRAGMENT("ident", "-?{{nmstart}}{{nmchar}}*");
    FRAGMENT("num", "[0-9]+|[0-9]*\\.[0-9]+");

    const Whitespace = createToken({
        name: 'Whitespace',
        pattern: MAKE_PATTERN('{{spaces}}'),
        group: Lexer.SKIPPED
    });
    const Comment = createToken({
        name: 'Comment',
        pattern: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//,
        // the W3C specs are are defined in a whitespace sensitive manner.
        // but this grammar is not
        // TODO: there is actually one place in the CSS grammar where whitespace is meaningful.
        group: Lexer.SKIPPED
    });

    // This group has to be defined BEFORE Ident as their prefix is a valid Ident
    const Uri = createToken({name: 'Uri', pattern: Lexer.NA});
    const UriString = createToken({
        name: 'UriString',
        pattern: MAKE_PATTERN('url\\((:?{{spaces}})?({{string1}}|{{string2}})(:?{{spaces}})?\\)')
    });
    const UriUrl = createToken({
        name: 'UriUrl',
        pattern: MAKE_PATTERN('url\\((:?{{spaces}})?{{url}}(:?{{spaces}})?\\)')
    });
    const Func = createToken({name: 'Func', pattern: MAKE_PATTERN('{{ident}}\\(')});


    const Cdo = createToken({name: 'Cdo', pattern: /<!--/});
    // Cdc must be before Minus
    const Cdc = createToken({name: 'Cdc', pattern: /-->/});
    const Includes = createToken({name: 'Includes', pattern: /~=/});
    const Dasmatch = createToken({name: 'Dasmatch', pattern: /\|=/});
    const Exclamation = createToken({name: 'Exclamation', pattern: /!/});
    const Dot = createToken({name: 'Dot', pattern: /\./});
    const LCurly = createToken({name: 'LCurly', pattern: /{/});
    const RCurly = createToken({name: 'RCurly', pattern: /}/});
    const LSquare = createToken({name: 'LSquare', pattern: /\[/});
    const RSquare = createToken({name: 'RSquare', pattern: /]/});
    const LParen = createToken({name: 'LParen', pattern: /\(/});
    const RParen = createToken({name: 'RParen', pattern: /\)/});
    const Comma = createToken({name: 'Comma', pattern: /,/});
    const Colon = createToken({name: 'Colon', pattern: /:/});
    const SemiColon = createToken({name: 'SemiColon', pattern: /;/});
    const Equals = createToken({name: 'Equals', pattern: /=/});
    const Star = createToken({name: 'Star', pattern: /\*/});
    const Plus = createToken({name: 'Plus', pattern: /\+/});
    const GreaterThan = createToken({name: 'GreaterThan', pattern: />/});
    const Slash = createToken({name: 'Slash', pattern: /\//});

    const StringLiteral = createToken({name: 'StringLiteral', pattern: MAKE_PATTERN('{{string1}}|{{string2}}')});
    const Hash = createToken({name: 'Hash', pattern: MAKE_PATTERN('#{{name}}')});

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
    const ImportSym = createToken({name: 'ImportSym', pattern: /@import/i});
    const PageSym = createToken({name: 'PageSym', pattern: /@page/i});
    const MediaSym = createToken({name: 'MediaSym', pattern: /@media/i});
    const CharsetSym = createToken({name: 'CharsetSym', pattern: /@charset/i});
    const ImportantSym = createToken({name: 'ImportantSym', pattern: /important/i});


    const Ems = createToken({name: 'Ems', pattern: MAKE_PATTERN('{{num}}em', 'i')});
    const Exs = createToken({name: 'Exs', pattern: MAKE_PATTERN('{{num}}ex', 'i')});

    const Length = createToken({name: 'Length', pattern: Lexer.NA});
    const Px = createToken({name: 'Px', pattern: MAKE_PATTERN('{{num}}px', 'i'), categories: Length});
    const Cm = createToken({name: 'Cm', pattern: MAKE_PATTERN('{{num}}cm', 'i'), categories: Length});
    const Mm = createToken({name: 'Mm', pattern: MAKE_PATTERN('{{num}}mm', 'i'), categories: Length});
    const In = createToken({name: 'In', pattern: MAKE_PATTERN('{{num}}in', 'i'), categories: Length});
    const Pt = createToken({name: 'Pt', pattern: MAKE_PATTERN('{{num}}pt', 'i'), categories: Length});
    const Pc = createToken({name: 'Pc', pattern: MAKE_PATTERN('{{num}}pc', 'i'), categories: Length});

    const Angle = createToken({name: 'Angle', pattern: Lexer.NA});
    const Deg = createToken({name: 'Deg', pattern: MAKE_PATTERN('{{num}}deg', 'i'), categories: Angle});
    const Rad = createToken({name: 'Rad', pattern: MAKE_PATTERN('{{num}}rad', 'i'), categories: Angle});
    const Grad = createToken({name: 'Grad', pattern: MAKE_PATTERN('{{num}}grad', 'i'), categories: Angle});

    const Time = createToken({name: 'Time', pattern: Lexer.NA});
    const Ms = createToken({name: 'Ms', pattern: MAKE_PATTERN('{{num}}ms', 'i'), categories: Time});
    const Sec = createToken({name: 'Sec', pattern: MAKE_PATTERN('{{num}}sec', 'i'), categories: Time});

    const Freq = createToken({name: 'Freq', pattern: Lexer.NA});
    const Hz = createToken({name: 'Hz', pattern: MAKE_PATTERN('{{num}}hz', 'i'), categories: Freq});
    const Khz = createToken({name: 'Khz', pattern: MAKE_PATTERN('{{num}}khz', 'i'), categories: Freq});

    const Percentage = createToken({name: 'Percentage', pattern: MAKE_PATTERN('{{num}}%', 'i')});

    // Num must appear after all the num forms with a suffix
    const Num = createToken({name: 'Num', pattern: MAKE_PATTERN('{{num}}')});

    // Ident must be before Minus
    const Ident = createToken({name: 'Ident', pattern: MAKE_PATTERN('{{ident}}')});
    const Minus = createToken({name: 'Minus', pattern: /-/});

    const CssLexer = new Lexer(cssTokens, {
        // Less position info tracked, reduces verbosity of the playground output.
        positionTracking: "onlyStart",
    });

    // ----------------- parser -----------------
    const CstParser = chevrotain.CstParser;

    class CssParser extends CstParser {
        constructor() {
            super(cssTokens, {
                recoveryEnabled: true,
                maxLookahead: 3
            });

            const $ = this;

            $.RULE('stylesheet', () => {

                // [ CHARSET_SYM STRING ';' ]?
                $.OPTION(() => {
                    $.SUBRULE($.charsetHeader)
                })

                // [S|CDO|CDC]*
                $.SUBRULE($.cdcCdo)

                // [ import [ CDO S* | CDC S* ]* ]*
                $.MANY(() => {
                    $.SUBRULE($.cssImport)
                    $.SUBRULE2($.cdcCdo)
                })

                // [ [ ruleset | media | page ] [ CDO S* | CDC S* ]* ]*
                $.MANY2(() => {
                    $.SUBRULE($.contents)
                })
            });

            $.RULE('charsetHeader', () => {
                $.CONSUME(CharsetSym)
                $.CONSUME(StringLiteral)
                $.CONSUME(SemiColon)
            })

            $.RULE('contents', () => {
                $.OR([
                    {ALT: () => $.SUBRULE($.ruleset)},
                    {ALT: () => $.SUBRULE($.media)},
                    {ALT: () => $.SUBRULE($.page)}
                ]);
                $.SUBRULE3($.cdcCdo)
            })

            // factor out repeating pattern for cdc/cdo
            $.RULE('cdcCdo', () => {
                $.MANY(() => {
                    $.OR([
                        {ALT: () => $.CONSUME(Cdo)},
                        {ALT: () => $.CONSUME(Cdc)}
                    ]);
                })
            })

            // IMPORT_SYM S*
            // [STRING|URI] S* media_list? ';' S*
            $.RULE('cssImport', () => {
                $.CONSUME(ImportSym)
                $.OR([
                    {ALT: () => $.CONSUME(StringLiteral)},
                    {ALT: () => $.CONSUME(Uri)}
                ]);

                $.OPTION(() => {
                    $.SUBRULE($.media_list)
                })

                $.CONSUME(SemiColon)
            });

            // MEDIA_SYM S* media_list '{' S* ruleset* '}' S*
            $.RULE('media', () => {
                $.CONSUME(MediaSym)
                $.SUBRULE($.media_list)
                $.CONSUME(LCurly)
                $.SUBRULE($.ruleset)
                $.CONSUME(RCurly)
            });

            // medium [ COMMA S* medium]*
            $.RULE('media_list', () => {
                $.MANY_SEP({
                    SEP: Comma, DEF: () => {
                        $.SUBRULE($.medium)
                    }
                })
            });

            // IDENT S*
            $.RULE('medium', () => {
                $.CONSUME(Ident)
            });

            // PAGE_SYM S* pseudo_page?
            // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
            $.RULE('page', () => {
                $.CONSUME(PageSym)
                $.OPTION(() => {
                    $.SUBRULE($.pseudo_page)
                })

                $.SUBRULE($.declarationsGroup)
            });

            // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
            // factored out repeating grammar pattern
            $.RULE('declarationsGroup', () => {
                $.CONSUME(LCurly)
                $.OPTION(() => {
                    $.SUBRULE($.declaration)
                })

                $.MANY(() => {
                    $.CONSUME(SemiColon)
                    $.OPTION2(() => {
                        $.SUBRULE2($.declaration)
                    })
                })
                $.CONSUME(RCurly)
            });

            // ':' IDENT S*
            $.RULE('pseudo_page', () => {
                $.CONSUME(Colon)
                $.CONSUME(Ident)
            });

            // '/' S* | ',' S*
            $.RULE('operator', () => {
                $.OR([
                    {ALT: () => $.CONSUME(Slash)},
                    {ALT: () => $.CONSUME(Comma)}
                ]);
            });

            // '+' S* | '>' S*
            $.RULE('combinator', () => {
                $.OR([
                    {ALT: () => $.CONSUME(Plus)},
                    {ALT: () => $.CONSUME(GreaterThan)}
                ]);
            });

            // '-' | '+'
            $.RULE('unary_operator', () => {
                $.OR([
                    {ALT: () => $.CONSUME(Minus)},
                    {ALT: () => $.CONSUME(Plus)}
                ]);
            });

            // IDENT S*
            $.RULE('property', () => {
                $.CONSUME(Ident)
            });

            // selector [ ',' S* selector ]*
            // '{' S* declaration? [ ';' S* declaration? ]* '}' S*
            $.RULE('ruleset', () => {
                $.MANY_SEP({
                    SEP: Comma, DEF: () => {
                        $.SUBRULE($.selector)
                    }
                })

                $.SUBRULE($.declarationsGroup)
            });

            // simple_selector [ combinator selector | S+ [ combinator? selector ]? ]?
            $.RULE('selector', () => {
                $.SUBRULE($.simple_selector)
                $.OPTION(() => {
                    $.OPTION2(() => {
                        $.SUBRULE($.combinator)
                    })
                    $.SUBRULE($.selector)
                })
            });

            // element_name [ HASH | class | attrib | pseudo ]*
            // | [ HASH | class | attrib | pseudo ]+
            $.RULE('simple_selector', () => {
                // @formatter:off
            $.OR([
                {ALT: () => {
                    $.SUBRULE($.element_name)
                    $.MANY(() => {
                        $.SUBRULE($.simple_selector_suffix)
                    })

                }},
                {ALT: () => {
                    $.AT_LEAST_ONE(() => {
                        $.SUBRULE2($.simple_selector_suffix)
                    })
                }}
            ]);
            // @formatter:on
            });

            // helper grammar rule to avoid repetition
            // [ HASH | class | attrib | pseudo ]+
            $.RULE('simple_selector_suffix', () => {
                $.OR([
                    {ALT: () => $.CONSUME(Hash)},
                    {ALT: () => $.SUBRULE($.class)},
                    {ALT: () => $.SUBRULE($.attrib)},
                    {ALT: () => $.SUBRULE($.pseudo)}
                ]);
            })

            // '.' IDENT
            $.RULE('class', () => {
                $.CONSUME(Dot)
                $.CONSUME(Ident)
            });

            // IDENT | '*'
            $.RULE('element_name', () => {
                $.OR([
                    {ALT: () => $.CONSUME(Ident)},
                    {ALT: () => $.CONSUME(Star)}
                ]);
            });

            // '[' S* IDENT S* [ [ '=' | INCLUDES | DASHMATCH ] S* [ IDENT | STRING ] S* ]? ']'
            $.RULE('attrib', function () {
                $.CONSUME(LSquare)
                $.CONSUME(Ident)

                this.OPTION(() => {
                    $.OR([
                        {ALT: () => $.CONSUME(Equals)},
                        {ALT: () => $.CONSUME(Includes)},
                        {ALT: () => $.CONSUME(Dasmatch)}
                    ]);

                    $.OR2([
                        {ALT: () => $.CONSUME2(Ident)},
                        {ALT: () => $.CONSUME(StringLiteral)}
                    ]);
                })
                $.CONSUME(RSquare)
            });

            // ':' [ IDENT | FUNCTION S* [IDENT S*]? ')' ]
            $.RULE('pseudo', () => {
                $.CONSUME(Colon)
                // @formatter:off
                $.OR([
                    {ALT: () => {$.CONSUME(Ident)}},
                    {ALT: () => {
                        $.CONSUME(Func)
                        $.OPTION(() => {
                            $.CONSUME2(Ident)
                        })
                        $.CONSUME(RParen)
                    }}
                ]);
                // @formatter:on
            });

            // property ':' S* expr prio?
            $.RULE('declaration', () => {
                $.SUBRULE($.property)
                $.CONSUME(Colon)
                $.SUBRULE($.expr)

                $.OPTION(() => {
                    $.SUBRULE($.prio)
                })
            });

            // IMPORTANT_SYM S*
            $.RULE('prio', () => {
                $.CONSUME(ImportantSym)
            });

            // term [ operator? term ]*
            $.RULE('expr', () => {
                $.SUBRULE($.term)
                $.MANY(() => {
                    $.OPTION(() => {
                        $.SUBRULE($.operator)
                    })
                    $.SUBRULE2($.term)
                })
            });

            // unary_operator?
            // [ NUMBER S* | PERCENTAGE S* | LENGTH S* | EMS S* | EXS S* | ANGLE S* |
            // TIME S* | FREQ S* ]
            // | STRING S* | IDENT S* | URI S* | hexcolor | function
            $.RULE('term', () => {
                $.OPTION(() => {
                    $.SUBRULE($.unary_operator)
                })

                $.OR([
                    {ALT: () => $.CONSUME(Num)},
                    {ALT: () => $.CONSUME(Percentage)},
                    {ALT: () => $.CONSUME(Length)},
                    {ALT: () => $.CONSUME(Ems)},
                    {ALT: () => $.CONSUME(Exs)},
                    {ALT: () => $.CONSUME(Angle)},
                    {ALT: () => $.CONSUME(Time)},
                    {ALT: () => $.CONSUME(Freq)},
                    {ALT: () => $.CONSUME(StringLiteral)},
                    {ALT: () => $.CONSUME(Ident)},
                    {ALT: () => $.CONSUME(Uri)},
                    {ALT: () => $.SUBRULE($.hexcolor)},
                    {ALT: () => $.SUBRULE($.cssFunction)}
                ]);
            });

            // FUNCTION S* expr ')' S*
            $.RULE('cssFunction', () => {
                $.CONSUME(Func)
                $.SUBRULE($.expr)
                $.CONSUME(RParen)
            });

            $.RULE('hexcolor', () => {
                $.CONSUME(Hash)
            });

            // very important to call this after all the rules have been setup.
            // otherwise the parser may not work correctly as it will lack information
            // derived from the self analysis.
            this.performSelfAnalysis();
        }
    }

    // for the playground to work the returned object must contain these fields
    return {
        lexer: CssLexer,
        parser: CssParser,
        defaultRule: "stylesheet"
    };
}


function calculatorExample() {
    // ----------------- lexer -----------------
    const createToken = chevrotain.createToken;
    const tokenMatcher = chevrotain.tokenMatcher;
    const Lexer = chevrotain.Lexer;
    const EmbeddedActionsParser = chevrotain.EmbeddedActionsParser;

    // using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
    // AdditionOperator defines a Tokens hierarchy but only leafs in this hierarchy
    // define actual Tokens that can appear in the text
    const AdditionOperator = createToken({name: "AdditionOperator", pattern: Lexer.NA});
    const Plus = createToken({name: "Plus", pattern: /\+/, categories: AdditionOperator});
    const Minus = createToken({name: "Minus", pattern: /-/, categories: AdditionOperator});

    const MultiplicationOperator = createToken({name: "MultiplicationOperator", pattern: Lexer.NA});
    const Multi = createToken({name: "Multi", pattern: /\*/, categories: MultiplicationOperator});
    const Div = createToken({name: "Div", pattern: /\//, categories: MultiplicationOperator});

    const LParen = createToken({name: "LParen", pattern: /\(/});
    const RParen = createToken({name: "RParen", pattern: /\)/});
    const NumberLiteral = createToken({name: "NumberLiteral", pattern: /[1-9]\d*/});

    const PowerFunc = createToken({name: "PowerFunc", pattern: /power/});
    const Comma = createToken({name: "Comma", pattern: /,/});

    const WhiteSpace = createToken({
        name: "WhiteSpace",
        pattern: /\s+/,
        group: Lexer.SKIPPED
    });

    // whitespace is normally very common so it is placed first to speed up the lexer
    const allTokens = [WhiteSpace,
        Plus, Minus, Multi, Div, LParen, RParen,
        NumberLiteral, AdditionOperator, MultiplicationOperator,
        PowerFunc, Comma];
    const CalculatorLexer = new Lexer(allTokens);


    class Calculator extends EmbeddedActionsParser {
        constructor() {
            super(allTokens);

            const $ = this;

            $.RULE("expression", () => {
                // uncomment the debugger statement and open dev tools in chrome/firefox
                // to debug the parsing flow.
                // debugger;
                return $.SUBRULE($.additionExpression)
            });


            // Lowest precedence thus it is first in the rule chain
            // The precedence of binary expressions is determined by
            // how far down the Parse Tree the binary expression appears.
            $.RULE("additionExpression", () => {
                let value, op, rhsVal;

                // parsing part
                value = $.SUBRULE($.multiplicationExpression);
                $.MANY(() => {
                    // consuming 'AdditionOperator' will consume
                    // either Plus or Minus as they are subclasses of AdditionOperator
                    op = $.CONSUME(AdditionOperator);
                    //  the index "2" in SUBRULE2 is needed to identify the unique
                    // position in the grammar during runtime
                    rhsVal = $.SUBRULE2($.multiplicationExpression);

                    // interpreter part
                    // tokenMatcher acts as ECMAScript instanceof operator
                    if (tokenMatcher(op, Plus)) {
                        value += rhsVal
                    } else { // op "instanceof" Minus
                        value -= rhsVal
                    }
                });

                return value
            });


            $.RULE("multiplicationExpression", () => {
                let value, op, rhsVal;

                // parsing part
                value = $.SUBRULE($.atomicExpression);
                $.MANY(() => {
                    op = $.CONSUME(MultiplicationOperator);
                    //  the index "2" in SUBRULE2 is needed to identify the unique
                    // position in the grammar during runtime
                    rhsVal = $.SUBRULE2($.atomicExpression);

                    // interpreter part
                    // tokenMatcher acts as ECMAScript instanceof operator
                    if (tokenMatcher(op, Multi)) {
                        value *= rhsVal
                    } else { // op instanceof Div
                        value /= rhsVal
                    }
                });

                return value
            });


            $.RULE("atomicExpression", () => $.OR([
                // parenthesisExpression has the highest precedence and thus it
                // appears in the "lowest" leaf in the expression ParseTree.
                {ALT: () => $.SUBRULE($.parenthesisExpression)},
                {ALT: () => parseInt($.CONSUME(NumberLiteral).image, 10)},
                {ALT: () => $.SUBRULE($.powerFunction)}
            ]));


            $.RULE("parenthesisExpression", () => {
                let expValue;

                $.CONSUME(LParen);
                expValue = $.SUBRULE($.expression);
                $.CONSUME(RParen);

                return expValue
            });

            $.RULE("powerFunction", () => {
                let base, exponent;

                $.CONSUME(PowerFunc);
                $.CONSUME(LParen);
                base = $.SUBRULE($.expression);
                $.CONSUME(Comma);
                exponent = $.SUBRULE2($.expression);
                $.CONSUME(RParen);

                return Math.pow(base, exponent)
            });

            // very important to call this after all the rules have been defined.
            // otherwise the parser may not work correctly as it will lack information
            // derived during the self analysis phase.
            this.performSelfAnalysis();
        }
    }

    // for the playground to work the returned object must contain these fields
    return {
        lexer: CalculatorLexer,
        parser: Calculator,
        defaultRule: "expression"
    };
}

function calculatorExampleCst() {
    "use strict";
    /**
     * An Example of implementing a Calculator with separated grammar and semantics (actions).
     * This separation makes it easier to maintain the grammar and reuse it in different use cases.
     *
     * This is accomplished by using the automatic CST (Concrete Syntax Tree) output capabilities
     * of chevrotain.
     *
     * See farther details here:
     * https://chevrotain.io/docs/guide/concrete_syntax_tree.html
     */
    const createToken = chevrotain.createToken;
    const tokenMatcher = chevrotain.tokenMatcher;
    const Lexer = chevrotain.Lexer;
    const CstParser = chevrotain.CstParser;

    // using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
    // AdditionOperator defines a Tokens hierarchy but only the leafs in this hierarchy define
    // actual Tokens that can appear in the text
    const AdditionOperator = createToken({name: "AdditionOperator", pattern: Lexer.NA});
    const Plus = createToken({name: "Plus", pattern: /\+/, categories: AdditionOperator});
    const Minus = createToken({name: "Minus", pattern: /-/, categories: AdditionOperator});

    const MultiplicationOperator = createToken({name: "MultiplicationOperator", pattern: Lexer.NA});
    const Multi = createToken({name: "Multi", pattern: /\*/, categories: MultiplicationOperator});
    const Div = createToken({name: "Div", pattern: /\//, categories: MultiplicationOperator});

    const LParen = createToken({name: "LParen", pattern: /\(/});
    const RParen = createToken({name: "RParen", pattern: /\)/});
    const NumberLiteral = createToken({name: "NumberLiteral", pattern: /[1-9]\d*/});

    const PowerFunc = createToken({name: "PowerFunc", pattern: /power/});
    const Comma = createToken({name: "Comma", pattern: /,/});

    // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
    const WhiteSpace = createToken({
        name: "WhiteSpace",
        pattern: /\s+/,
        group: Lexer.SKIPPED
    });

    const allTokens = [WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
        Plus, Minus, Multi, Div, LParen, RParen, NumberLiteral, AdditionOperator, MultiplicationOperator, PowerFunc, Comma];
    const CalculatorLexer = new Lexer(allTokens);

    // ----------------- parser -----------------
    // Note that this is a Pure grammar, it only describes the grammar
    // Not any actions (semantics) to perform during parsing.
    class CalculatorPure extends CstParser {
        constructor() {
            super(allTokens);

            const $ = this;

            $.RULE("expression", () => {
                $.SUBRULE($.additionExpression)
            });

            //  lowest precedence thus it is first in the rule chain
            // The precedence of binary expressions is determined by how far down the Parse Tree
            // The binary expression appears.
            $.RULE("additionExpression", () => {
                $.SUBRULE($.multiplicationExpression, {LABEL: "lhs"});
                $.MANY(() => {
                    // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
                    $.CONSUME(AdditionOperator);
                    //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
                    $.SUBRULE2($.multiplicationExpression, {LABEL: "rhs"});
                });
            });

            $.RULE("multiplicationExpression", () => {
                $.SUBRULE($.atomicExpression, {LABEL: "lhs"});
                $.MANY(() => {
                    $.CONSUME(MultiplicationOperator);
                    //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
                    $.SUBRULE2($.atomicExpression, {LABEL: "rhs"});
                });
            });

            $.RULE("atomicExpression", () => $.OR([
                // parenthesisExpression has the highest precedence and thus it appears
                // in the "lowest" leaf in the expression ParseTree.
                {ALT: () => $.SUBRULE($.parenthesisExpression)},
                {ALT: () => $.CONSUME(NumberLiteral)},
                {ALT: () => $.SUBRULE($.powerFunction)}
            ]));

            $.RULE("parenthesisExpression", () => {
                $.CONSUME(LParen);
                $.SUBRULE($.expression);
                $.CONSUME(RParen);
            });

            $.RULE("powerFunction", () => {
                $.CONSUME(PowerFunc);
                $.CONSUME(LParen);
                $.SUBRULE($.expression, {LABEL: "base"});
                $.CONSUME(Comma);
                $.SUBRULE2($.expression, {LABEL: "exponent"});
                $.CONSUME(RParen);
            });

            // very important to call this after all the rules have been defined.
            // otherwise the parser may not work correctly as it will lack information
            // derived during the self analysis phase.
            this.performSelfAnalysis();
        }
    }

    // wrapping it all together
    // reuse the same parser instance.
    const parser = new CalculatorPure([]);


    // ----------------- Interpreter -----------------
    const BaseCstVisitor = parser.getBaseCstVisitorConstructor()

    class CalculatorInterpreter extends BaseCstVisitor {

        constructor() {
            super()
            // This helper will detect any missing or redundant methods on this visitor
            this.validateVisitor()
        }

        expression(ctx) {
            return this.visit(ctx.additionExpression)
        }

        additionExpression(ctx) {
            let result = this.visit(ctx.lhs)

            // "rhs" key may be undefined as the grammar defines it as optional (MANY === zero or more).
            if (ctx.rhs) {
                ctx.rhs.forEach((rhsOperand, idx) => {
                    // there will be one operator for each rhs operand
                    let rhsValue = this.visit(rhsOperand)
                    let operator = ctx.AdditionOperator[idx]

                    if (tokenMatcher(operator, Plus)) {
                        result += rhsValue
                    } else {
                        // Minus
                        result -= rhsValue
                    }
                })
            }

            return result
        }

        multiplicationExpression(ctx) {
            let result = this.visit(ctx.lhs)

            // "rhs" key may be undefined as the grammar defines it as optional (MANY === zero or more).
            if (ctx.rhs) {
                ctx.rhs.forEach((rhsOperand, idx) => {
                    // there will be one operator for each rhs operand
                    let rhsValue = this.visit(rhsOperand)
                    let operator = ctx.MultiplicationOperator[idx]

                    if (tokenMatcher(operator, Multi)) {
                        result *= rhsValue
                    } else {
                        // Division
                        result /= rhsValue
                    }
                })
            }

            return result
        }

        atomicExpression(ctx) {
            if (ctx.parenthesisExpression) {
                // passing an array to "this.visit" is equivalent
                // to passing the array's first element
                return this.visit(ctx.parenthesisExpression)
            }
            else if (ctx.NumberLiteral) {
                // If a key exists on the ctx, at least one element is guaranteed
                return parseInt(ctx.NumberLiteral[0].image, 10)
            }
            else if (ctx.powerFunction) {
                return this.visit(ctx.powerFunction)
            }
        }

        parenthesisExpression(ctx) {
            // The ctx will also contain the parenthesis tokens, but we don't care about those
            // in the context of calculating the result.
            return this.visit(ctx.expression)
        }

        powerFunction(ctx) {
            const base = this.visit(ctx.base);
            const exponent = this.visit(ctx.exponent);
            return Math.pow(base, exponent)
        }
    }

    // for the playground to work the returned object must contain these fields
    return {
        lexer: CalculatorLexer,
        parser: CalculatorPure,
        visitor: CalculatorInterpreter,
        defaultRule: "expression"
    };
}

var samples = {

    "JSON grammar and CST output": {
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

    "JSON grammar and embedded semantics": {
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

    "Calculator separated semantics": {
        implementation: calculatorExampleCst,
        sampleInputs: {
            "parenthesis precedence": "2 * ( 3 + 7)",
            "operator precedence": "2 + 4 * 5 / 10",
            "power function": "1 + power(3, 2)",
            "unidentified Token - success": "1 + @@1 + 1"
        }
    },

    "Calculator embedded semantics": {
        implementation: calculatorExample,
        sampleInputs: {
            "parenthesis precedence": "2 * ( 3 + 7)",
            "operator precedence": "2 + 4 * 5 / 10",
            "power function": "1 + power(3, 2)",
            "unidentified Token - success": "1 + @@1 + 1"
        }
    },

    "CSS Grammar": {
        implementation: cssExample,
        sampleInputs: {
            simpleCss: "@charset \"UTF-8\";\r\n\/* CSS Document *\/\r\n\r\n\/** Structure *\/\r\nbody" +
            " {\r\n  font-family: Arial, sans-serif;\r\n  margin: 0;\r\n  font-size: 14px;\r\n}\r\n\r\n#system-error" +
            " {\r\n  font-size: 1.5em;\r\n  text-align: center;\r\n}",


            "won't stop on first error": "@charset \"UTF-8\";\r\n\/* CSS Document *\/\r\n\r\n\/** Structure *\/\r\nbody" +
            " {\r\n  font-family Arial, sans-serif;\r\n  margin: 0;\r\n  font-size: 14px;\r\n}\r\n\r\n#system-error" +
            " {\r\n  font-size 1.5em;\r\n  text-align: center;\r\n}"
        }
    }
}

