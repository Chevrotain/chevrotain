const { createToken, Lexer } = require("chevrotain")

const If = createToken({ name: "if", pattern: /if/ })
const Else = createToken({ name: "else", pattern: /else/ })
const Return = createToken({ name: "return", pattern: /return/ })
const LParen = createToken({ name: "LParen", pattern: /\(/ })
const RParen = createToken({ name: "RParen", pattern: /\)/ })
const IntegerLiteral = createToken({ name: "IntegerLiteral", pattern: /\d+/ })

const Whitespace = createToken({
  name: "Whitespace",
  pattern: /\s+/,
  // the Lexer.SKIPPED group is a special group that will cause the lexer to "ignore"
  // certain Tokens. these tokens are still consumed from the text, they just don't appear in the
  // lexer's output. the is especially useful for ignoring whitespace and in some use cases comments too.
  group: Lexer.SKIPPED
})

const Comment = createToken({
  name: "Comment",
  pattern: /\/\/.+/,
  // a Token's group may be a 'free' String, in that case the lexer's result will contain
  // an additional array of all the tokens matched for each group under the 'group' object
  // for example in this case: lexResult.groups["singleLineComments"]
  group: "singleLineComments"
})

const TokenGroupsLexer = new Lexer([
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
    const lexResult = TokenGroupsLexer.tokenize(text)

    if (lexResult.errors.length > 0) {
      throw new Error("sad sad panda lexing errors detected")
    }
    return lexResult
  }
}
