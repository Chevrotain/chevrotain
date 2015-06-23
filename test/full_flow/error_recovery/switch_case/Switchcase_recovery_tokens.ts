
module chevrotain.examples.recovery.switchcase {


    export class IdentTok extends Token {}
    export class LiteralTok extends Token {}
    export class IntTok extends LiteralTok {}
    export class StringTok extends LiteralTok {}
    export class Keyword extends Token {}

    export class SwitchTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("switch", -1, startLine, startColumn) }
    }

    export class CaseTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("case", -1, startLine, startColumn) }
    }

    export class ReturnTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("INTO", -1, startLine, startColumn) }
    }

    export class LParenTok extends Token {
        constructor(startLine:number, startColumn:number) { super("(", -1, startLine, startColumn) }
    }

    export class RParenTok extends Token {
        constructor(startLine:number, startColumn:number) { super(")", -1, startLine, startColumn) }
    }

    export class LCurlyTok extends Token {
        constructor(startLine:number, startColumn:number) { super("{", -1, startLine, startColumn) }
    }

    export class RCurlyTok extends Token {
        constructor(startLine:number, startColumn:number) { super("}", -1, startLine, startColumn) }
    }

    export class ColonTok extends Token {
        constructor(startLine:number, startColumn:number) { super(":", -1, startLine, startColumn) }
    }

    export class SemiColonTok extends Token {
        constructor(startLine:number, startColumn:number) { super(";", -1, startLine, startColumn) }
    }

}
