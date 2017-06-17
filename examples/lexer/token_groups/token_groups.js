var chevrotain = require("chevrotain")
var createToken = chevrotain.createToken
var Lexer = chevrotain.Lexer

// using extendToken utility to create the Token constructors and hierarchy
var If = createToken({ name: "if", pattern: /if/ })
var Else = createToken({ name: "else", pattern: /else/ })
var Return = createToken({ name: "return", pattern: /return/ })
var LParen = createToken({ name: "LParen", pattern: /\(/ })
var RParen = createToken({ name: "RParen", pattern: /\)/ })
var IntegerLiteral = createToken({ name: "IntegerLiteral", pattern: /\d+/ })

var Whitespace = createToken({
    name: "Whitespace",
    pattern: /\s+/,
    // the Lexer.SKIPPED group is a special group that will cause the lexer to "ignore"
    // certain Tokens. these tokens are still consumed from the text, they just don't appear in the
    // lexer's output. the is especially useful for ignoring whitespace and in some use cases comments too.
    group: Lexer.SKIPPED
})

var Comment = createToken({
    name: "Comment",
    pattern: /\/\/.+/,
    // a Token's group may be a 'free' String, in that case the lexer's result will contain
    // an additional array of all the tokens matched for each group under the 'group' object
    // for example in this case: lexResult.groups["singleLineComments"]
    group: "singleLineComments"
})

TokenGroupsLexer = new Lexer([
    Whitespace, // Whitespace is very common in most languages so placing it first generally speeds up the lexing.
    If,
    Else,
    Return,
    LParen,
    RParen,
    IntegerLiteral,
    Comment
])

module.exports = {
    Comment: Comment,
    Whitespace: Whitespace,

    tokenize: function(text) {
        var lexResult = TokenGroupsLexer.tokenize(text)

        if (lexResult.errors.length >= 1) {
            throw new Error("sad sad panda lexing errors detected")
        }
        return lexResult
    }
}
