const { Parser, Lexer, createToken: orgCreateToken } = require("chevrotain")
const XRegExp = require("xregexp")

// ----------------- lexer -----------------
// Based on the specs in:
// https://www.w3.org/TR/CSS21/grammar.html

// A little mini DSL for easier lexer definition using xRegExp.
const fragments = {}

function FRAGMENT(name, def) {
    fragments[name] = XRegExp.build(def, fragments)
}

function MAKE_PATTERN(def, flags) {
    return XRegExp.build(def, fragments, flags)
}

const allTokens = []

const createToken = function() {
    const newToken = orgCreateToken.apply(null, arguments)
    allTokens.push(newToken)
    return newToken
}
// ----------------- lexer -----------------

// B1 - Ignored-Tokens
// http://facebook.github.io/graphql/June2018/#sec-Appendix-Grammar-Summary.Ignored-Tokens
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t]+/,
    group: Lexer.SKIPPED
})

const UnicodeBOM = createToken({
    name: "UnicodeBOM",
    pattern: "\uFFFE",
    group: Lexer.SKIPPED
})

const LineTerminator = createToken({
    name: "LineTerminator",
    pattern: /\n\r|\r|\n/,
    group: Lexer.SKIPPED
})

const Comment = createToken({
    name: "Comment",
    pattern: /#[^\n\r]+/,
    group: Lexer.SKIPPED
})

const Comma = createToken({
    name: "Comma",
    pattern: ",",
    group: Lexer.SKIPPED
})

// B2 - Lexical Tokens
// http://facebook.github.io/graphql/June2018/#sec-Appendix-Grammar-Summary.Lexical-Tokens
// Punctuator
const Exclamation = createToken({ name: "Exclamation", pattern: "!" })
const Dollar = createToken({ name: "Dollar", pattern: "$" })
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

// Token
const Name = createToken({ name: "Name", pattern: /[_A-Za-z][_0-9A-Za-z]*/ })
FRAGMENT("IntegerPart", "-?(0|[1-9][0-9]*)")
FRAGMENT("FractionalPart", "\\.[0-9]+")
FRAGMENT("ExponentPart", "[eE][+-]?[0-9]+")
const IntValue = createToken({
    name: "IntValue",
    pattern: MAKE_PATTERN("{{IntegerPart}}")
})
const FloatValue = createToken({
    name: "IntValue",
    pattern: MAKE_PATTERN(
        "{{IntegerPart}}{{FractionalPart}}({{ExponentPart}})?|{{IntegerPart}}{{ExponentPart}}"
    )
})
FRAGMENT("EscapedCharacter", '[\\\\/"bfnrt]')
FRAGMENT("EscapedUnicode", "[0-9a-fA-F]{4}")
FRAGMENT(
    "StringCharacter",
    '(?:[^\\\\"\\n\\r]|\\\\(?:{{EscapedUnicode}}|u{{EscapedCharacter}}))'
)
FRAGMENT("BlockStringCharacter", '[^"]|"(?!"")|\\\\"""')
const StringValue = createToken({
    name: "StringValue",
    pattern: MAKE_PATTERN(
        '"(?:{{StringCharacter}})*"|"""(?:{{BlockStringCharacter}})*"""'
    )
})

const GraphQLLexer = new Lexer([LineTerminator])
