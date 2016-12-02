/*
 * Example Of using Token inheritance to support dynamically defined Tokens.
 * In this example an 'array' language [1, 2, 3, 4, ...] where additional delimiters can be
 * defined by the user instead of being limited to just the 'built in' comma delimiter.
 *
 * This is made possible because the Lexer itself is created directly in javascript (no code generation).
 * And the Token matching during parsing uses the 'instanceof' operator.
 * This the Parser need not be modified to support each new custom delimiter.
 *
 * Note that it is mandatory to enable the "dynamicTokensEnabled" config property for this capability to work.
 * Otherwise certain performance optimizations may break as those assume that the Token vocabulary is static.
 */

var chevrotain = require("../../../lib/chevrotain");

// ----------------- lexer -----------------
var extendToken = chevrotain.extendToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;


var LSquare = extendToken("LSquare", /\[/);
var RSquare = extendToken("RSquare", /]/);

// base delimiter classes
var BaseDelimiter = extendToken("BaseDelimiter", Lexer.NA)
var Comma = extendToken("Comma", /,/, BaseDelimiter);
var NumberLiteral = extendToken("NumberLiteral", /\d+/);
var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.


var allTokens = [
    WhiteSpace,
    LSquare,
    RSquare,
    BaseDelimiter,
    Comma,
    NumberLiteral
];

// ----------------- parser -----------------
function DynamicDelimiterParser(input) {
    // invoke super constructor
    Parser.call(this, input, allTokens, {
            // by default the error recovery / fault tolerance capabilities are disabled
            // use this flag to enable them
            recoveryEnabled:      true,
            // IMPORTANT: must be enabled to support dynamically defined Tokens
            dynamicTokensEnabled: true
        }
    );

    // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
    var $ = this;

    this.RULE("array", function() {
        var result = ""

        $.CONSUME(LSquare); // This will match any Token Class which extends BaseLeftDelimiter
        $.OPTION(function() {
            result += $.CONSUME(NumberLiteral).image;
            $.MANY(function() {
                $.CONSUME(BaseDelimiter);
                result += $.CONSUME2(NumberLiteral).image;
            });
        })
        $.CONSUME(RSquare); // This will match any Token Class which extends BaseRightDelimiter

        return result;
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}

// inheritance as implemented in javascript in the previous decade... :(
DynamicDelimiterParser.prototype = Object.create(Parser.prototype);
DynamicDelimiterParser.prototype.constructor = DynamicDelimiterParser;

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
var parser = new DynamicDelimiterParser([]);

module.exports = function(text, dynamicDelimiterRegExp) {

    // make this parameter optional
    if (dynamicDelimiterRegExp === undefined) {
        dynamicDelimiterRegExp = Lexer.NA
    }

    // dynamically create Token classes which extend the BaseXXXDelimiters
    var dynamicDelimiter = extendToken("dynamicDelimiter", dynamicDelimiterRegExp, BaseDelimiter)

    // dynamically create a Lexer which can Lex all our language including the dynamic delimiters.
    var dynamicDelimiterLexer = new Lexer(allTokens.concat([dynamicDelimiter]));

    // lex
    var lexResult = dynamicDelimiterLexer.tokenize(text);

    // parse
    // setting the input will reset the parser's state
    parser.input = lexResult.tokens;
    var value = parser.array();

    return {
        value:       value,
        lexErrors:   lexResult.errors,
        parseErrors: parser.errors
    };
};