/**
 * This example demonstrate usage of custom token patterns
 * With Custom payloads.
 *
 * Custom payloads allow attaching additional information on the IToken objects
 * For additional details see the docs:
 * https://chevrotain.io/docs/guide/custom_token_patterns.html#custom-payloads
 */
import { createToken, Lexer } from "chevrotain"

// First lets define our custom patterns for matching an Integer Literal.
// This function's signature is **similar** to the RegExp.prototype.exec function.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec

// We define the regExp only **once** (outside) to avoid performance issues.
const stringLiteralPattern = /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/y
function matchStringLiteral(text, startOffset) {
  // using 'y' sticky flag (Note it is not supported on IE11...)
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
  stringLiteralPattern.lastIndex = startOffset

  // Note that just because we are using a custom token pattern
  // Does not mean we cannot implement it using JavaScript Regular Expressions...
  const execResult = stringLiteralPattern.exec(text)
  if (execResult !== null) {
    const fullMatch = execResult[0]
    // compute the payload
    const matchWithOutQuotes = fullMatch.substr(1, fullMatch.length - 2)
    // attach the payload
    execResult.payload = matchWithOutQuotes
  }

  return execResult
}

// - Define the regExp only **once** (outside) to avoid performance issues.
// - Note we are using regExp **capturing groups** to collect sub matches.
const datePattern = /(\d\d?)-(\d\d?)-(\d\d\d\d)/y
function matchDateLiteral(text, startOffset) {
  // using 'y' sticky flag (Note it is not supported on IE11...)
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
  datePattern.lastIndex = startOffset

  // Note that just because we are using a custom token pattern
  // Does not mean we cannot implement it using JavaScript Regular Expressions...
  const execResult = datePattern.exec(text)
  if (execResult !== null) {
    // Compute the payload.
    // Note we are accessing the capturing groups sub matches.
    const dayValue = parseInt(execResult[1], 10)
    const monthValue = parseInt(execResult[2], 10)
    const yearValue = parseInt(execResult[3], 10)

    // attach the payload
    execResult.payload = {
      day: dayValue,
      month: monthValue,
      year: yearValue
    }
  }

  return execResult
}

// Now we can simply replace the regExp pattern with our custom pattern.
export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: matchStringLiteral,
  // custom patterns should explicitly specify the line_breaks option.
  line_breaks: false
})

// Now we can simply replace the regExp pattern with our custom pattern.
export const DateLiteral = createToken({
  name: "DateLiteral",
  pattern: matchDateLiteral,
  // custom patterns should explicitly specify the line_breaks option.
  line_breaks: false
})

const Whitespace = createToken({
  name: "Whitespace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const customPatternsLexer = new Lexer([Whitespace, StringLiteral, DateLiteral])

export function tokenize(text) {
  const lexResult = customPatternsLexer.tokenize(text)

  if (lexResult.errors.length > 0) {
    throw new Error("sad sad panda lexing errors detected")
  }
  return lexResult
}
