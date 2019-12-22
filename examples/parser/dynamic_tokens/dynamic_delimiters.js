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

const { createToken, Lexer, EmbeddedActionsParser } = require("chevrotain")

// ----------------- lexer -----------------
const LSquare = createToken({ name: "LSquare", pattern: /\[/ })
const RSquare = createToken({ name: "RSquare", pattern: /]/ })

// base delimiter TokenTypes
const BaseDelimiter = createToken({ name: "BaseDelimiter", pattern: Lexer.NA })
const Comma = createToken({
  name: "Comma",
  pattern: /,/,
  categories: BaseDelimiter
})
const NumberLiteral = createToken({ name: "NumberLiteral", pattern: /\d+/ })
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const allTokens = [
  WhiteSpace,
  LSquare,
  RSquare,
  BaseDelimiter,
  Comma,
  NumberLiteral
]

// ----------------- parser -----------------
// TODO: change to ES6 classes
function DynamicDelimiterParser() {
  // invoke super constructor
  EmbeddedActionsParser.call(this, allTokens, {
    // by default the error recovery / fault tolerance capabilities are disabled
    // use this flag to enable them
    recoveryEnabled: true,
    // IMPORTANT: must be enabled to support dynamically defined Tokens
    dynamicTokensEnabled: true
  })

  // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
  const $ = this

  this.RULE("array", () => {
    let result = ""

    $.CONSUME(LSquare) // This will match any Token Class which extends BaseLeftDelimiter
    $.OPTION(() => {
      result += $.CONSUME(NumberLiteral).image
      $.MANY(() => {
        $.CONSUME(BaseDelimiter)
        result += $.CONSUME2(NumberLiteral).image
      })
    })
    $.CONSUME(RSquare) // This will match any Token Class which extends BaseRightDelimiter

    return result
  })

  // very important to call this after all the rules have been defined.
  // otherwise the parser may not work correctly as it will lack information
  // derived during the self analysis phase.
  this.performSelfAnalysis()
}

// inheritance as implemented in javascript in the previous decade... :(
DynamicDelimiterParser.prototype = Object.create(
  EmbeddedActionsParser.prototype
)
DynamicDelimiterParser.prototype.constructor = DynamicDelimiterParser

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new DynamicDelimiterParser()

module.exports = function(text, dynamicDelimiterRegExp) {
  // make this parameter optional
  if (dynamicDelimiterRegExp === undefined) {
    dynamicDelimiterRegExp = Lexer.NA
  }

  // dynamically create Token classes which extend the BaseXXXDelimiters
  const dynamicDelimiter = createToken({
    name: "dynamicDelimiter",
    pattern: dynamicDelimiterRegExp,
    categories: BaseDelimiter
  })

  // dynamically create a Lexer which can Lex all our language including the dynamic delimiters.
  const dynamicDelimiterLexer = new Lexer(allTokens.concat([dynamicDelimiter]))

  // lex
  const lexResult = dynamicDelimiterLexer.tokenize(text)

  // setting the input will reset the parser's state
  parser.input = lexResult.tokens
  // parse
  const value = parser.array()

  return {
    value: value,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors
  }
}
