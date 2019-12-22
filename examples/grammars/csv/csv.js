"use strict"
/**
 * An Example of implementing a CSV Grammar with Chevrotain.
 *
 * Based on: https://github.com/antlr/grammars-v4/blob/master/csv/CSV.g4
 *
 * Note that this is a pure grammar without any actions (either embedded or via a CST Visitor).
 */
const { createToken, Lexer, CstParser, EMPTY_ALT } = require("chevrotain")

// ----------------- lexer -----------------
const Text = createToken({ name: "Text", pattern: /[^,\n\r"]+/ })
const Comma = createToken({ name: "Comma", pattern: /,/ })
const NewLine = createToken({
  name: "NewLine",
  pattern: /\r?\n/
})
const String = createToken({ name: "String", pattern: /"(?:""|[^"])*"/ })

const allTokens = [Text, String, Comma, NewLine]
const CsvLexer = new Lexer(allTokens)

// Parser
class CsvParser extends CstParser {
  constructor() {
    super(allTokens)

    // not mandatory, using $ (or any other sign) to reduce verbosity
    const $ = this

    $.RULE("csvFile", () => {
      $.SUBRULE($.hdr)
      $.AT_LEAST_ONE(() => {
        $.SUBRULE2($.row)
      })
    })

    $.RULE("hdr", () => {
      $.SUBRULE($.row)
    })

    $.RULE("row", () => {
      $.SUBRULE($.field)
      $.MANY(() => {
        $.CONSUME(Comma)
        $.SUBRULE2($.field)
      })
      $.CONSUME(NewLine)
    })

    $.RULE("field", () => {
      $.OR([
        { ALT: () => $.CONSUME(Text) },
        { ALT: () => $.CONSUME(String) },
        { ALT: EMPTY_ALT("empty field") }
      ])
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis()
  }
}

// wrapping it all together
// reuse the same parser instance.
const parser = new CsvParser([])

module.exports = function(text) {
  // 1. Tokenize the input.
  const lexResult = CsvLexer.tokenize(text)

  // 2. Set the Parser's input
  parser.input = lexResult.tokens

  // 3. invoke the desired parser rule
  const cst = parser.csvFile()

  return {
    cst: cst,
    lexResult: lexResult,
    parseErrors: parser.errors
  }
}
