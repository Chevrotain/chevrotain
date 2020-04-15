const { createToken, Lexer } = require("chevrotain")

const A = createToken({ name: "A", pattern: /A/ })
const B = createToken({ name: "B", pattern: /B/ })
const C = createToken({ name: "C", pattern: /C/ })
const Whitespace = createToken({
  name: "Whitespace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

// A link to the detailed API for the ILexerErrorMessageProvider can be found here:
// https://sap.github.io/chevrotain/docs/features/custom_errors.htmlconst OyVeyErrorMessageProvider = {
const OyVeyErrorMessageProvider = {
  buildUnexpectedCharactersMessage(
    fullText,
    startOffset,
    length,
    line,
    column
  ) {
    return (
      `Oy Vey!!! unexpected character: ->${fullText.charAt(
        startOffset
      )}<- at offset: ${startOffset},` + ` skipped ${length} characters.`
    )
  }
}

const CustomErrorsLexer = new Lexer([Whitespace, A, B, C], {
  errorMessageProvider: OyVeyErrorMessageProvider
})

module.exports = {
  tokenize: function (text) {
    const lexResult = CustomErrorsLexer.tokenize(text)
    return lexResult
  }
}
