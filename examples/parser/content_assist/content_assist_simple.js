/*
 * Example Of using Chevrotain's built in syntactic content assist
 * To implement semantic content assist and content assist on partial inputs.
 *
 * Examples:
 * "Public static " --> ["function"]
 * "Public sta" --> ["static"]
 * "call f" --> ["foo"] // assuming foo is in the symbol table.
 */
const _ = require("lodash")
const { createToken, Lexer, CstParser } = require("chevrotain")

const A = createToken({ name: "A", pattern: /A/ })
const B = createToken({ name: "B", pattern: /B/ })
const C = createToken({ name: "C", pattern: /C/ })

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const allTokens = [WhiteSpace, A, B, C]
const StatementsLexer = new Lexer(allTokens)

// A completely normal Chevrotain Parser, no changes needed to use the content assist capabilities.
class MyParser extends CstParser {
  constructor() {
    super(allTokens)

    let $ = this

    $.RULE("myRule", () => {
      $.CONSUME(A)

      // prettier-ignore
      $.OR([
                    { ALT: () => $.CONSUME(B) },
                    { ALT: () => $.CONSUME(C) }
                ])
    })

    this.performSelfAnalysis()
  }
}

// No need for more than one instance.
const parserInstance = new MyParser()

function getContentAssistSuggestions(text) {
  const lexResult = StatementsLexer.tokenize(text)
  if (lexResult.errors.length > 0) {
    throw new Error("sad sad panda, lexing errors detected")
  }
  const partialTokenVector = lexResult.tokens

  const syntacticSuggestions = parserInstance.computeContentAssist(
    "myRule",
    partialTokenVector
  )

  // The suggestions also include the context, we are only interested
  // in the TokenTypes in this example.
  const tokenTypesSuggestions = syntacticSuggestions.map(
    suggestion => suggestion.nextTokenType
  )

  return tokenTypesSuggestions
}

module.exports = {
  A,
  B,
  C,
  getContentAssistSuggestions: getContentAssistSuggestions
}
