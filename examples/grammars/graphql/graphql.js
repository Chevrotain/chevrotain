const {Parser, Lexer, createToken:orgCreateToken} = require("chevrotain")

const allTokens = []

const createToken = function() {
    const newToken = orgCreateToken.apply(null, arguments)
    allTokens.push(newToken)
    return newToken
}
// ----------------- lexer -----------------

const WhiteSpace = createToken({
    name:    "WhiteSpace",
    pattern: /[ \t]+/,
    group:   Lexer.SKIPPED
})

const UnicodeBOM = createToken({
    name:    "UnicodeBOM",
    pattern: "\uFFFE",
    group:   Lexer.SKIPPED
})

const LineTerminator = createToken({
    name:    "LineTerminator",
    pattern: /\n\r|\r|\n/,
    group:   Lexer.SKIPPED
})

const Comment = createToken({
    name:    "Comment",
    pattern: /#[^\n\r]+/,
    group:   Lexer.SKIPPED
})

const Comma = createToken({
    name:    "Comma",
    pattern: ",",
    group:   Lexer.SKIPPED
})

const Exclamation = createToken({
    name:    "Exclamation",
    pattern: "!",
})

const Dollar = createToken({
    name:    "Dollar",
    pattern: "$",
})

const LParen = createToken({ name: "LParen", pattern: "(" })
const RParen = createToken({ name: "RParen", pattern: ")" })
const DotDotDot = createToken({ name: "DotDotDot", pattern: "..." })
const Colon = createToken({ name: "Colon", pattern: ":" })
const Equals = createToken({ name: "Equals", pattern: "=" })
const At = createToken({ name: "At", pattern: "@" })
const LSquare = createToken({ name: "LSquare", pattern: "[" })
const RSquare = createToken({ name: "RSquare", pattern: "]" })
const LCurly = createToken({ name: "LCurly", pattern: "{" })
const VerticalLine = createToken({ name: "Vertical Line", pattern: "|" })
const RCurly = createToken({ name: "RCurly", pattern: "}" })

const Name = createToken({ name: "Name", pattern: /[_A-Za-z][_0-9A-Za-z]*/ })

const GraphQLLexer = new Lexer(allTokens)