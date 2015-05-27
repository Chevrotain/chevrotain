import tok = chevrotain.tokens
// seems like false positives with this ts-line rule
/* tslint:disable:no-use-before-declare */

/**
 * ECMA5 lexer HEAVILY based on Esprima's implementation.
 */
// TODO: rename zlexer --> lexer. there is an issue with order of files provided to karma which the name zlexer is a workaround
// TODO: better error messages (instead of 'sad sad panda'...)
// TODO: error recovery + only 1 error message for whole recovery
// TODO: due to ambiguity of '/'|'/=' vs RegExpLiteral Lexing is dependent on Parser's context.
//       so this needs to be refactored to be calledAble by The parser whenever it needs another token.
//       This refactoring should avoid duplicate work. so if LA(2) was called once, the next time the parser calls LA(2)
//       the lexed token should be cached. (should cache takes into account context?)

module chevrotain.examples.ecma5.lexer {

    var PLUS_ALTS = {
        "+": {token: PlusPlus, nextStates: null},
        "=": {token: PlusEq, nextStates: null}
    }

    var AMP_ALTS = {
        "&": {token: AmpersandAmpersand, nextStates: null},
        "=": {token: AmpersandEq, nextStates: null}
    }

    var CIRC_ALTS = {
        "=": {token: CircumflexEq, nextStates: null}
    }

    var VERBAR_ALTS = {
        "|": {token: VerticalBarVerticalBar, nextStates: null},
        "=": {token: VerticalBarEq, nextStates: null}
    }

    var EXC_ALTS2 = {
        "=": {token: NotEqEq, nextStates: null}
    }

    var EXC_ALTS = {
        "=": {token: NotEq, nextStates: EXC_ALTS2}
    }

    var AST_ALTS = {
        "=": {token: AsteriskEq, nextStates: null}
    }

    var LESS_ALTS2 = {
        "=": {token: LessLessEq, nextStates: null}

    }

    var LESS_ALTS = {
        "<": {token: LessLess, nextStates: LESS_ALTS2},
        "=": {token: LessEq, nextStates: null}
    }

    var GREATER_ALTS3 = {
        "=": {token: MoreMoreMoreEq, nextStates: null}
    }

    var GREATER_ALTS2 = {
        ">": {token: MoreMoreMore, nextStates: GREATER_ALTS3},
        "=": {token: MoreMoreEq, nextStates: null}
    }

    var GREATER_ALTS = {
        ">": {token: MoreMore, nextStates: GREATER_ALTS2},
        "=": {token: GreaterEq, nextStates: null}
    }

    var EQ_ALTS2 = {
        "=": {token: EqEqEq, nextStates: null}
    }

    var EQ_ALTS = {
        "=": {token: EqEq, nextStates: EQ_ALTS2}
    }

    var PERCENT_ALTS = {
        "=": {token: PercentEq, nextStates: null}
    }

    var INIT_STATE = {
        "{": {token: LCurly, nextStates: null},
        "}": {token: RCurly, nextStates: null},
        "(": {token: LParen, nextStates: null},
        ")": {token: RParen, nextStates: null},
        "[": {token: LBracket, nextStates: null},
        "]": {token: RBracket, nextStates: null},
        // dot is handled separately as it may also start a floating point number
        ";": {token: Semicolon, nextStates: null},
        ",": {token: Comma, nextStates: null},
        "&": {token: Ampersand, nextStates: AMP_ALTS},
        "|": {token: VerticalBar, nextStates: VERBAR_ALTS},
        "^": {token: Circumflex, nextStates: CIRC_ALTS},
        "!": {token: Exclamation, nextStates: EXC_ALTS},
        "~": {token: Tilde, nextStates: null},
        "?": {token: Question, nextStates: null},
        ":": {token: Colon, nextStates: null},
        "*": {token: Asterisk, nextStates: AST_ALTS},
        // slash is handled separately as it may also start a single line comment
        "+": {token: Plus, nextStates: PLUS_ALTS},
        // minus is handled separately as it may also start a number literal
        "<": {token: Less, nextStates: LESS_ALTS},
        ">": {token: Greater, nextStates: GREATER_ALTS},
        "=": {token: Eq, nextStates: EQ_ALTS},
        "%": {token: Percent, nextStates: PERCENT_ALTS}
    }


