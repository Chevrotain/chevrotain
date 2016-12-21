/*
 * Example Of using Grammar inheritance to support multiple versions of the same grammar.
 */

var chevrotain = require("chevrotain");

// ----------------- lexer -----------------
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
var createToken = chevrotain.createToken;

var Select = createToken({name: "Select", pattern: /SELECT/i});
var From = createToken({name: "From", pattern: /FROM/i});
var Where = createToken({name: "Where", pattern: /WHERE/i});
var Comma = createToken({name: "Comma", pattern: /,/});
var Identifier = createToken({name: "Identifier", pattern: /\w+/});
var Integer = createToken({name: "Integer", pattern: /0|[1-9]\d+/});
var GreaterThan = createToken({name: "GreaterThan", pattern: /</});
var LessThan = createToken({name: "LessThan", pattern: />/});
var WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED});

var allTokens = [WhiteSpace, Select, From, Where, Comma,
    Identifier, Integer, GreaterThan, LessThan];
var SelectLexer = new Lexer(allTokens);


// ----------------- parser -----------------
function SelectParserVersion1(input, isInvokedByChildConstructor) {

    if (isInvokedByChildConstructor === undefined) {
        isInvokedByChildConstructor = false
    }

    Parser.call(this, input, allTokens);
    var $ = this;


    $.RULE("selectStatement", function() {
        $.SUBRULE($.selectClause)
        $.SUBRULE($.fromClause)
        $.OPTION(function() {
            $.SUBRULE($.whereClause)
        })
    });


    $.RULE("selectClause", function() {
        $.CONSUME(Select);
        $.AT_LEAST_ONE_SEP(Comma, function() {
            $.CONSUME(Identifier);
        }, "column name");
    });


    // fromClause in version1 allows only a single column name.
    $.RULE("fromClause", function() {
        $.CONSUME(From);
        $.CONSUME(Identifier);
    });


    $.RULE("whereClause", function() {
        $.CONSUME(Where)
        $.SUBRULE($.expression)
    });


    $.RULE("expression", function() {
        $.SUBRULE($.atomicExpression);
        $.SUBRULE($.relationalOperator);
        $.SUBRULE2($.atomicExpression); // note the '2' suffix to distinguish
        // from the 'SUBRULE(atomicExpression)' 2 lines above.
    });


    $.RULE("atomicExpression", function() {
        $.OR([
            // @formatter:off
            { ALT: function() {$.CONSUME(Integer)}},
            { ALT: function() {$.CONSUME(Identifier)}}
            // @formatter:on
        ]);
    });


    $.RULE("relationalOperator", function() {
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

// reuse the same parser instances.
var version1Parser = new SelectParserVersion1([]);
var version2Parser = new SelectParserVersion2([]);

module.exports = function(text, version) {

    var lexResult = SelectLexer.tokenize(text);

    var parser;

    // initialize a parser for the specific version version chosen.
    switch (version) {
        case 1:
            parser = version1Parser;
            break;
        case 2:
            parser = version2Parser;
            break;
        default:
            throw Error("no valid version chosen")
    }

    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens;
    var value = parser.selectStatement();

    return {
        value:       value, // this is a pure grammar, the value will always be <undefined>
        lexErrors:   lexResult.errors,
        parseErrors: parser.errors
    };
};
