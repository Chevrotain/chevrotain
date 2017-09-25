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
    const result = []
    for (let token of acorn.tokenizer(str, { ecmaVersion: 6 })) {
        let acornType = token.type
        let ctt
        // https://github.com/ternjs/acorn/blob/master/src/tokentype.js#L54
        switch (acornType) {
            case acornTokTypes._var:
                ctt = tokens.VarTok
                break
            case acornTokTypes.name:
                switch (token.value) {
                    case "set":
                        ctt = tokens.SetTok
                        break
                    case "get":
                        ctt = tokens.GetTok
                        break
                    default:
                        ctt = tokens.Identifier
                        break
                }
                break
            case acornTokTypes._break:
                ctt = tokens.BreakTok
                break
            case acornTokTypes._do:
                ctt = tokens.DoTok
                break
            case acornTokTypes._instanceof:
                ctt = tokens.InstanceOfTok
                break
            case acornTokTypes._typeof:
                ctt = tokens.TypeOfTok
                break
            case acornTokTypes._case:
                ctt = tokens.CaseTok
                break
            case acornTokTypes._else:
                ctt = tokens.ElseTok
                break
            case acornTokTypes._new:
                ctt = tokens.NewTok
                break
            case acornTokTypes._catch:
                ctt = tokens.CatchTok
                break
            case acornTokTypes._finally:
                ctt = tokens.FinallyTok
                break
            case acornTokTypes._return:
                ctt = tokens.ReturnTok
                break
            case acornTokTypes._void:
                ctt = tokens.VoidTok
                break
            case acornTokTypes._continue:
                ctt = tokens.ContinueTok
                break
            case acornTokTypes._for:
                ctt = tokens.ForTok
                break
            case acornTokTypes._switch:
                ctt = tokens.SwitchTok
                break
            case acornTokTypes._while:
                ctt = tokens.WhileTok
                break
            case acornTokTypes._debugger:
                ctt = tokens.DebuggerTok
                break
            case acornTokTypes._function:
                ctt = tokens.FunctionTok
                break
            case acornTokTypes._this:
                ctt = tokens.ThisTok
                break
            case acornTokTypes._with:
                ctt = tokens.WithTok
                break
            case acornTokTypes._default:
                ctt = tokens.DefaultTok
                break
            case acornTokTypes._if:
                ctt = tokens.IfTok
                break
            case acornTokTypes._throw:
                ctt = tokens.ThrowTok
                break
            case acornTokTypes._delete:
                ctt = tokens.DeleteTok
                break
            case acornTokTypes._in:
                ctt = tokens.InTok
                break
            case acornTokTypes._try:
                ctt = tokens.TryTok
                break
            case acornTokTypes._super:
                ctt = tokens.SuperTok
                break
            case acornTokTypes.braceL:
                ctt = tokens.LCurly
                break
            case acornTokTypes.braceR:
                ctt = tokens.RCurly
                break
            case acornTokTypes.parenL:
                ctt = tokens.LParen
                break
            case acornTokTypes.parenR:
                ctt = tokens.RParen
                break
            case acornTokTypes.bracketL:
                ctt = tokens.LBracket
                break
            case acornTokTypes.bracketR:
                ctt = tokens.RBracket
                break
            case acornTokTypes.dot:
                ctt = tokens.Dot
                break
            case acornTokTypes.semi:
                ctt = tokens.Semicolon
                break
            case acornTokTypes.comma:
                ctt = tokens.Comma
                break
            case acornTokTypes.incDec:
                switch (token.value) {
                    case "++":
                        ctt = tokens.PlusPlus
                        break
                    case "--":
                        ctt = tokens.MinusMinus
                        break
                }
                break
            case acornTokTypes.bitwiseAND:
                ctt = tokens.Ampersand
                break
            case acornTokTypes.bitwiseOR:
                ctt = tokens.VerticalBar
                break
            case acornTokTypes.bitwiseXOR:
                ctt = tokens.Circumflex
                break
            case acornTokTypes.prefix:
                switch (token.value) {
                    case "!":
                        ctt = tokens.Exclamation
                        break
                    case "~":
                        ctt = tokens.Tilde
                        break
                }
                break
            case acornTokTypes.logicalAND:
                ctt = tokens.AmpersandAmpersand
                break
            case acornTokTypes.logicalOR:
                ctt = tokens.VerticalBarVerticalBar
                break
            case acornTokTypes.question:
                ctt = tokens.Question
                break
            case acornTokTypes.colon:
                ctt = tokens.Colon
                break
            case acornTokTypes.star:
                ctt = tokens.Asterisk
                break
            case acornTokTypes.slash:
                ctt = tokens.Slash
                break
            case acornTokTypes.modulo:
                ctt = tokens.Percent
                break
            case acornTokTypes.plusMin:
                switch (token.value) {
                    case "+":
                        ctt = tokens.Plus

                        break
                    case "-":
                        ctt = tokens.Minus
                        break
                }
                break
            case acornTokTypes.bitShift:
                switch (token.value) {
                    case "<<":
                        ctt = tokens.LessLess
                        break
                    case ">>":
                        ctt = tokens.MoreMore
                        break
                    case ">>>":
                        ctt = tokens.MoreMoreMore
                        break
                }
                break
            case acornTokTypes.relational:
                switch (token.value) {
                    case "<":
                        ctt = tokens.Less
                        break
                    case ">":
                        ctt = tokens.Greater
                        break
                    case "<=":
                        ctt = tokens.LessEq
                        break
                    case ">=":
                        ctt = tokens.GreaterEq
                        break
                }
                break
            case acornTokTypes.equality:
                switch (token.value) {
                    case "==":
                        ctt = tokens.EqEq
                        break
                    case "!=":
                        ctt = tokens.NotEq
                        break
                    case "===":
                        ctt = tokens.EqEqEq
                        break
                    case "!==":
                        ctt = tokens.NotEqEq
                        break
                }
                break
            case acornTokTypes.eq:
                ctt = tokens.Eq
                break
            case acornTokTypes.assign:
                switch (token.value) {
                    case "+=":
                        ctt = tokens.PlusEq
                        break
                    case "-=":
                        ctt = tokens.MinusEq
                        break
                    case "*=":
                        ctt = tokens.AsteriskEq
                        break
                    case "%=":
                        ctt = tokens.PercentEq
                        break
                    case "<<=":
                        ctt = tokens.LessLessEq
                        break
                    case ">>=":
                        ctt = tokens.MoreMoreEq
                        break
                    case ">>>=":
                        ctt = tokens.MoreMoreMoreEq
                        break
                    case "&=":
                        ctt = tokens.AmpersandEq
                        break
                    case "|=":
                        ctt = tokens.VerticalBarEq
                        break
                    case "^=":
                        ctt = tokens.CircumflexEq
                        break
                    case "/=":
                        ctt = tokens.SlashEq
                        break
                }
                break
            case acornTokTypes._null:
                ctt = tokens.NullTok
                break
            case acornTokTypes._true:
                ctt = tokens.TrueTok
                break
            case acornTokTypes._false:
                ctt = tokens.FalseTok
                break
            case acornTokTypes.num:
                ctt = tokens.NumericLiteral
                break
            case acornTokTypes.string:
                ctt = tokens.StringLiteral
                break
            case acornTokTypes.regexp:
                ctt = tokens.RegularExpressionLiteral
                break
            default:
                throw Error("sad sad panda")
        }
        const chevToken = createChevToken(ctt, token)
        result.push(chevToken)
    }

    return result
}

module.exports = {
    tokenize
}