    /**
     * lineTerminatorsInfo[x] is an AbsLineTerminator instance IFF
     *    in the "complete" meaningful token input vector there is an AbsLineTerminator instance
     *    in the index 'x'.
     */
    export type IdxToLineTerminator = { [idx: number] : LineTerminator }

    export interface ILexingResult {
        errors:any[] // TODO: error structure? can it be shared with parsing errors?
        tokens:tok.Token[]
        comments:AbsComment[]
        whitespace:Whitespace[]
        idxTolineTerminators:IdxToLineTerminator
    }


    function reset():void {

        index = 0

        result = {
            errors:               [],
            tokens:               [],
            comments:             [],
            whitespace:           [],
            idxTolineTerminators: {}
        }
        currLine = 1
        currColumn = 1
    }

    var source:string
    var index:number
    var result:ILexingResult
    // TODO: will need endLine and endColumn too as they can't be computed easily for multi-line tokens
    var currLine:number
    var currColumn:number
    var length

    export function lex(text:string):ILexingResult {

        reset()
        source = text
        length = text.length
        var inputSize = source.length

        while (index < inputSize) {

            // heavy logic must never be directly inside a function containing a try/catch
            // as most JS runtimes cannot optimize it.
            try {
                // performance optimization, the call to lexNext will add things to the result member.
                // instead of checking what kind of token was encountered here each time.
                scanNext()
            } catch (e) {
                throw e
                // error handling, we only want one error for each sequence of unidentified chars
                // or more precisely an error should have a range
            }
        }

        return result
    }


    var startLine:number

    var startColumn:number

    var startOffset:number


    function scanNext():void {
        startLine = currLine
        startColumn = currColumn
        startOffset = index
        var tokens = result.tokens
        var whitespace = result.whitespace
        var idxTolineTerminators = result.idxTolineTerminators
        var comments = result.comments

        var cc = NEXT_CHAR_CODE()

        if (cc === 45) { // 45 is '-'
            var cc2 = PEEK_CHAR_CODE()
            if (isDecimalDigit(cc2) || cc2 === 46) { // negative number
                var numLiteral = scanNumericLiteral()
                numLiteral.image = "-" + numLiteral.image
                tokens.push(numLiteral)
            }
            else if (cc2 === 45) { // --
                NEXT_CHAR_CODE()
                tokens.push(new MinusMinus(startLine, startColumn, "--"))
            }
            else if (cc2 === 61) { // -=
                NEXT_CHAR_CODE()
                tokens.push(new MinusEq(startLine, startColumn, "-="))
            }
            else { // -
                tokens.push(new Minus(startLine, startColumn, "-"))
            }
            return
        }
        if (cc === 46) { // 46 is '.'
            cc2 = PEEK_CHAR_CODE()
            if (isDecimalDigit(cc2)) { // .5 --> 0.5
                tokens.push(scanNumericLiteral())
            }
            else {
                tokens.push(new Dot(startLine, startColumn, ".")) // .
            }
            return
        }
        if (isDecimalDigit(cc)) {
            tokens.push(scanNumericLiteral()) // 124E4
            return
        }
        if (isIdentifierStart(cc)) {
            tokens.push(scanIdentOrKeyword(cc))
            return
        }
        if (cc === 39 || cc === 34) { // single or double quote opening
            tokens.push(scanStringLiteral())
            return
        }
        if (cc === 47) { // 47 is "/"
            // TODO: regexp literal Ambiguity
            var c2 = PEEK_CHAR_CODE()
            if (c2 === 47) { // // I am a comment
                NEXT_CHAR()
                comments.push(scanSingleLineComment())
                return
            }
            // multi-line-comment
            else if (c2 === 42) { // 42 is "*"
                NEXT_CHAR()
                comments.push(scanMultiLineComment())
            }
            else if (c2 === 61) { // 61 is "="
                NEXT_CHAR()
                tokens.push(new SlashEq(startLine, startColumn, "/="))
            }
            else { // simple regular slash
                tokens.push(new Slash(startLine, startColumn, "/"))
            }
            return
        }
        if (isWhiteSpace(cc)) {
            whitespace.push(new Whitespace(startLine, startColumn, CURR_CHAR()))
            return
        }
        if (isLineTerminator(cc)) {
            var lt = scanLineTerminator(cc)
            whitespace.push(lt) // a lineTerminator is also a kind of whitespace...
            idxTolineTerminators[tokens.length] = lt
            return
        }

        var ch = CURR_CHAR()
        var firstState = INIT_STATE[ch]
        var endOfTheLine = false
        if (firstState) { // is Punctuator?
            var longestMatchedTokType = firstState.token
            var longestMatch = ch
            var currState = firstState
            // traverse state machine
            while (currState && !endOfTheLine) {
                if (currState.nextStates) {
                    var cNext = PEEK_CHAR()
                    currState = currState.nextStates[cNext]
                    if (currState) { // found a longer matching punctuator
                        longestMatch += cNext
                        NEXT_CHAR_CODE()
                        longestMatchedTokType = currState.token
                    }
                } else {
                    endOfTheLine = true
                }
            }
            result.tokens.push(new (<any>longestMatchedTokType)(startLine, startColumn, longestMatch))
            return
        }

        throw new Error("sad sad panda, nothing matched")
    }

