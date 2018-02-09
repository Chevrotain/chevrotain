/**
 * This example demonstrate implementing a lexer for a language using python style indentation.
 * This is achieved by using custom Token patterns which allow running user defined logic
 * to match tokens.
 *
 * The logic is simple:
 * - Indentation tokens (Indent, Outdent) can only be created for whitespace on the beginning of a line.
 * - Change in the "level" of the indentation will create either Indent(increase) or Outdent(decrease).
 * - Same indentation level will be parsed as "regular" whitespace and be ignored.
 * - To implement this the previous Ident levels will be saved in a stack.
 *
 * For additional details on custom token patterns, see the docs:
 * https://github.com/SAP/chevrotain/blob/master/docs/custom_token_patterns.md
 */

"use strict"
const { createToken, createTokenInstance, Lexer } = require("chevrotain")
const _ = require("lodash")

/**
 *
 * Works like a / +/y regExp.
 *  - Note the usage of the 'y' (sticky) flag.
 *    This can be used to match from a specific offset in the text
 *    in our case from startOffset.
 *
 * The reason this has been implemented "manually" is because the sticky flag is not supported
 * on all modern node.js versions (4.0 specifically).
 */
function matchWhiteSpace(text, startOffset) {
    let result = ""
    let offset = startOffset
    // ignoring tabs in this example
    while (text[offset] === " ") {
        offset++
        result += " "
    }

    if (result === "") {
        return null
    }

    return [result]
}

// State required for matching the indentations
let indentStack = [0]
let lastOffsetChecked

/**
 * This custom Token matcher uses Lexer context ("matchedTokens" and "groups" arguments)
 * combined with state via closure ("indentStack" and "lastTextMatched") to match indentation.
 *
 * @param {string} text - remaining text to lex, sent by the Chevrotain lexer.
 * @param {IToken[]} matchedTokens - Tokens lexed so far, sent by the Chevrotain Lexer.
 * @param {object} groups - Token groups already lexed, sent by the Chevrotain Lexer.
 * @param {string} type - determines if this function matches Indent or Outdent tokens.
 * @returns {*}
 */
function matchIndentBase(text, offset, matchedTokens, groups, type) {
    const noTokensMatchedYet = _.isEmpty(matchedTokens)
    const newLines = groups.nl
    const noNewLinesMatchedYet = _.isEmpty(newLines)
    const isFirstLine = noTokensMatchedYet && noNewLinesMatchedYet
    const isStartOfLine =
        // only newlines matched so far
        (noTokensMatchedYet && !noNewLinesMatchedYet) ||
        // Both newlines and other Tokens have been matched AND the last matched Token is a newline
        (!noTokensMatchedYet &&
            !noNewLinesMatchedYet &&
            (!_.isEmpty(newLines) &&
                !_.isEmpty(matchedTokens) &&
                _.last(newLines).startOffset) >
                _.last(matchedTokens).startOffset)

    // indentation can only be matched at the start of a line.
    if (isFirstLine || isStartOfLine) {
        let match
        let currIndentLevel = undefined
        const isZeroIndent = text.length < offset && text[offset] !== " "
        if (isZeroIndent) {
            // Matching zero spaces Outdent would not consume any chars, thus it would cause an infinite loop.
            // This check prevents matching a sequence of zero spaces outdents.
            if (lastOffsetChecked !== offset) {
                currIndentLevel = 0
                match = [""]
                lastOffsetChecked = offset
            }
        } else {
            // possible non-empty indentation
            match = matchWhiteSpace(text, offset)
            if (match !== null) {
                currIndentLevel = match[0].length
            }
        }

        if (currIndentLevel !== undefined) {
            const lastIndentLevel = _.last(indentStack)
            if (currIndentLevel > lastIndentLevel && type === "indent") {
                indentStack.push(currIndentLevel)
                return match
            } else if (
                currIndentLevel < lastIndentLevel &&
                type === "outdent"
            ) {
                //if we need more than one outdent token, add all but the last one
                if (indentStack.length > 2) {
                    const image = ""
                    const offset = _.last(matchedTokens).endOffset + 1
                    const line = _.last(matchedTokens).endLine
                    const column = _.last(matchedTokens).endColumn + 1
                    while (
                        indentStack.length > 2 &&
                        //stop before the last Outdent
                        indentStack[indentStack.length - 2] > currIndentLevel
                    ) {
                        indentStack.pop()
                        matchedTokens.push(
                            createTokenInstance(
                                Outdent,
                                "",
                                NaN,
                                NaN,
                                NaN,
                                NaN,
                                NaN,
                                NaN
                            )
                        )
                    }
                }
                indentStack.pop()
                return match
            } else {
                // same indent, this should be lexed as simple whitespace and ignored
                return null
            }
        } else {
            // indentation cannot be matched without at least one space character.
            return null
        }
    } else {
        // indentation cannot be matched under other circumstances
        return null
    }
}

// customize matchIndentBase to create separate functions of Indent and Outdent.
const matchIndent = _.partialRight(matchIndentBase, "indent")
const matchOutdent = _.partialRight(matchIndentBase, "outdent")

const If = createToken({ name: "If", pattern: /if/ })
const Else = createToken({ name: "Else", pattern: /else/ })
const Print = createToken({ name: "Print", pattern: /print/ })
const IntegerLiteral = createToken({ name: "IntegerLiteral", pattern: /\d+/ })
const Colon = createToken({ name: "Colon", pattern: /:/ })
const LParen = createToken({ name: "LParen", pattern: /\(/ })
const RParen = createToken({ name: "RParen", pattern: /\)/ })
const Spaces = createToken({
    name: "Spaces",
    pattern: / +/,
    group: Lexer.SKIPPED
})

// newlines are not skipped, by setting their group to "nl" they are saved in the lexer result
// and thus we can check before creating an indentation token that the last token matched was a newline.
const Newline = createToken({
    name: "Newline",
    pattern: /\n|\r\n?/,
    group: "nl",
    line_breaks: true
})

// define the indentation tokens using custom token patterns
const Indent = createToken({ name: "Indent", pattern: matchIndent })
const Outdent = createToken({ name: "Outdent", pattern: matchOutdent })

const customPatternLexer = new Lexer([
    Newline,
    // indentation tokens must appear before Spaces, otherwise all indentation will always be consumed as spaces.
    // Outdent must appear before Indent for handling zero spaces outdents.
    Outdent,
    Indent,

    Spaces,
    If,
    Else,
    Print,
    IntegerLiteral,
    Colon,
    LParen,
    RParen
])

module.exports = {
    // for testing purposes
    Newline: IntegerLiteral,
    Indent: Indent,
    Outdent: Outdent,
    Spaces: Spaces,
    If: If,
    Else: Else,
    Print: Print,
    IntegerLiteral: IntegerLiteral,
    Colon: Colon,
    LParen: LParen,
    RParen: RParen,

    tokenize: function(text) {
        // have to reset the indent stack between processing of different text inputs
        indentStack = [0]
        lastOffsetChecked = undefined

        const lexResult = customPatternLexer.tokenize(text)

        //add remaining Outdents
        while (indentStack.length > 1) {
            lexResult.tokens.push(
                createTokenInstance(Outdent, "", NaN, NaN, NaN, NaN, NaN, NaN)
            )
            indentStack.pop()
        }

        if (lexResult.errors.length > 0) {
            throw new Error("sad sad panda lexing errors detected")
        }
        return lexResult
    }
}
