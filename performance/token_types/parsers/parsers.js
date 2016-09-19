var baseIframe = document.createElement("iframe");
baseIframe.setAttribute("src", "http://sap.github.io/chevrotain/performance/token_types/iframeLoader.html");
baseIframe.style.visibility = "hidden"
document.body.appendChild(baseIframe);
baseIframe.addEventListener("load", loadBaseParser)

var base = {};
function loadBaseParser() {

    var chevrotain = baseIframe.contentWindow.chevrotain
    // ----------------- Lexer -----------------
    var extendToken = chevrotain.extendToken;

    // https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6 (Use Lazy Tokens)
    var ChevrotainLexer = chevrotain.Lexer;

    // In ES6, custom inheritance implementation (such as the one above) can be replaced with a more simple: "class X extends Y"...
    var True = extendToken("True", /true/);
    var False = extendToken("False", /false/);
    var Null = extendToken("Null", /null/);
    var LCurly = extendToken("LCurly", /{/);
    var RCurly = extendToken("RCurly", /}/);
    var LSquare = extendToken("LSquare", /\[/);
    var RSquare = extendToken("RSquare", /]/);
    var Comma = extendToken("Comma", /,/);
    var Colon = extendToken("Colon", /:/);
    var StringLiteral = extendToken("StringLiteral", /"(?:[^\\"]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral", /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = ChevrotainLexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.


    var jsonTokens = [WhiteSpace, StringLiteral, NumberLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null];
    var jsonLexer = new ChevrotainLexer(jsonTokens);

    // ----------------- parser -----------------

    // https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6
    // (Do not create a new Parser instance for each new input.)
    var ChevrotainParser = chevrotain.Parser;

    function ChevrotainJsonBaseParser(input) {
        ChevrotainParser.call(this, input, jsonTokens);
        var _this = this;

        this.json = this.RULE("json", function () {
            // @formatter:off
        _this.OR([
            { ALT: function () { _this.SUBRULE(_this.object) }},
            { ALT: function () { _this.SUBRULE(_this.array) }}
        ]);
        // @formatter:on
        });

        this.object = this.RULE("object", function () {
            _this.CONSUME(LCurly);
            _this.OPTION(function () {
                _this.SUBRULE(_this.objectItem);
                _this.MANY(function () {
                    _this.CONSUME(Comma);
                    _this.SUBRULE2(_this.objectItem);
                });
            });
            _this.CONSUME(RCurly);
        });

        this.objectItem = this.RULE("objectItem", function () {
            _this.CONSUME(StringLiteral);
            _this.CONSUME(Colon);
            _this.SUBRULE(_this.value);
        });

        this.array = this.RULE("array", function () {
            _this.CONSUME(LSquare);
            _this.OPTION(function () {
                _this.SUBRULE(_this.value);
                _this.MANY(function () {
                    _this.CONSUME(Comma);
                    _this.SUBRULE2(_this.value);
                });
            });
            _this.CONSUME(RSquare);
        });

        // @formatter:off
    this.value = this.RULE("value", function () {
        _this.OR([
            { ALT: function () { _this.CONSUME(StringLiteral) }},
            { ALT: function () { _this.CONSUME(NumberLiteral) }},
            { ALT: function () { _this.SUBRULE(_this.object) }},
            { ALT: function () { _this.SUBRULE(_this.array) }},
            { ALT: function () { _this.CONSUME(True) }},
            { ALT: function () { _this.CONSUME(False) }},
            { ALT: function () { _this.CONSUME(Null) }}
        ], "a value");
    });
    // @formatter:on

        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        ChevrotainParser.performSelfAnalysis(this);
    }

    ChevrotainJsonBaseParser.prototype = Object.create(ChevrotainParser.prototype);
    ChevrotainJsonBaseParser.prototype.constructor = ChevrotainJsonBaseParser;


    base.lexer = jsonLexer;
    base.parser = new ChevrotainJsonBaseParser([]);
}

