import { Token, Lexer, createToken } from "chevrotain"

export const LSquare = createToken({ name: "LSquare", pattern: /\[/ })
export const RSquare = createToken({ name: "RSquare", pattern: /]/ })
export const Comma = createToken({ name: "Comma", pattern: /,/ })
export const Integer = createToken({ name: "Integer", pattern: /\d+/ })
export const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

export const allTokens = [WhiteSpace, LSquare, RSquare, Comma, Integer]
export const ArrayLexer = new Lexer(allTokens)
