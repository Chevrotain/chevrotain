"use strict"
/**
 * An Example of implementing a Calculator with embedded actions (semantics).
 *
 * Embedded actions mean that the semantics of the grammar (in our case the calculation of the numerical result)
 * are written as part of (inside) the grammar rules.
 *
 * This can be useful for simple use cases and it is also very fast.
 * It can become very verbose for complex use cases, see the same grammar with separated semantics
 * for an alternative:
 * https://github.com/chevrotain/chevrotain/blob/master/examples/grammars/calculator/calculator_pure_grammar.js
 */
const {
  createToken,
  Lexer,
  EmbeddedActionsParser,
  tokenMatcher
} = require("chevrotain")

// ----------------- lexer -----------------
// using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
// AdditionOperator defines a Tokens category, The parser can match against such categories
// as a convenience to reduce verbosity.
const AdditionOperator = createToken({
  name: "AdditionOperator",
  pattern: Lexer.NA
})
const Plus = createToken({
  name: "Plus",
  pattern: /\+/,
  categories: AdditionOperator
})
const Minus = createToken({
  name: "Minus",
  pattern: /-/,
  categories: AdditionOperator
})

const MultiplicationOperator = createToken({
  name: "MultiplicationOperator",
  pattern: Lexer.NA
})
const Multi = createToken({
  name: "Multi",
  pattern: /\*/,
  categories: MultiplicationOperator
})
const Div = createToken({
  name: "Div",
  pattern: /\//,
  categories: MultiplicationOperator
})

const LParen = createToken({ name: "LParen", pattern: /\(/ })
const RParen = createToken({ name: "RParen", pattern: /\)/ })
const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /[1-9]\d*/
})

const PowerFunc = createToken({ name: "PowerFunc", pattern: /power/ })
const Comma = createToken({ name: "Comma", pattern: /,/ })

// marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const allTokens = [
  // whitespace is normally very common so it should be placed first to speed up the lexer's performance
  WhiteSpace,
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
const CalculatorLexer = new Lexer(allTokens)

// ----------------- parser -----------------
// We must extend `EmbeddedActionsParser` to enable support
// for output based on the embedded actions.
class Calculator extends EmbeddedActionsParser {
  // Unfortunately no support for class fields with initializer in ES2015, only in esNext...
  // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
  // invoking RULE(...)
  // see: https://github.com/jeffmo/es-class-fields-and-static-properties
  constructor() {
    super(allTokens)

    const $ = this

    $.RULE("expression", () => {
      return $.SUBRULE($.additionExpression)
    })

    //  lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    $.RULE("additionExpression", () => {
      let value, op, rhsVal

      // parsing part
      value = $.SUBRULE($.multiplicationExpression)
      $.MANY(() => {
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

    $.RULE("multiplicationExpression", () => {
      let value, op, rhsVal

      // parsing part
      value = $.SUBRULE($.atomicExpression)
      $.MANY(() => {
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

    $.RULE("atomicExpression", () => {
      return $.OR([
        // parenthesisExpression has the highest precedence and thus it appears
        // in the "lowest" leaf in the expression ParseTree.
        { ALT: () => $.SUBRULE($.parenthesisExpression) },
        { ALT: () => parseInt($.CONSUME(NumberLiteral).image, 10) },
        { ALT: () => $.SUBRULE($.powerFunction) }
      ])
    })

    $.RULE("parenthesisExpression", () => {
      let expValue

      $.CONSUME(LParen)
      expValue = $.SUBRULE($.expression)
      $.CONSUME(RParen)

      return expValue
    })

    $.RULE("powerFunction", () => {
      let base, exponent

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
    this.performSelfAnalysis()
  }
}

// reuse the same parser instance.
const parser = new Calculator()

// wrapping it all together
module.exports = function (text) {
  const lexResult = CalculatorLexer.tokenize(text)
  // setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens
  // any top level rule may be used as an entry point
  const value = parser.expression()

  return {
    value: value,
    lexResult: lexResult,
    parseErrors: parser.errors
  }
}
