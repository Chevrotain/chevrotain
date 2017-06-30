"use strict"
/**
 * An Example of implementing a Calculator with embedded actions (semantics).
 *
 * Embedded actions mean that the semantics of the grammar (in our case the calculation of the numerical result)
 * are written as part of (inside) the grammar rules.
 *
 * This can be useful for simple use cases and it is also very fast.
 * However for complex use cases see the same grammar with separated semantics:
 * https://github.com/SAP/chevrotain/blob/master/examples/grammars/calculator/calculator_pure_grammar.js
 */
var chevrotain = require("chevrotain")

// ----------------- lexer -----------------
var createToken = chevrotain.createToken
var tokenMatcher = chevrotain.tokenMatcher
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser

// using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
// AdditionOperator defines a Tokens hierarchy but only the leafs in this hierarchy define
// actual Tokens that can appear in the text
var AdditionOperator = createToken({
    name: "AdditionOperator",
    pattern: Lexer.NA
})
var Plus = createToken({
    name: "Plus",
    pattern: /\+/,
    parent: AdditionOperator
})
var Minus = createToken({
    name: "Minus",
    pattern: /-/,
    parent: AdditionOperator
})

var MultiplicationOperator = createToken({
    name: "MultiplicationOperator",
    pattern: Lexer.NA
})
var Multi = createToken({
    name: "Multi",
    pattern: /\*/,
    parent: MultiplicationOperator
})
var Div = createToken({
    name: "Div",
    pattern: /\//,
    parent: MultiplicationOperator
})

var LParen = createToken({ name: "LParen", pattern: /\(/ })
var RParen = createToken({ name: "RParen", pattern: /\)/ })
var NumberLiteral = createToken({ name: "NumberLiteral", pattern: /[1-9]\d*/ })

var PowerFunc = createToken({ name: "PowerFunc", pattern: /power/ })
var Comma = createToken({ name: "Comma", pattern: /,/ })

// marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
var WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

var allTokens = [
    WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
    Plus,
    Minus,
    Multi,
    Div,
    LParen,
    RParen,
    NumberLiteral,
    AdditionOperator,
    MultiplicationOperator,
    PowerFunc,
    Comma
]
var CalculatorLexer = new Lexer(allTokens)

// ----------------- parser -----------------
function Calculator(input) {
    Parser.call(this, input, allTokens)

    var $ = this

    $.RULE("expression", function() {
        return $.SUBRULE($.additionExpression)
    })

    //  lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    $.RULE("additionExpression", function() {
        var value, op, rhsVal

        // parsing part
        value = $.SUBRULE($.multiplicationExpression)
        $.MANY(function() {
            // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
            op = $.CONSUME(AdditionOperator)
            //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
            rhsVal = $.SUBRULE2($.multiplicationExpression)

            // interpreter part
            if (tokenMatcher(op, Plus)) {
                value += rhsVal
            } else {
                // op instanceof Minus
                value -= rhsVal
            }
        })

        return value
    })

    $.RULE("multiplicationExpression", function() {
        var value, op, rhsVal

        // parsing part
        value = $.SUBRULE($.atomicExpression)
        $.MANY(function() {
            op = $.CONSUME(MultiplicationOperator)
            //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
            rhsVal = $.SUBRULE2($.atomicExpression)

            // interpreter part
            if (tokenMatcher(op, Multi)) {
                value *= rhsVal
            } else {
                // op instanceof Div
                value /= rhsVal
            }
        })

        return value
    })

    $.RULE("atomicExpression", function() {
        return $.OR([
            // parenthesisExpression has the highest precedence and thus it appears
            // in the "lowest" leaf in the expression ParseTree.
            {
                ALT: function() {
                    return $.SUBRULE($.parenthesisExpression)
                }
            },
            {
                ALT: function() {
                    return parseInt($.CONSUME(NumberLiteral).image, 10)
                }
            },
            {
                ALT: function() {
                    return $.SUBRULE($.powerFunction)
                }
            }
        ])
    })

    $.RULE("parenthesisExpression", function() {
        var expValue

        $.CONSUME(LParen)
        expValue = $.SUBRULE($.expression)
        $.CONSUME(RParen)

        return expValue
    })

    $.RULE("powerFunction", function() {
        var base, exponent

        $.CONSUME(PowerFunc)
        $.CONSUME(LParen)
        base = $.SUBRULE($.expression)
        $.CONSUME(Comma)
        exponent = $.SUBRULE2($.expression)
        $.CONSUME(RParen)

        return Math.pow(base, exponent)
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this)
}

// avoids inserting number literals as these can have multiple(and infinite) semantic values, thus it is unlikely
// we can choose the correct number value to insert.
Calculator.prototype.canTokenTypeBeInsertedInRecovery = function(tokClass) {
    return tokClass !== NumberLiteral
}

Calculator.prototype = Object.create(Parser.prototype)
Calculator.prototype.constructor = Calculator

// wrapping it all together
// reuse the same parser instance.
var parser = new Calculator([])

module.exports = function(text) {
    var lexResult = CalculatorLexer.tokenize(text)
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    var value = parser.expression()

    return {
        value: value,
        lexResult: lexResult,
        parseErrors: parser.errors
    }
}
