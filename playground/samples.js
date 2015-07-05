var samples = {}

samples.json = function () {
    // ----------------- Lexer -----------------
    var Token = chevrotain.Token;
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
    WhiteSpace.GROUP = ChevrotainLexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.


    var jsonTokens = [WhiteSpace, NumberLiteral, StringLiteral, RCurly, LCurly, LSquare, RSquare, Comma, Colon, True, False, Null];
    var ChevJsonLexer = new ChevrotainLexer(jsonTokens);


    // ----------------- parser -----------------
    var ChevrotainParser = chevrotain.Parser;

    function ChevrotainJsonParser(input) {
        ChevrotainParser.call(this, input, jsonTokens);
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
        ChevrotainParser.performSelfAnalysis(this);
    }

    ChevrotainJsonParser.prototype = Object.create(ChevrotainParser.prototype);
    ChevrotainJsonParser.prototype.constructor = ChevrotainJsonParser;


    return ChevrotainJsonParser;
};


samples.calculator = function() {

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

    return Calculator;
    // TODO: need to return both Parser and Lexer and a method that chains them
    //return function (text) {
    //    var lexResult = CalculatorLexer.tokenize(text);
    //    if (lexResult.errors.length > 1) {
    //        throw new Error("sad sad panda, lexing errors detected")
    //    }
    //
    //    var parser = new Calculator(lexResult.tokens);
    //    var value = parser.expression(); // any exposed top level rule may be used as an entry point
    //    if (parser.errors.length > 1) {
    //        throw new Error("sad sad panda, parsing errors detected!")
    //    }
    //
    //    return value;
    //};
}

