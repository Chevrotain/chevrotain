import {Token, Lexer} from "chevrotain"
// TODO: does babel support static properties?
// Unfortunately no support for static class properties in ES2015, only in ES2016...
// so the PATTERN/GROUP static props are defined outside the class declarations.
// see: https://github.com/jeffmo/es-class-fields-and-static-properties
export class LSquare extends Token {}
LSquare.PATTERN = /\[/

export class RSquare extends Token {}
RSquare.PATTERN = /]/

export class Comma extends Token {}
Comma.PATTERN = /,/

export class Integer extends Token {}
Integer.PATTERN = /\d+/

export class WhiteSpace extends Token {}
WhiteSpace.PATTERN = /\s+/
WhiteSpace.GROUP = Lexer.SKIPPED // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

export const allTokens = [WhiteSpace, LSquare, RSquare, Comma, Integer]
export const ArrayLexer = new Lexer(allTokens)
