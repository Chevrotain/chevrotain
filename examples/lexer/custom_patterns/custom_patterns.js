/**
 * This example demonstrate usage of custom token patterns.
 * custom token patterns allow implementing token matchers using arbitrary JavaScript code
 * instead of being limited to only using regular expressions.
 *
 * For additional details see the docs:
 * https://sap.github.io/chevrotain/docs/guide/custom_token_patterns.html
 */
const { createToken, Lexer } = require("chevrotain")

// First lets define our custom pattern for matching an Integer Literal.
// This function's signature matches the RegExp.prototype.exec function.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
function matchInteger(text, startOffset) {
    let endOffset = startOffset
    let charCode = text.charCodeAt(endOffset)
    while (charCode >= 48 && charCode <= 57) {
        endOffset++
        charCode = text.charCodeAt(endOffset)
    }

    // No match, must return null to conform with the RegExp.prototype.exec signature
    if (endOffset === startOffset) {
        return null
    } else {
        const matchedString = text.substring(startOffset, endOffset)
        // according to the RegExp.prototype.exec API the first item in the returned array must be the whole matched string.
        return [matchedString]
    }
}

// Now we can simply replace the regExp pattern with our custom pattern.
// Consult the Docs (linked above) for additional syntax variants.
const IntegerLiteral = createToken({
    name: "IntegerLiteral",
    pattern: matchInteger
})
const Comma = createToken({ name: "Comma", pattern: /,/ })
const Whitespace = createToken({
    name: "Whitespace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

const customPatternLexer = new Lexer([Whitespace, Comma, IntegerLiteral])

module.exports = {
    IntegerLiteral: IntegerLiteral,
    Comma: Comma,

    tokenize: function(text) {
        const lexResult = customPatternLexer.tokenize(text)

        if (lexResult.errors.length < 0) {
            throw new Error("sad sad panda lexing errors detected")
        }
        return lexResult
    }
}
