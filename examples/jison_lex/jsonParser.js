var chevrotain = require("chevrotain");
var JisonLex = require('jison-lex');

// ----------------- lexer -----------------
var Parser = chevrotain.Parser;
var extendToken = chevrotain.extendToken;


// In ES6, custom inheritance implementation (such as the one above) can be replaced with simple "class X extends Y"...
var True = extendToken("True");
var False = extendToken("False");
var Null = extendToken("Null");
var LCurly = extendToken("LCurly");
var RCurly = extendToken("RCurly");
var LSquare = extendToken("LSquare");
var RSquare = extendToken("RSquare");
var Comma = extendToken("Comma");
var Colon = extendToken("Colon");
var StringLiteral = extendToken("StringLiteral");
var NumberLiteral = extendToken("NumberLiteral");

// DOCS: this object will act as a map between the TokenClass names and their constructors.
//       It is used via a closure in 'buildTokenInstance' to create new token instances during the lexing
var jsonTokens = {
    True         : True,
    False        : False,
    Null         : Null,
    LCurly       : LCurly,
    RCurly       : RCurly,
    LSquare      : LSquare,
    RSquare      : RSquare,
    Comma        : Comma,
    Colon        : Colon,
    StringLiteral: StringLiteral,
    NumberLiteral: NumberLiteral
};

// DOCS: using a JISON lexer definition.
// This has been modified from the example in: https://github.com/zaach/jison/blob/master/examples/json.js
var grammar = {
    "macros": {
        "digit": "[0-9]",
        "esc"  : "\\\\",
        "int"  : "-?(?:[0-9]|[1-9][0-9]+)",
        "exp"  : "(?:[eE][-+]?[0-9]+)",
        "frac" : "(?:\\.[0-9]+)"
    },
    "rules" : [
        ["\\s+", "/* skip whitespace */"],
        ["{int}{frac}?{exp}?\\b", "return this.buildTokenInstance('NumberLiteral')"],
        ["\"(?:{esc}[\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"{esc}])*\"", "return this.buildTokenInstance('StringLiteral')"],
        ["\\{", "return this.buildTokenInstance('LCurly')"],
        ["\\}", "return this.buildTokenInstance('RCurly')"],
        ["\\[", "return this.buildTokenInstance('LSquare')"],
        ["\\]", "return this.buildTokenInstance('RSquare')"],
        [",", "return this.buildTokenInstance('Comma')"],
        [":", "return this.buildTokenInstance('Colon')"],
        ["true\\b", "return this.buildTokenInstance('True')"],
        ["false\\b", "return this.buildTokenInstance('False')"],
        ["null\\b", "return this.buildTokenInstance('Null')"],
        ["$", "return 'EOF';"]
    ]
};

// DOCS: in memory lexer, it can also be generated to a file. see : https://github.com/zaach/jison-lex
var lexer = new JisonLex(grammar);
// DOCS: by attaching this utility on the lexer instance we can invoke it from the generated lexer actions.
//       by calling 'this.buildTokenInstance(...). this is the part that 'connects' the Chevrotain Tokens and the jison lexer output
// TODO: better way to do this with YY property?
lexer.buildTokenInstance = function (className) {
    var clazz = jsonTokens[className];
    return new clazz(this.yylloc.first_line, this.yylloc.first_column, this.yytext);
};

// ----------------- parser -----------------

function JsonParser(input) {
    Parser.call(this, input, jsonTokens);

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
    Parser.performSelfAnalysis(this);
}

JsonParser.prototype = Object.create(Parser.prototype);
JsonParser.prototype.constructor = JsonParser;

// ----------------- wrapping it all together -----------------
module.exports = function (text) {
    var fullResult = {};

    lexer.setInput(text);
    var reachedEOF = false;
    var tokens = [];

    // lex the whole input
    while (!reachedEOF) {
        var nextToken = lexer.lex();
        if (nextToken === 'EOF') {
            reachedEOF = true;
        }
        else {
            tokens.push(nextToken);
        }
    }

    var parser = new JsonParser(tokens);
    parser.json();

    fullResult.tokens = tokens;
    fullResult.parseErrors = parser.errors;
    fullResult.lexerDone = lexer.done;

    // TODO: modify the parser to return a JsonObject...
    return fullResult;
};