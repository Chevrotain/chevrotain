// ----------------- Tokens -----------------
var Token = chevrotain.tokens.Token;

// DOCS: this object will act as a map between the TokenClass names and their constructors.
//       It is used via a closure in 'buildTokenInstance' to create new token instances during the lexing
var jsonTokens = {};

// DOCS:
// Javascript inheritance using Object.create().
// Any inheritance implementation will work as long it works with the instanceof operator.
function extendToken(className) {
    var childConstructor = function (line, column, image) {
        Token.call(this, line, column, image);
    };
    // TODO: Function.name is not writable, need to workaround this to provide good error messages
    //       In case anonymous functions have been used as the constructors.
    childConstructor.name = className;
    jsonTokens[className] = childConstructor;
    childConstructor.prototype = Object.create(Token.prototype);
    childConstructor.prototype.constructor = childConstructor;
    return childConstructor;
}

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

var jisonLexer = jisonJsonLexer;
// DOCS: by attaching this utility on the lexer instance we can invoke it from the generated lexer actions.
//       by calling 'this.buildTokenInstance(...). this is the part that 'connects' the Chevrotain Tokens and the jison lexer output
jisonLexer.buildTokenInstance = function (className) {
    var clazz = jsonTokens[className];
    return new clazz(this.yylloc.first_line, this.yylloc.first_column, this.yytext);
};

// ----------------- parser -----------------
var BaseRecognizer = chevrotain.recognizer.BaseIntrospectionRecognizer;

function JsonParser(input) {
    BaseRecognizer.call(this, input, jsonTokens);

    var _this = this;

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
    BaseRecognizer.performSelfAnalysis(this);
}

JsonParser.prototype = Object.create(BaseRecognizer.prototype);
JsonParser.prototype.constructor = JsonParser;

