import { Token, Lexer } from "chevrotain"
// TODO: does babel support static properties?
// Unfortunately no support for static class properties in ES2015, only in ES2016...
// so the PATTERN/GROUP static props are defined outside the class declarations.
// see: https://github.com/jeffmo/es-class-fields-and-static-properties
export class LSquare {}
LSquare.PATTERN = /\[/

export class RSquare {}
RSquare.PATTERN = /]/

export class Comma {}
Comma.PATTERN = /,/

export class Integer {}
Integer.PATTERN = /\d+/

export class WhiteSpace {}
WhiteSpace.PATTERN = /\s+/
WhiteSpace.GROUP = Lexer.SKIPPED // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
WhiteSpace.LINE_BREAKS = true

export const allTokens = [WhiteSpace, LSquare, RSquare, Comma, Integer]
export const ArrayLexer = new Lexer(allTokens)