    function scanIdentOrKeyword(cc):tok.Token {
        // Backslash (U+005C) starts an escaped character.
        var id = (cc === 0x5C) ? getEscapedIdentifier(cc) : getIdentifier(cc)

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            return new Identifier(startLine, startColumn, CURR_CHAR())
        } else if (isKeyword(id)) {
            var keywordConstructor = keywordsToConstructor[id]
            return new keywordConstructor(startLine, startColumn, id)
        } else if (id === "null") {
            return new NullTok(startLine, startColumn, id)
        } else if (id === "true") {
            return new TrueTok(startLine, startColumn, id)
        } else if (id === "false") {
            return new FalseTok(startLine, startColumn, id)
        } else {
            return new Identifier(startLine, startColumn, id)
        }

    }

    function PEEK_CHAR_CODE():number {
        return source.charCodeAt(index)
    }

    function PEEK_CHAR():string {
        return source.charAt(index)
    }

    function CURR_CHAR():string {
        return source.charAt(index - 1)
    }

    function CURR_CHAR_CODE():number {
        return source.charCodeAt(index - 1)
    }

    function NEXT_CHAR_CODE():number {
        currColumn++
        return source.charCodeAt(index++)
    }

    function NEXT_CHAR():string {
        currColumn++
        return source.charAt(index++)
    }

    function scanLineTerminator(cc):LineTerminator {
        var cc2 = PEEK_CHAR_CODE()
        ++currLine
        if (cc === 0x0D && cc2 === 0x0A) {
            NEXT_CHAR()
            //noinspection JSUnusedAssignment
            currColumn = 1
            return new LineTerminator(startLine, startColumn, "\r\n")
        }
        currColumn = 1
        return new LineTerminator(startLine, startColumn, CURR_CHAR())
    }

    function isWhiteSpace(cc):boolean  {
        return (cc === 0x20) || (cc === 0x09) || (cc === 0x0B) || (cc === 0x0C) || (cc === 0xA0) ||
            (cc >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
                0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cc) >= 0)
    }

    function isLineTerminator(cc):boolean  {
        return (cc === 0x0A) || (cc === 0x0D) || (cc === 0x2028) || (cc === 0x2029)
    }

    /* tslint:disable:max-line-length */
    var Regex = {
        NonAsciiIdentifierStart: new RegExp("[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]"),
        NonAsciiIdentifierPart:  new RegExp("[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]")
    }
    /* tslint:enable:max-line-length */

    function isIdentifierStart(cc):boolean {
        return (cc === 0x24) || (cc === 0x5F) ||  // $ (dollar) and _ (underscore)
            (cc >= 0x41 && cc <= 0x5A) ||         // A..Z
            (cc >= 0x61 && cc <= 0x7A) ||         // a..z
            (cc === 0x5C) ||                      // \ (backslash)
            ((cc >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(cc)))
    }

    function isIdentifierPart(cc):boolean {
        return (cc === 0x24) || (cc === 0x5F) ||  // $ (dollar) and _ (underscore)
            (cc >= 0x41 && cc <= 0x5A) ||         // A..Z
            (cc >= 0x61 && cc <= 0x7A) ||         // a..z
            (cc >= 0x30 && cc <= 0x39) ||         // 0..9
            (cc === 0x5C) ||                      // \ (backslash)
            ((cc >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(cc)))
    }


    // Credits: This function is originally from Esprima.js
    function isDecimalDigit(cc):boolean {
        return (cc >= 0x30 && cc <= 0x39)   // 0..9
    }

    function isKeyword(id):boolean {

        switch (id.length) {
            case 2:
                return (id === "if") || (id === "in") || (id === "do")
            case 3:
                return (id === "var") || (id === "for") || (id === "new") ||
                    (id === "try") || (id === "let")
            case 4:
                return (id === "this") || (id === "else") || (id === "case") ||
                    (id === "void") || (id === "with") || (id === "enum")
            case 5:
                return (id === "while") || (id === "break") || (id === "catch") ||
                    (id === "throw") || (id === "const") || (id === "yield") ||
                    (id === "class") || (id === "super")
            case 6:
                return (id === "return") || (id === "typeof") || (id === "delete") ||
                    (id === "switch") || (id === "export") || (id === "import")
            case 7:
                return (id === "default") || (id === "finally") || (id === "extends")
            case 8:
                return (id === "function") || (id === "continue") || (id === "debugger")
            case 10:
                return (id === "instanceof")
            default:
                return false
        }
    }

    function isHexDigit(ch:string):boolean {
        return "0123456789abcdefABCDEF".indexOf(ch) >= 0
    }

    function scanHexEscape(prefix:string):string {
        var i, len, ch, code = 0

        len = (prefix === "u") ? 4 : 2
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(PEEK_CHAR())) {
                ch = NEXT_CHAR()
                code = code * 16 + "0123456789abcdef".indexOf(ch.toLowerCase())
            } else {
                return ""
            }
        }
        return String.fromCharCode(code)
    }

    function getEscapedIdentifier(ch?:any):string {
        var id

        // hack as one flow that gets here reset the index in the source, while another does not...
        // TODO: less hacky? :)
        ch = ch ? ch : NEXT_CHAR_CODE() // 1st identifier char
        id = String.fromCharCode(ch)

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (ch === 0x5C) {
            if (PEEK_CHAR_CODE() !== 0x75) {
                throw new Error("Sad Sad Panda") // TODO: better error message
            }
            NEXT_CHAR_CODE()
            ch = scanHexEscape("u")
            if (!ch || ch === "\\" || !isIdentifierStart(ch.charCodeAt(0))) {
                throw new Error("Sad Sad Panda") // TODO: better error message
            }
            id = ch
        }

        while (index < length) { //2nd ... nth identifier chars
            ch = PEEK_CHAR_CODE()
            if (!isIdentifierPart(ch)) {
                break
            }
            NEXT_CHAR_CODE()
            id += String.fromCharCode(ch)

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (ch === 0x5C) {
                id = id.substr(0, id.length - 1)
                if (PEEK_CHAR_CODE() !== 0x75) {
                    throw new Error("Sad Sad Panda") // TODO: better error message
                }
                NEXT_CHAR_CODE()
                ch = scanHexEscape("u")
                if (!ch || ch === "\\" || !isIdentifierPart(ch.charCodeAt(0))) {
                    throw new Error("Sad Sad Panda") // TODO: better error message
                }
                id += ch
            }
        }

        return id
    }

    function getIdentifier(cc):string {
        var start = index - 1


        while (index < length) {
            cc = PEEK_CHAR_CODE()
            if (cc === 0x5C) { // Blackslash (U+005C) marks Unicode escape sequence.
                // Esprima logic restarts scanning the identifier from scratch if an escaped character has been found
                // so we need to reset our additional state (currColumn)
                index = start
                currColumn = currColumn - 1
                return getEscapedIdentifier()
            }

            if (isIdentifierPart(cc)) {
                NEXT_CHAR_CODE()
            } else {
                break
            }
        }

        return source.slice(startOffset, index)
    }

    function scanStringLiteral():AbsStringLiteral {
        var str, quote, opening, ch, unescaped

        quote = opening = str = CURR_CHAR()
        while (index < length) {
            ch = NEXT_CHAR()

            if (ch === quote) {
                quote = ""
                str += ch
                break
            } else if (ch === "\\") {
                ch = NEXT_CHAR()
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                        case "u":
                        case "x":
                            if (CURR_CHAR() === "{") {
                                NEXT_CHAR()
                                str += scanUnicodeCodePointEscape()
                            } else {
                                unescaped = scanHexEscape(ch)
                                if (!unescaped) {
                                    throw new Error("Sad Sad Panda") // TODO: better error message
                                }
                                str += unescaped
                            }
                            break
                        case "n":
                            str += "\n"
                            break
                        case "r":
                            str += "\r"
                            break
                        case "t":
                            str += "\t"
                            break
                        case "b":
                            str += "\b"
                            break
                        case "f":
                            str += "\f"
                            break
                        case "v":
                            str += "\x0B"
                            break
                        default:
                            str += ch
                            break
                    }
                } else { // escaped line terminator
                    if (ch === "\r" && PEEK_CHAR() === "\n") {
                        currLine = currLine + 1
                        NEXT_CHAR()
                    }
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                // TODO: unterminated string Error message
                break
            } else {
                str += ch
            }
        }

        if (quote !== "") {
            throw new Error("Sad Sad Panda") // TODO: better error message
        }

        if (opening === "'") {
            return new SingleQuotationStringLiteral(startLine, startColumn, str)
        } else {
            return new DoubleQuotationStringLiteral(startLine, startColumn, str)
        }
    }

    function scanUnicodeCodePointEscape():string {
        var ch, code, cu1, cu2

        ch = CURR_CHAR()
        code = 0

        // At least, one hex digit is required.
        if (ch === "}") {
            throw new Error("Sad Sad Panda") // TODO: better error message
        }

        while (index < length) {
            ch = NEXT_CHAR()
            if (!isHexDigit(ch)) {
                break
            }
            code = code * 16 + "0123456789abcdef".indexOf(ch.toLowerCase())
        }

        if (code > 0x10FFFF || ch !== "}") {
            throw new Error("Sad Sad Panda") // TODO: better error message
        }

        // UTF-16 Encoding
        if (code <= 0xFFFF) {
            return String.fromCharCode(code)
        }
        /* tslint:disable:no-bitwise */
        cu1 = ((code - 0x10000) >> 10) + 0xD800
        cu2 = ((code - 0x10000) & 1023) + 0xDC00
        /* tslint:enable:no-bitwise */
        return String.fromCharCode(cu1, cu2)
    }

    function scanNumericLiteral():AbsNumericLiteral {
        var image, ch, onlyFractionalPart

        ch = CURR_CHAR()
        onlyFractionalPart = ch === "."
        //start = index - 1
        image = ""
        if (ch !== ".") {
            image = CURR_CHAR()
            ch = PEEK_CHAR()

            // Hex number starts with '0x'.
            if (image === "0") {
                if (ch === "x" || ch === "X") {
                    NEXT_CHAR()
                    return scanHexLiteral(image + ch)
                }
            }

            while (isDecimalDigit(PEEK_CHAR_CODE())) {
                image += NEXT_CHAR()
            }
            ch = PEEK_CHAR()
        }

        if (ch === ".") {
            image += ch
            // hack needed due to different ways to keeping the index versus esprima
            // we always consume the first character in a new token before even identifying it in lexNext()
            // this is done to guarantee lexing will terminate. (we will run out of input at some point...)

            if (!onlyFractionalPart) {
                // NEXT_CHAR() needs to be called IFF there was an integer part.
                // in case only a fractional part exists, NEXT_CHAR_CODE() was already called in lexNext()
                NEXT_CHAR()
            }

            while (isDecimalDigit(PEEK_CHAR_CODE())) {
                image += NEXT_CHAR()
            }
            ch = PEEK_CHAR()
        }

        if (ch === "e" || ch === "E") {
            image += NEXT_CHAR()

            ch = PEEK_CHAR()
            if (ch === "+" || ch === "-") {
                image += NEXT_CHAR()
            }
            if (isDecimalDigit(PEEK_CHAR_CODE())) {
                while (isDecimalDigit(PEEK_CHAR_CODE())) {
                    image += NEXT_CHAR()
                }
            } else {
                throw new Error("Sad Sad Panda") // TODO: better error message
            }
        }

        if (isIdentifierStart(CURR_CHAR_CODE)) {
            // an identifier can not start immediately following an numeric literal
            throw new Error("Sad Sad Panda") // TODO: better error message
        }

        return new DecimalLiteral(startLine, startColumn, image)

    }

    function scanHexLiteral(prefix:string):HexIntegerLiteral {
        var image = ""

        while (index < length) {
            if (!isHexDigit(PEEK_CHAR())) {
                break
            }
            image += NEXT_CHAR()
        }

        if (image.length === 0) {
            throw new Error("Sad Sad Panda") // TODO: better error message
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throw new Error("Sad Sad Panda") // TODO: better error message
        }

        return new HexIntegerLiteral(startLine, startColumn, prefix + image)
    }

    function scanSingleLineComment():SingleLineComment {
        var cc, ch, image = ""

        while (index < length) {
            cc = PEEK_CHAR_CODE()

            if (isLineTerminator(cc)) {
                return new SingleLineComment(startLine, startColumn, "//" + image)
            }
            ch = NEXT_CHAR()
            image += ch
        }

        // single line comment on the last line in the source (no line terminator)
        return new SingleLineComment(startLine, startColumn, "//" + image)
    }

    function scanMultiLineComment():AbsComment {
        var hasLineTerminator, cc, image = "", comment

        while (index < length) {
            cc = PEEK_CHAR_CODE()
            if (isLineTerminator(cc)) {
                image += NEXT_CHAR()
                if (cc === 0x0D && PEEK_CHAR_CODE() === 0x0A) {
                    image += NEXT_CHAR()
                }
                hasLineTerminator = true
                ++currLine
                currColumn = 1
            } else if (cc === 0x2A) { // '/'
                image += NEXT_CHAR()
                if (PEEK_CHAR_CODE() === 0x2F) { // '*'
                    image += NEXT_CHAR()
                    if (hasLineTerminator) {
                        comment = new MultipleLineCommentWithTerminator(startLine, startColumn, "/*" + image)
                        result.idxTolineTerminators[result.tokens.length] = comment
                        return comment

                    }
                    return new MultipleLineCommentWithoutTerminator(startLine, startColumn, "/*" + image)


                }
            } else {
                image += NEXT_CHAR()
            }
        }

        // Ran off the end of the file - the whole thing is a comment
        // TODO: add error about unterminated comment?
        if (hasLineTerminator) {
            comment = new MultipleLineCommentWithTerminator(startLine, startColumn, "/*" + image)
            result.idxTolineTerminators[result.tokens.length] = comment
            return comment

        }
        return new MultipleLineCommentWithoutTerminator(startLine, startColumn, "/*" + image)
    }

    var keywordsToConstructor = {
        "if":         IfTok,
        "do":         DoTok,
        "in":         InTok,
        "var":        VarTok,
        "for":        ForTok,
        "new":        NewTok,
        "try":        TryTok,
        "let":        LetTok,
        "this":       ThisTok,
        "else":       ElseTok,
        "case":       CaseTok,
        "void":       VoidTok,
        "with":       WithTok,
        "enum":       EnumTok,
        "while":      WhileTok,
        "break":      BreakTok,
        "catch":      CatchTok,
        "throw":      ThrowTok,
        "const":      ConstTok,
        "yield":      YieldTok,
        "class":      ClassTok,
        "super":      SuperTok,
        "return":     ReturnTok,
        "typeof":     TypeOfTok,
        "delete":     DeleteTok,
        "switch":     SwitchTok,
        "export":     ExportTok,
        "default":    DefaultTok,
        "finally":    FinallyTok,
        "extends":    ExtendsTok,
        "function":   FunctionTok,
        "continue":   ContinueTok,
        "debugger":   DebuggerTok,
        "instanceof": InstanceOfTok
    }
}

