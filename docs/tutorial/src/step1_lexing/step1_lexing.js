"use strict"
// Written Docs for this tutorial step can be found here:
// https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step1_lexing.md

// Tutorial Step 1:
// Implementation of A lexer for a simple SELECT statement grammar
const chevrotain = require("chevrotain")
const Lexer = chevrotain.Lexer

const tokenVocabulary = {}
const allTokens = []
// a little utility to reduce duplication
const createToken = function createTokenWrapper(options) {
    // usage of the official createToken API.
    let newTokenType = chevrotain.createToken(options)
    allTokens.push(newTokenType)
    tokenVocabulary[options.name] = newTokenType
}

// createToken is used to create a "constructor" for a Token class
// The Lexer's output will contain an array of token Objects created by metadata
// on these "constructors". Note that the Token "instances" are not proper class instances
// So use chevrotain.tokenMatcher instead of "instanceof" when matching
createToken({ name: "Select", pattern: /SELECT/ })
createToken({ name: "From", pattern: /FROM/ })
createToken({ name: "Where", pattern: /WHERE/ })
createToken({ name: "Comma", pattern: /,/ })
createToken({ name: "Identifier", pattern: /[a-zA-Z]\w*/ })
createToken({ name: "Integer", pattern: /0|[1-9]\d*/ })
createToken({ name: "GreaterThan", pattern: /</ })
createToken({ name: "LessThan", pattern: />/ })
createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

const SelectLexer = new Lexer(allTokens)

module.exports = {
    tokenVocabulary: tokenVocabulary,

    lex: function(inputText) {
        let lexingResult = SelectLexer.tokenize(inputText)

        if (lexingResult.errors.length > 0) {
            throw Error("Sad Sad Panda, lexing errors detected")
        }

        return lexingResult
    }
}
