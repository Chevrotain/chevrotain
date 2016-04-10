/*
* Example Of using Grammar inheritance to support multiple versions of the same grammar.
*/

var chevrotain = require("chevrotain");

// ----------------- lexer -----------------
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
var extendToken = chevrotain.extendToken;

var Select = extendToken("Select", /SELECT/i);
var From = extendToken("From", /FROM/i);
var Where = extendToken("Where", /WHERE/i);
var Comma = extendToken("Comma", /,/);
var Identifier = extendToken("Identifier", /\w+/);
var Integer = extendToken("Integer", /0|[1-9]\d+/);
var GreaterThan = extendToken("GreaterThan", /</);
var LessThan = extendToken("LessThan", />/);
var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED;

var allTokens = [WhiteSpace, Select, From, Where, Comma,
    Identifier, Integer, GreaterThan, LessThan];
var SelectLexer = new Lexer(allTokens, true);


// ----------------- parser -----------------
function SelectParserVersion1(input, isInvokedByChildConstructor) {

    if (isInvokedByChildConstructor === undefined) {
        isInvokedByChildConstructor = false
    }

    Parser.call(this, input, allTokens);
    var $ = this;


    this.selectStatement = $.RULE("selectStatement", function() {
        $.SUBRULE($.selectClause)
        $.SUBRULE($.fromClause)
        $.OPTION(function() {
            $.SUBRULE($.whereClause)
        })
    });


    this.selectClause = $.RULE("selectClause", function() {
        $.CONSUME(Select);
        $.AT_LEAST_ONE_SEP(Comma, function() {
            $.CONSUME(Identifier);
        }, "column name");
    });


    // fromClause in version1 allows only a single column name.
    this.fromClause = $.RULE("fromClause", function() {
        $.CONSUME(From);
        $.CONSUME(Identifier);
    });


    this.whereClause = $.RULE("whereClause", function() {
        $.CONSUME(Where)
        $.SUBRULE($.expression)
    });


    this.expression = $.RULE("expression", function() {
        $.SUBRULE($.atomicExpression);
        $.SUBRULE($.relationalOperator);
        $.SUBRULE2($.atomicExpression); // note the '2' suffix to distinguish
        // from the 'SUBRULE(atomicExpression)' 2 lines above.
    });


    this.atomicExpression = $.RULE("atomicExpression", function() {
        $.OR([
            // @formatter:off
            { ALT: function() {$.CONSUME(Integer)}},
            { ALT: function() {$.CONSUME(Identifier)}}
            // @formatter:on
        ]);
    });


    this.relationalOperator = $.RULE("relationalOperator", function() {
        $.OR([
            // @formatter:off
            {ALT: function() {$.CONSUME(GreaterThan)}},
            {ALT: function() {$.CONSUME(LessThan)}}
            // @formatter:on
        ]);
    });

    // the selfAnalysis must only be performed ONCE during grammar construction.
    // that invocation should be the in the LAST (bottom of the hierarchy) grammar.
    // of in inheritance chain.
    if (!isInvokedByChildConstructor) {
        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }
}


// V1 extends the base chevrotain Parser.
SelectParserVersion1.prototype = Object.create(Parser.prototype);
SelectParserVersion1.prototype.constructor = SelectParserVersion1;


// note that chevrotain caches information using the parser's name as the key
// this means that different grammar versions require separate implementing classes with different names.
function SelectParserVersion2(input) {
    // V2 extends V1
    SelectParserVersion1.call(this, input, true);
    var $ = this;

    // "fromClause" production in version2 is overridden to allow multiple table names.
    this.fromClause = $.OVERRIDE_RULE("fromClause", function() {
        $.CONSUME(From);
        $.AT_LEAST_ONE_SEP(Comma, function() {
            $.CONSUME(Identifier);
        });
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}

// V2 extends V1.
SelectParserVersion2.prototype = Object.create(SelectParserVersion1.prototype);
SelectParserVersion2.prototype.constructor = SelectParserVersion2;


// ----------------- wrapping it all together -----------------
module.exports = function(text, version) {

    var fullResult = {};
    var lexResult = SelectLexer.tokenize(text);
    fullResult.tokens = lexResult.tokens;
    fullResult.ignored = lexResult.ignored;
    fullResult.lexErrors = lexResult.errors;

    var parser;

    // initialize a parser for the specific version version chosen.
    switch (version) {
        case 1:
            parser = new SelectParserVersion1(lexResult.tokens);
            break;
        case 2:
            parser = new SelectParserVersion2(lexResult.tokens);
            break;
        default:
            throw Error("no version chosen")
    }

    parser.selectStatement();
    fullResult.parseErrors = parser.errors;

    return fullResult;
};
