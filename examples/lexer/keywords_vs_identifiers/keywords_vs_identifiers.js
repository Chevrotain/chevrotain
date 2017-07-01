var chevrotain = require("chevrotain")
var createToken = chevrotain.createToken
var Lexer = chevrotain.Lexer

// using extendToken utility to create the Token constructors and hierarchy
var Identifier = createToken({ name: "Identifier", pattern: /[a-zA-z]\w+/ })
var Keyword = createToken({
    name: "Keyword",
    // LONGER_ALT will make the Lexer prefer a longer Identifier over a Keyword.
    pattern: Lexer.NA,
    longer_alt: Identifier
})

var While = createToken({ name: "While", pattern: /while/, parent: Keyword })
var For = createToken({ name: "For", pattern: /for/, parent: Keyword })
var Do = createToken({ name: "Do", pattern: /do/, parent: Keyword })
var Whitespace = createToken({
    name: "Whitespace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

keywordsVsIdentifiersLexer = new Lexer([
    Whitespace, // Whitespace is very common in most languages so placing it first generally speeds up the lexing.

    Keyword, // Adding keyword here is optional as its pattern is defined as 'lexer.NA' thus the lexer will completely ignore it

    While, // the actual keywords (While/For/Do) must appear BEFORE the Identifier Token as they are all a valid prefix of it's PATTERN.
    For, // However the edge case of an Identifier with a prefix which is a valid keyword must still be handled, for example:
    Do, // 'do' vs 'done' or 'for' vs 'forEach'. This is solved by defining 'Keyword.LONGER_ALT = Identifier'/
    // thus each time a Keyword is detected the Lexer will also try to match a LONGER Identifier..

    Identifier // As mentioned above, the Identifier Token must appear after ALL the Keyword Tokens
])

module.exports = {
    Identifier: Identifier,
    Keyword: Keyword,
    While: While,
    For: For,
    Do: Do,
    Whitespace: Whitespace,

    tokenize: function(text) {
        var lexResult = keywordsVsIdentifiersLexer.tokenize(text)

        if (lexResult.errors.length >= 1) {
            throw new Error("sad sad panda lexing errors detected")
        }
        return lexResult
    }
}
