var samples = {}

samples.json = function () {
    // ----------------- Lexer -----------------
    var extendToken = chevrotain.extendToken;
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
    var StringLiteral = extendToken("StringLiteral", /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral", /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = ChevrotainLexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' causes the lexer skip such tokens.


    var jsonTokens = [WhiteSpace, NumberLiteral, StringLiteral, RCurly, LCurly, LSquare, RSquare, Comma, Colon, True, False, Null];
    var ChevJsonLexer = new ChevrotainLexer(jsonTokens);


    // ----------------- parser -----------------
    var ChevrotainParser = chevrotain.Parser;

    function ChevrotainJsonParser(input) {
        ChevrotainParser.call(this, input, jsonTokens);
        var $ = this;

        this.object = this.RULE("object", function () {
            var obj = {}

            $.CONSUME(LCurly);
            $.OPTION(function () {
                _.assign(obj, $.SUBRULE($.objectItem));
                $.MANY(function () {
                    $.CONSUME(Comma);
                    _.assign(obj, $.SUBRULE2($.objectItem)); // note the usage of '2' suffix. this is done to distinguish it from
                });                           // 'SUBRULE($.objectItem)' three lines above. The combination of index
            });                               // and invoked subrule is used as a key to mark the current position in the
            $.CONSUME(RCurly);                // grammar by the parser engine.

            return obj;
        });

        this.objectItem = this.RULE("objectItem", function () {
            var key, value, obj = {};

            key = $.CONSUME(StringLiteral).image;
            $.CONSUME(Colon);
            value = $.SUBRULE($.value);

            obj[key] = value;
            return obj;
        });

        this.array = this.RULE("array", function () {
            var arr = []
            $.CONSUME(LSquare);
            $.OPTION(function () {
                arr.push($.SUBRULE($.value));
                $.MANY(function () {
                    $.CONSUME(Comma);
                    arr.push($.SUBRULE2($.value)); // once again note the usage of '2' suffix
                });
            });
            $.CONSUME(RSquare);
        });

        // @formatter:off
        this.value = this.RULE("value", function () {
            return $.OR([
                { ALT: function () {
                    var stringLiteral = $.CONSUME(StringLiteral).image
                    return stringLiteral.substr(1, stringLiteral - 2); // chop of the quotation marks
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
            ], "a value");
        });
        // @formatter:on

        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        ChevrotainParser.performSelfAnalysis(this);
    }

    ChevrotainJsonParser.prototype = Object.create(ChevrotainParser.prototype);
    ChevrotainJsonParser.prototype.constructor = ChevrotainJsonParser;

    // for the playground to work the returned object must contain these two fields
    return {
        lexer      : ChevJsonLexer,
        parser     : ChevrotainJsonParser,
        defaultRule: "object"
    };

};

samples.json.exampleInput = '{"firstName": "John", "lastName": "Smith", "isAlive": true, "age": 25}'

samples.calculator = function () {

    // ----------------- lexer -----------------
    var extendToken = chevrotain.extendToken;
    var Lexer = chevrotain.Lexer;
    var Parser = chevrotain.Parser;

    // using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
    // AdditionOperator defines a Tokens hierarchy but only leafs in this hierarchy define
    // actual Tokens that can appear in the text
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
    WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

    var allTokens = [WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
        Plus, Minus, Multi, Div, LParen, RParen, NumberLiteral, AdditionOperator, MultiplicationOperator];
    var CalculatorLexer = new Lexer(allTokens);


    // ----------------- parser -----------------
    function Calculator(input) {
        Parser.call(this, input, allTokens);

        var $ = this;

        $.expression = $.RULE("expression", function () {
            return $.SUBRULE($.additionExpression)
        });

        //  lowest precedence thus it is first in the rule chain
        // The precedence of binary expressions is determined by how far down the Parse Tree
        // The binary expression appears.
        $.additionExpression = $.RULE("additionExpression", function () {
            var value, op, rhsVal;

            // parsing part
            value = $.SUBRULE($.multiplicationExpression);
            $.MANY(function () {
                // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
                op = $.CONSUME(AdditionOperator);
                //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
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


        $.multiplicationExpression = $.RULE("multiplicationExpression", function () {
            var value, op, rhsVal;

            // parsing part
            value = $.SUBRULE($.atomicExpression);
            $.MANY(function () {
                op = $.CONSUME(MultiplicationOperator);
                //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
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


        $.atomicExpression = $.RULE("atomicExpression", function () {
            // @formatter:off
            return $.OR([
                // parenthesisExpression has the highest precedence and thus it appears
                // in the "lowest" leaf in the expression ParseTree.
                {ALT: function(){ return $.SUBRULE($.parenthesisExpression)}},
                {ALT: function(){ return parseInt($.CONSUME(NumberLiteral).image, 10)}}
            ], "a number or parenthesis expression");
            // @formatter:on
        });

        $.parenthesisExpression = $.RULE("parenthesisExpression", function () {
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

    // avoids inserting number literals as these can have multiple(and infinite) semantic values, thus it is unlikely
    // we can choose the correct number value to insert.
    Calculator.prototype.canTokenTypeBeInsertedInRecovery = function (tokClass) {
        return tokClass !== NumberLiteral
    };


    Calculator.prototype = Object.create(Parser.prototype);
    Calculator.prototype.constructor = Calculator;

    // for the playground to work the returned object must contain these two fields
    return {
        lexer      : CalculatorLexer,
        parser     : Calculator,
        defaultRule: "expression"
    };
}

samples.calculator.exampleInput = "2 * ( 3 + 7)"
