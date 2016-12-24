/**
 * This example demonstrate usage of custom token patterns.
 * custom token patterns allow implementing token matchers using arbitrary JavaScript code
 * instead of being limited to only using regular expressions.
 *
 * For additional details see the docs:
 * https://github.com/SAP/chevrotain/blob/master/docs/custom_token_patterns.md
 */

"use strict"
let chevrotain = require("chevrotain")
let createToken = chevrotain.createToken
let Lexer = chevrotain.Lexer


// First lets define our custom pattern for matching an Integer Literal.
// This function's signature matches the RegExp.prototype.exec function.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
function matchInteger(text) {
    let i = 0
    let charCode = text.charCodeAt(i)
    while (charCode >= 48 && charCode <= 57) {
        i++
        charCode = text.charCodeAt(i)
    }

    // No match, must return null to conform with the RegExp.prototype.exec signature
    if (i === 0) {
        return null
    }
    else {
        let matchedString = text.substring(0, i)
        // according to the RegExp.prototype.exec API the first item in the returned array must be the whole matched string.
        return [matchedString]
    }
}

// Now we can simply replace the regExp pattern with our custom pattern.
// Consult the Docs (linked above) for additional syntax variants.
let IntegerLiteral = createToken({name: "IntegerLiteral", pattern: matchInteger})
let Comma = createToken({name: "Comma", pattern: /,/})
let Whitespace = createToken({name: "Whitespace", pattern: /\s+/, group: Lexer.SKIPPED})

let customPatternLexer = new Lexer(
    [
        Whitespace,
        Comma,
        IntegerLiteral
    ])

module.exports = {

    IntegerLiteral: IntegerLiteral,
    Comma:          Comma,

    tokenize: function(text) {
        let lexResult = customPatternLexer.tokenize(text)

        if (lexResult.errors.length >= 1) {
            throw new Error("sad sad panda lexing errors detected")
        }
        return lexResult
    }
}
