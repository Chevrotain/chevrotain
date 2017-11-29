/**
 * This example shows how to resolve the keywords vs identifiers ambiguity.
 * The order of TokenTypes in the lexer definition matters.
 *
 * If we place keywords before the Identifier than identifiers that have a keyword like prefix will not be
 * lexer correctly. For example, the keyword "for" and the identifier "formal".
 * The token vector will be ["for", "mal"] instead of ["formal"].
 *
 * On the other hand if we place keywords after the Identifier than they will never
 * be lexed as keywords as all keywords are usually valid identifiers.
 *
 * The solution is to place the keywords BEFORE the Identifier with an added property
 * telling the lexer to prefer the longer identifier alternative if one is found.
 */

const chevrotain = require("chevrotain")
const createToken = chevrotain.createToken
const Lexer = chevrotain.Lexer

const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-z]\w+/ })

// A utility to create "keywords" token.
function createkeywordToken(config) {
    // The longer_alt property ensures the lexer will try to lex a LONGER identifier
    // each time a keyword is lexed.
    config.longer_alt = Identifier
    return createToken(config)
}

const While = createToken({
    name: "While",
    pattern: /while/,
    longer_alt: Identifier
})

const For = createToken({ name: "For", pattern: /for/ })
const Do = createToken({ name: "Do", pattern: /do/ })
const Whitespace = createToken({
    name: "Whitespace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

keywordsVsIdentifiersLexer = new Lexer([
    Whitespace, // Whitespace is very common in most languages so placing it first generally speeds up the lexing.

    While, // the actual keywords (While/For/Do) must appear BEFORE the Identifier Token as they are all a valid prefix of it's PATTERN.
    For, // However the edge case of an Identifier with a prefix which is a valid keyword must still be handled, for example:
    Do, // 'do' vs 'done' or 'for' vs 'forEach'. This is solved by defining 'Keyword.LONGER_ALT = Identifier'/
    // thus each time a Keyword is detected the Lexer will also try to match a LONGER Identifier..

    Identifier // As mentioned above, the Identifier Token must appear after ALL the Keyword Tokens
])

module.exports = {
    Identifier: Identifier,
    While: While,
    For: For,
    Do: Do,
    Whitespace: Whitespace,

    tokenize: function(text) {
        const lexResult = keywordsVsIdentifiersLexer.tokenize(text)

        if (lexResult.errors.length > 0) {
            throw new Error("sad sad panda lexing errors detected")
        }
        return lexResult
    }
}
