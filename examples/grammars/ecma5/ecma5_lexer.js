"use strict"

const acorn = require("acorn")
const acornTokTypes = acorn.tokTypes
const tokens = require("./ecma5_tokens")

function createChevToken(chevTokenClass, acornToken) {
    return {
        tokenType: chevTokenClass.tokenType,
        image: acornToken.value,
        startOffset: acornToken.start,
        endOffset: acornToken.end
    }
}

function tokenize(str) {
    var result = []
    for (let token of acorn.tokenizer(str, { ecmaVersion: 6 })) {
        let acornType = token.type
        let chevTokenType
        // https://github.com/ternjs/acorn/blob/master/src/tokentype.js#L54
        switch (acornType) {
            case acornTokTypes._var:
                chevTokenType = tokens.VarTok
                break
            case acornTokTypes.name:
                chevTokenType = tokens.Identifier
                break
            case acornTokTypes._break:
                chevTokenType = tokens.BreakTok
                break
            case acornTokTypes.dot:
                chevTokenType = tokens.DoTok
                break
            case acornTokTypes._instanceof:
                chevTokenType = tokens.InstanceOfTok
                break
            case acornTokTypes._typeof:
                chevTokenType = tokens.TypeOfTok
                break
            case acornTokTypes._case:
                chevTokenType = tokens.CaseTok
                break
            case acornTokTypes._else:
                chevTokenType = tokens.ElseTok
                break
            case acornTokTypes._new:
                chevTokenType = tokens.NewTok
                break
            case acornTokTypes._catch:
                chevTokenType = tokens.CatchTok
                break
            case acornTokTypes._finally:
                chevTokenType = tokens.FinallyTok
                break
            case acornTokTypes._return:
                chevTokenType = tokens.ReturnTok
                break
            case acornTokTypes._void:
                chevTokenType = tokens.VoidTok
                break
            case acornTokTypes._continue:
                chevTokenType = tokens.ContinueTok
                break
            case acornTokTypes._for:
                chevTokenType = tokens.ForTok
                break
            case acornTokTypes._switch:
                chevTokenType = tokens.SwitchTok
                break
            case acornTokTypes._while:
                chevTokenType = tokens.WhileTok
                break
            case acornTokTypes._debugger:
                chevTokenType = tokens.DebuggerTok
                break
            case acornTokTypes._function:
                chevTokenType = tokens.FunctionTok
                break
            case acornTokTypes._this:
                chevTokenType = tokens.ThisTok
                break
            case acornTokTypes._with:
                chevTokenType = tokens.WithTok
                break
            case acornTokTypes._default:
                chevTokenType = tokens.DefaultTok
                break
            case acornTokTypes._if:
                chevTokenType = tokens.IfTok
                break
            case acornTokTypes._throw:
                chevTokenType = tokens.ThrowTok
                break
            case acornTokTypes._delete:
                chevTokenType = tokens.DeleteTok
                break
            case acornTokTypes._in:
                chevTokenType = tokens.InTok
                break
            case acornTokTypes._try:
                chevTokenType = tokens.TryTok
                break
            case acornTokTypes._super:
                chevTokenType = tokens.SuperTok
                break
            // TODO: set/get is not a keyword in Acorn and thus does not have a tokenType
            case acornTokTypes.XXX:
                chevTokenType = tokens.GetTok
                break
            // TODO: set/get is not a keyword in Acorn and thus does not have a tokenType
            case acornTokTypes.XXX:
                chevTokenType = tokens.SetTok
                break
            case acornTokTypes.braceL:
                chevTokenType = tokens.LCurly
                break
            case acornTokTypes.braceR:
                chevTokenType = tokens.RCurly
                break
            case acornTokTypes.parenL:
                chevTokenType = tokens.LParen
                break
            case acornTokTypes.parenR:
                chevTokenType = tokens.RParen
                break
            case acornTokTypes.bracketL:
                chevTokenType = tokens.LBracket
                break
            case acornTokTypes.bracketR:
                chevTokenType = tokens.RBracket
                break
            case acornTokTypes.dot:
                chevTokenType = tokens.Dot
                break
            case acornTokTypes.semi:
                chevTokenType = tokens.Semicolon
                break
            case acornTokTypes.comma:
                chevTokenType = tokens.Comma
                break
            // TODO: "incDec" seems to cover both ++ and --
            // perform additional logic to decide which?
            case acornTokTypes.incDec:
                chevTokenType = tokens.PlusPlus
                break
            case acornTokTypes.incDec:
                chevTokenType = tokens.MinusMinus
                break
            case acornTokTypes.bitwiseAND:
                chevTokenType = tokens.Ampersand
                break
            case acornTokTypes.bitwiseOR:
                chevTokenType = tokens.VerticalBar
                break
            case acornTokTypes.bitwiseXOR:
                chevTokenType = tokens.Circumflex
                break
            case acornTokTypes.prefix:
                chevTokenType = tokens.Exclamation
                break
            case acornTokTypes.prefix:
                chevTokenType = tokens.Tilde
                break
            case acornTokTypes.logicalAND:
                chevTokenType = tokens.AmpersandAmpersand
                break
            case acornTokTypes.logicalOR:
                chevTokenType = tokens.VerticalBarVerticalBar
                break
            case acornTokTypes.question:
                chevTokenType = tokens.Question
                break
            case acornTokTypes.colon:
                chevTokenType = tokens.Colon
                break
            case acornTokTypes.star:
                chevTokenType = tokens.Asterisk
                break
            case acornTokTypes.slash:
                chevTokenType = tokens.Slash
                break
            case acornTokTypes.modulo:
                chevTokenType = tokens.Percent
                break

            // TODO: plusMin used for both Plus and Min
            case acornTokTypes.plusMin:
                chevTokenType = tokens.Plus
                break
            case acornTokTypes.plusMin:
                chevTokenType = tokens.Minus
                break

            // TODO: combine bitshift operators
            case acornTokTypes.bitShift:
                chevTokenType = tokens.LessLess
                break
            case acornTokTypes.bitShift:
                chevTokenType = tokens.MoreMore
                break
            case acornTokTypes.bitShift:
                chevTokenType = tokens.MoreMoreMore
                break

            // TODO: combine relational operators
            case acornTokTypes.relational:
                chevTokenType = tokens.Less
                break
            case acornTokTypes.relational:
                chevTokenType = tokens.Greater
                break
            case acornTokTypes.relational:
                chevTokenType = tokens.LessEq
                break
            case acornTokTypes.relational:
                chevTokenType = tokens.GreaterEq
                break

            // TODO: combine equality operators
            case acornTokTypes.equality:
                chevTokenType = tokens.EqEq
                break
            case acornTokTypes.equality:
                chevTokenType = tokens.NotEq
                break
            case acornTokTypes.equality:
                chevTokenType = tokens.EqEqEq
                break
            case acornTokTypes.equality:
                chevTokenType = tokens.NotEqEq
                break

            // TODO: combine assign operators
            case acornTokTypes.assign:
                chevTokenType = tokens.Eq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.PlusEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.MinusEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.AsteriskEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.PercentEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.LessLessEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.MoreMoreEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.MoreMoreMoreEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.AmpersandEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.VerticalBarEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.CircumflexEq
                break
            case acornTokTypes.assign:
                chevTokenType = tokens.SlashEq
                break

            case acornTokTypes._null:
                chevTokenType = tokens.NullTok
                break
            case acornTokTypes._true:
                chevTokenType = tokens.TrueTok
                break
            case acornTokTypes._false:
                chevTokenType = tokens.FalseTok
                break

            // TODO: combine num literals
            case acornTokTypes.num:
                chevTokenType = tokens.DecimalLiteral
                break
            case acornTokTypes.num:
                chevTokenType = tokens.HexIntegerLiteral
                break

            // TODO: combine string literals
            case acornTokTypes.string:
                chevTokenType = tokens.DoubleQuotationStringLiteral
                break
            case acornTokTypes.string:
                chevTokenType = tokens.SingleQuotationStringLiteral
                break
            case acornTokTypes.regexp:
                chevTokenType = tokens.RegularExpressionLiteral
                break
            default:
                throw Error("bamba")
        }
        const chevToken = createChevToken(chevTokenType, token)
        var x = 5
        // iterate over the tokens
    }
}

tokenize("var x = 5;")