var lazy = {};
var lazyFrame = document.createElement("iframe");
lazyFrame.setAttribute("src", "http://sap.github.io/chevrotain/performance/token_types/iframeLoader.html");
lazyFrame.style.visibility = "hidden"
document.body.appendChild(lazyFrame);
lazyFrame.addEventListener("load", loadLazyParser)

function loadLazyParser() {

    var chevrotain = lazyFrame.contentWindow.chevrotain
    // ----------------- Lexer -----------------
    var extendToken = chevrotain.extendLazyToken;

    // https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6 (Use Lazy Tokens)
    var ChevrotainLexer = chevrotain.Lexer;

    // In ES6, custom inheritance implementation (such as the one above) can be replaced with a more simple: "class X extends Y"...
    var True = extendToken("True", /true/);
    var False = extendToken("False", /false/);
    var Null = extendToken("Null", /null/);
    var LCurly = extendToken("LCurly", /{/);
    var RCurly = extendToken("RCurly", /}/);
    var LSquare = extendToken("LSquare", /\[/);
    var RSquare = extendToken("RSquare", /]/);
    var Comma = extendToken("Comma", /,/);
    var Colon = extendToken("Colon", /:/);
    var StringLiteral = extendToken("StringLiteral", /"(?:[^\\"]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral", /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = ChevrotainLexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.


    var jsonTokens = [WhiteSpace, StringLiteral, NumberLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null];
    var jsonLexer = new ChevrotainLexer(jsonTokens);

    // ----------------- parser -----------------

    // https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6
    // (Do not create a new Parser instance for each new input.)
    var ChevrotainParser = chevrotain.Parser;

    function ChevrotainJsonLazyParser(input) {
        ChevrotainParser.call(this, input, jsonTokens);
        var _this = this;

        this.json = this.RULE("json", function () {
            // @formatter:off
        _this.OR([
            { ALT: function () { _this.SUBRULE(_this.object) }},
            { ALT: function () { _this.SUBRULE(_this.array) }}
        ]);
        // @formatter:on
        });

        this.object = this.RULE("object", function () {
            _this.CONSUME(LCurly);
            _this.OPTION(function () {
                _this.SUBRULE(_this.objectItem);
                _this.MANY(function () {
                    _this.CONSUME(Comma);
                    _this.SUBRULE2(_this.objectItem);
                });
            });
            _this.CONSUME(RCurly);
        });

        this.objectItem = this.RULE("objectItem", function () {
            _this.CONSUME(StringLiteral);
            _this.CONSUME(Colon);
            _this.SUBRULE(_this.value);
        });

        this.array = this.RULE("array", function () {
            _this.CONSUME(LSquare);
            _this.OPTION(function () {
                _this.SUBRULE(_this.value);
                _this.MANY(function () {
                    _this.CONSUME(Comma);
                    _this.SUBRULE2(_this.value);
                });
            });
            _this.CONSUME(RSquare);
        });

        // @formatter:off
    this.value = this.RULE("value", function () {
        _this.OR([
            { ALT: function () { _this.CONSUME(StringLiteral) }},
            { ALT: function () { _this.CONSUME(NumberLiteral) }},
            { ALT: function () { _this.SUBRULE(_this.object) }},
            { ALT: function () { _this.SUBRULE(_this.array) }},
            { ALT: function () { _this.CONSUME(True) }},
            { ALT: function () { _this.CONSUME(False) }},
            { ALT: function () { _this.CONSUME(Null) }}
        ], "a value");
    });
    // @formatter:on

        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        ChevrotainParser.performSelfAnalysis(this);
    }

    ChevrotainJsonLazyParser.prototype = Object.create(ChevrotainParser.prototype);
    ChevrotainJsonLazyParser.prototype.constructor = ChevrotainJsonLazyParser;


    lazy.lexer = jsonLexer;
    lazy.parser = new ChevrotainJsonLazyParser([]);
}


