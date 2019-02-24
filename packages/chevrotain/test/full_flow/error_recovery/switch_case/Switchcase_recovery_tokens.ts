import {} from "../../../../src/scan/tokens_public"

export class IdentTok {
    static PATTERN = /NA/
}
export class LiteralTok {
    static PATTERN = /NA/
}
export class IntTok extends LiteralTok {}
export class StringTok extends LiteralTok {}
export class Keyword {
    static PATTERN = /NA/
}

export class SwitchTok extends Keyword {}

export class CaseTok extends Keyword {}

export class ReturnTok extends Keyword {}

export class LParenTok {
    static PATTERN = /NA/
}

export class RParenTok {
    static PATTERN = /NA/
}

export class LCurlyTok {
    static PATTERN = /NA/
}

export class RCurlyTok {
    static PATTERN = /NA/
}

export class ColonTok {
    static PATTERN = /NA/
}

export class SemiColonTok {
    static PATTERN = /NA/
}

// to force some branches for coverage
export class DoubleSemiColonTok extends SemiColonTok {}
