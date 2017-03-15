import {
    Token,
    Lexer
} from "chevrotain"
import * as _ from "lodash"

export class TrueLiteral extends Token { static PATTERN = /true/}
export class FalseLiteral extends Token { static PATTERN = /false/}
export class NullLiteral extends Token { static PATTERN = /null/}
export class LCurly extends Token { static PATTERN = /{/}
export class RCurly extends Token { static PATTERN = /}/}
export class LSquare extends Token { static PATTERN = /\[/}
export class RSquare extends Token { static PATTERN = /]/}
export class Comma extends Token { static PATTERN = /,/}
export class Colon extends Token { static PATTERN = /:/}
export class StringLiteral extends Token { static PATTERN = /"(:?[^\\"]|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/}
export class NumberLiteral extends Token { static PATTERN = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/}
export class WhiteSpace extends Token {
    static PATTERN = /\s+/
    static GROUP = Lexer.SKIPPED
}

export const allTokens:any = _.filter(module.exports, (exportedMember:any) => {
    return _.isFunction(exportedMember) &&
        Token.prototype.isPrototypeOf(exportedMember.prototype)
})

export const JsonLexer = new Lexer(allTokens)