var simpleLazy = {};
var simpleLazyFrame = document.createElement("iframe");
simpleLazyFrame.setAttribute("src", "http://sap.github.io/chevrotain/performance/token_types/iframeLoader.html");
simpleLazyFrame.style.visibility = "hidden"
document.body.appendChild(simpleLazyFrame);
simpleLazyFrame.addEventListener("load", loadSimpleLazyParser)

function loadSimpleLazyParser() {
    var chevrotain = simpleLazyFrame.contentWindow.chevrotain

    // ----------------- Lexer -----------------
    var extendToken = chevrotain.extendSimpleLazyToken;

    // https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6 (Use Lazy Tokens)
    var ChevrotainLexer = chevrotain.Lexer;

    // In ES6, custom inheritance implementation (such as the one above) can be replaced with a more simple: "class X extends Y"...
    var True = extendToken("True", /true/);
    var False = extendToken("False", /false/);
    var Null = extendToken("Null", /null/);
    var LCurly = extendToken("LCurly", /{/);
    var RCurly = extendToken("RCurly", /}/);
    var LSquare = extendToken("LSquare", /\[/);
    var RSquare = extendToken("RSquare", /]/);
    var Comma = extendToken("Comma", /,/);
    var Colon = extendToken("Colon", /:/);
    var StringLiteral = extendToken("StringLiteral", /"(?:[^\\"]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral", /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = ChevrotainLexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.


    var jsonTokens = [WhiteSpace, StringLiteral, NumberLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null];
    var jsonLexer = new ChevrotainLexer(jsonTokens);

    // ----------------- parser -----------------

    // https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6
    // (Do not create a new Parser instance for each new input.)
    var ChevrotainParser = chevrotain.Parser;

    function ChevrotainJsonSimpleLazyParser(input) {
        ChevrotainParser.call(this, input, jsonTokens);
        var _this = this;

        this.json = this.RULE("json", function () {
            // @formatter:off
        _this.OR([
            { ALT: function () { _this.SUBRULE(_this.object) }},
            { ALT: function () { _this.SUBRULE(_this.array) }}
        ]);
        // @formatter:on
        });

        this.object = this.RULE("object", function () {
            _this.CONSUME(LCurly);
            _this.OPTION(function () {
                _this.SUBRULE(_this.objectItem);
                _this.MANY(function () {
                    _this.CONSUME(Comma);
                    _this.SUBRULE2(_this.objectItem);
                });
            });
            _this.CONSUME(RCurly);
        });

        this.objectItem = this.RULE("objectItem", function () {
            _this.CONSUME(StringLiteral);
            _this.CONSUME(Colon);
            _this.SUBRULE(_this.value);
        });

        this.array = this.RULE("array", function () {
            _this.CONSUME(LSquare);
            _this.OPTION(function () {
                _this.SUBRULE(_this.value);
                _this.MANY(function () {
                    _this.CONSUME(Comma);
                    _this.SUBRULE2(_this.value);
                });
            });
            _this.CONSUME(RSquare);
        });

        // @formatter:off
    this.value = this.RULE("value", function () {
        _this.OR([
            { ALT: function () { _this.CONSUME(StringLiteral) }},
            { ALT: function () { _this.CONSUME(NumberLiteral) }},
            { ALT: function () { _this.SUBRULE(_this.object) }},
            { ALT: function () { _this.SUBRULE(_this.array) }},
            { ALT: function () { _this.CONSUME(True) }},
            { ALT: function () { _this.CONSUME(False) }},
            { ALT: function () { _this.CONSUME(Null) }}
        ], "a value");
    });
    // @formatter:on

        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        ChevrotainParser.performSelfAnalysis(this);
    }

    ChevrotainJsonSimpleLazyParser.prototype = Object.create(ChevrotainParser.prototype);
    ChevrotainJsonSimpleLazyParser.prototype.constructor = ChevrotainJsonSimpleLazyParser;

    simpleLazy.lexer = jsonLexer;
    simpleLazy.parser = new ChevrotainJsonSimpleLazyParser([]);
}
