// Written Docs for this tutorial step can be found here:
// https://chevrotain.io/docs/tutorial/step1_lexing.html

// Tutorial Step 1:
// Implementation of A lexer for a simple SELECT statement grammar
import { createToken, Lexer } from "chevrotain"

// the vocabulary will be exported and used in the Parser definition.
// export const tokenVocabulary = {}

// createToken is used to create a TokenType
// The Lexer's output will contain an array of token Objects created by metadata
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z]\w*/
})

// We specify the "longer_alt" property to resolve keywords vs identifiers ambiguity.
// See: https://github.com/chevrotain/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
export const Select = createToken({
  name: "Select",
  pattern: /SELECT/,
  longer_alt: Identifier
})

export const From = createToken({
  name: "From",
  pattern: /FROM/,
  longer_alt: Identifier
})
export const Where = createToken({
  name: "Where",
  pattern: /WHERE/,
  longer_alt: Identifier
})

export const Comma = createToken({ name: "Comma", pattern: /,/ })
export const Integer = createToken({ name: "Integer", pattern: /0|[1-9]\d*/ })
export const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ })
export const LessThan = createToken({ name: "LessThan", pattern: /</ })
export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

// The order of tokens is important
export const allTokens = [
  WhiteSpace,
  // "keywords" appear before the Identifier
  Select,
  From,
  Where,
  Comma,
  // The Identifier must appear after the keywords because all keywords are valid identifiers.
  Identifier,
  Integer,
  GreaterThan,
  LessThan
]

export const selectLexer = new Lexer(allTokens)

export function lex(inputText) {
  const lexingResult = selectLexer.tokenize(inputText)

  if (lexingResult.errors.length > 0) {
    throw Error("Sad Sad Panda, lexing errors detected")
  }

  return lexingResult
}
