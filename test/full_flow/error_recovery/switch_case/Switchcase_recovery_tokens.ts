import { Token } from "../../../../src/scan/tokens_public"

export class IdentTok extends Token {}
export class LiteralTok extends Token {}
export class IntTok extends LiteralTok {}
export class StringTok extends LiteralTok {}
export class Keyword extends Token {}

export class SwitchTok extends Keyword {
    constructor() {
        super()
    }
}

export class CaseTok extends Keyword {
    constructor() {
        super()
    }
}

export class ReturnTok extends Keyword {
    constructor() {
        super()
    }
}

export class LParenTok extends Token {
    constructor() {
        super()
    }
}

export class RParenTok extends Token {
    constructor() {
        super()
    }
}

export class LCurlyTok extends Token {
    constructor() {
        super()
    }
}

export class RCurlyTok extends Token {
    constructor() {
        super()
    }
}

export class ColonTok extends Token {
    constructor() {
        super()
    }
}

export class SemiColonTok extends Token {
    constructor() {
        super()
    }
}

// to force some branches for coverage
export class DoubleSemiColonTok extends SemiColonTok {
    constructor() {
        super()
    }
}
