"use strict"
/**
 * An Example of implementing a Calculator with separated grammar and semantics (actions).
 * This separation makes it easier to maintain the grammar and reuse it in different use cases.
 *
 * This is accomplished by using the automatic CST (Concrete Syntax Tree) output capabilities
 * of chevrotain.
 *
 * See farther details here:
 * https://github.com/SAP/chevrotain/blob/master/docs/concrete_syntax_tree.md
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
// Note that this is a Pure grammar, it only describes the grammar
// Not any actions (semantics) to perform during parsing.
function CalculatorPure(input) {
    Parser.call(this, input, allTokens, { outputCst: true })

    var $ = this

    $.RULE("expression", function() {
        $.SUBRULE($.additionExpression)
    })

    //  lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    $.RULE("additionExpression", function() {
        $.SUBRULE($.multiplicationExpression)
        $.MANY(function() {
            // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
            $.CONSUME(AdditionOperator)
            //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
            $.SUBRULE2($.multiplicationExpression)
        })
    })

    $.RULE("multiplicationExpression", function() {
        $.SUBRULE($.atomicExpression)
        $.MANY(function() {
            $.CONSUME(MultiplicationOperator)
            //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
            $.SUBRULE2($.atomicExpression)
        })
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
                    return $.CONSUME(NumberLiteral)
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
        $.CONSUME(LParen)
        $.SUBRULE($.expression)
        $.CONSUME(RParen)
    })

    $.RULE("powerFunction", function() {
        $.CONSUME(PowerFunc)
        $.CONSUME(LParen)
        $.SUBRULE($.expression)
        $.CONSUME(Comma)
        $.SUBRULE2($.expression)
        $.CONSUME(RParen)
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this)
}

CalculatorPure.prototype = Object.create(Parser.prototype)
CalculatorPure.prototype.constructor = CalculatorPure

// wrapping it all together
// reuse the same parser instance.
var parser = new CalculatorPure([])

// ----------------- Interpreter -----------------
// Obtains the default CstVisitor constructor to extend.
const BaseCstVisitor = parser.getBaseCstVisitorConstructor()

// All our semantics go into the visitor, completly separated from the grammar.
class CalculatorInterpreter extends BaseCstVisitor {
    constructor() {
        super()
        // This helper will detect any missing or redundant methods on this visitor
        this.validateVisitor()
    }

    expression(ctx) {
        return this.visit(ctx.additionExpression[0])
    }

    additionExpression(ctx) {
        let lhs = this.visit(ctx.multiplicationExpression[0])
        let result = lhs
        for (let i = 1; i < ctx.multiplicationExpression.length; i++) {
            // There is one less operator than operands
            let operator = ctx.AdditionOperator[i - 1]
            let rhs = this.visit(ctx.multiplicationExpression[i])

            if (tokenMatcher(operator, Plus)) {
                result += rhs
            } else {
                // Minus
                result -= rhs
            }
        }
        return result
    }

    multiplicationExpression(ctx) {
        let lhs = this.visit(ctx.atomicExpression[0])
        let result = lhs
        for (let i = 1; i < ctx.atomicExpression.length; i++) {
            // There is one less operator than operands
            let operator = ctx.MultiplicationOperator[i - 1]
            let rhs = this.visit(ctx.atomicExpression[i])

            if (tokenMatcher(operator, Multi)) {
                result *= rhs
            } else {
                // Division
                result /= rhs
            }
        }
        return result
    }

    atomicExpression(ctx) {
        if (ctx.parenthesisExpression.length > 0) {
            // TODO: allow accepting array for less verbose syntax
            return this.visit(ctx.parenthesisExpression[0])
        } else if (ctx.NumberLiteral.length > 0) {
            return parseInt(ctx.NumberLiteral[0].image, 10)
        } else if (ctx.powerFunction.length > 0) {
            return this.visit(ctx.powerFunction[0])
        }
    }

    parenthesisExpression(ctx) {
        // The ctx will also contain the parenthesis tokens, but we don't care about those
        // in the context of calculating the result.
        return this.visit(ctx.expression[0])
    }

    powerFunction(ctx) {
        let base = this.visit(ctx.expression[0])
        let exponent = this.visit(ctx.expression[1])
        return Math.pow(base, exponent)
    }
}

// We only need a single interpreter instance because our interpreter has no state.
const interpreter = new CalculatorInterpreter()

module.exports = function(text) {
    // 1. Tokenize the input.
    var lexResult = CalculatorLexer.tokenize(text)

    // 2. Parse the Tokens vector.
    parser.input = lexResult.tokens
    var cst = parser.expression()

    // 3. Perform semantics using a CstVisitor.
    // Note that separation of concerns between the syntactic analysis (parsing) and the semantics.
    var value = interpreter.visit(cst)

    return {
        value: value,
        lexResult: lexResult,
        parseErrors: parser.errors
    }
}
