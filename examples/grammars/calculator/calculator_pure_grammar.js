"use strict"
/**
 * An Example of implementing a Calculator with separated grammar and semantics (actions).
 * This separation makes it easier to maintain the grammar and reuse it in different use cases.
 *
 * This is accomplished by using the automatic CST (Concrete Syntax Tree) output capabilities
 * of chevrotain.
 *
 * See farther details here:
 * https://github.com/chevrotain/chevrotain/blob/master/docs/concrete_syntax_tree.md
 */
const { createToken, tokenMatcher, Lexer, CstParser } = require("chevrotain")

// ----------------- lexer -----------------
// using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
// AdditionOperator defines a Tokens hierarchy but only the leafs in this hierarchy define
// actual Tokens that can appear in the text
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
const CalculatorLexer = new Lexer(allTokens)

// ----------------- parser -----------------
// Note that this is a Pure grammar, it only describes the grammar
// Not any actions (semantics) to perform during parsing.
class CalculatorPure extends CstParser {
  // Unfortunately no support for class fields with initializer in ES2015, only in esNext...
  // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
  // invoking RULE(...)
  // see: https://github.com/jeffmo/es-class-fields-and-static-properties
  constructor() {
    super(allTokens)

    const $ = this

    $.RULE("expression", () => {
      $.SUBRULE($.additionExpression)
    })

    // Lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    $.RULE("additionExpression", () => {
      // using labels can make the CST processing easier
      $.SUBRULE($.multiplicationExpression, { LABEL: "lhs" })
      $.MANY(() => {
        // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
        $.CONSUME(AdditionOperator)
        //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
        $.SUBRULE2($.multiplicationExpression, { LABEL: "rhs" })
      })
    })

    $.RULE("multiplicationExpression", () => {
      $.SUBRULE($.atomicExpression, { LABEL: "lhs" })
      $.MANY(() => {
        $.CONSUME(MultiplicationOperator)
        //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
        $.SUBRULE2($.atomicExpression, { LABEL: "rhs" })
      })
    })

    $.RULE("atomicExpression", () => {
      $.OR([
        // parenthesisExpression has the highest precedence and thus it appears
        // in the "lowest" leaf in the expression ParseTree.
        { ALT: () => $.SUBRULE($.parenthesisExpression) },
        { ALT: () => $.CONSUME(NumberLiteral) },
        { ALT: () => $.SUBRULE($.powerFunction) }
      ])
    })

    $.RULE("parenthesisExpression", () => {
      $.CONSUME(LParen)
      $.SUBRULE($.expression)
      $.CONSUME(RParen)
    })

    $.RULE("powerFunction", () => {
      $.CONSUME(PowerFunc)
      $.CONSUME(LParen)
      $.SUBRULE($.expression, { LABEL: "base" })
      $.CONSUME(Comma)
      $.SUBRULE2($.expression, { LABEL: "exponent" })
      $.CONSUME(RParen)
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis()
  }
}

// wrapping it all together
// reuse the same parser instance.
const parser = new CalculatorPure([])

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
    // visiting an array is equivalent to visiting its first element.
    return this.visit(ctx.additionExpression)
  }

  // Note the usage if the "rhs" and "lhs" labels to increase the readability.
  additionExpression(ctx) {
    let result = this.visit(ctx.lhs)

    // "rhs" key may be undefined as the grammar defines it as optional (MANY === zero or more).
    if (ctx.rhs) {
      ctx.rhs.forEach((rhsOperand, idx) => {
        // there will be one operator for each rhs operand
        let rhsValue = this.visit(rhsOperand)
        let operator = ctx.AdditionOperator[idx]

        if (tokenMatcher(operator, Plus)) {
          result += rhsValue
        } else {
          // Minus
          result -= rhsValue
        }
      })
    }

    return result
  }

  multiplicationExpression(ctx) {
    let result = this.visit(ctx.lhs)

    // "rhs" key may be undefined as the grammar defines it as optional (MANY === zero or more).
    if (ctx.rhs) {
      ctx.rhs.forEach((rhsOperand, idx) => {
        // there will be one operator for each rhs operand
        let rhsValue = this.visit(rhsOperand)
        let operator = ctx.MultiplicationOperator[idx]

        if (tokenMatcher(operator, Multi)) {
          result *= rhsValue
        } else {
          // Division
          result /= rhsValue
        }
      })
    }

    return result
  }

  atomicExpression(ctx) {
    if (ctx.parenthesisExpression) {
      return this.visit(ctx.parenthesisExpression)
    } else if (ctx.NumberLiteral) {
      return parseInt(ctx.NumberLiteral[0].image, 10)
    } else if (ctx.powerFunction) {
      return this.visit(ctx.powerFunction)
    }
  }

  parenthesisExpression(ctx) {
    // The ctx will also contain the parenthesis tokens, but we don't care about those
    // in the context of calculating the result.
    return this.visit(ctx.expression)
  }

  powerFunction(ctx) {
    const base = this.visit(ctx.base)
    const exponent = this.visit(ctx.exponent)
    return Math.pow(base, exponent)
  }
}

// We only need a single interpreter instance because our interpreter has no state.
const interpreter = new CalculatorInterpreter()

module.exports = function (text) {
  // 1. Tokenize the input.
  const lexResult = CalculatorLexer.tokenize(text)

  // 2. Parse the Tokens vector.
  parser.input = lexResult.tokens
  const cst = parser.expression()

  // 3. Perform semantics using a CstVisitor.
  // Note that separation of concerns between the syntactic analysis (parsing) and the semantics.
  const value = interpreter.visit(cst)

  return {
    value: value,
    lexResult: lexResult,
    parseErrors: parser.errors
  }
}
