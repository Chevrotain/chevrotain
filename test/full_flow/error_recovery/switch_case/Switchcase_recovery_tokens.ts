/// <reference path="../../../../src/scan/tokens.ts" />

module chevrotain.examples.recovery.switchcase {

    import tok = chevrotain.tokens


    export class IdentTok extends tok.Token {}

    export class LiteralTok extends tok.Token {}
    export class IntTok extends LiteralTok {}
    export class StringTok extends LiteralTok {}


    export class Keyword extends tok.Token {}

    export class SwitchTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("switch", -1, startLine, startColumn) }
    }

    export class CaseTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("case", -1, startLine, startColumn) }
    }

    export class ReturnTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("INTO", -1, startLine, startColumn) }
    }

    export class LParenTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super("(", -1, startLine, startColumn) }
    }

    export class RParenTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(")", -1, startLine, startColumn) }
    }

    export class LCurlyTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super("{", -1, startLine, startColumn) }
    }

    export class RCurlyTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super("}", -1, startLine, startColumn) }
    }

    export class ColonTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(":", -1, startLine, startColumn) }
    }

    export class SemiColonTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(";", -1, startLine, startColumn) }
    }

}
