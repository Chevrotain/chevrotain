import { Token } from "../../../../src/scan/tokens_public"

export class VirtualToken extends Token {
    constructor() {
        super()
    }
}

export class IdentTok extends Token {
    constructor() {
        super()
    }
}

// DOCS: once again an example of Token types hierarchies
export class LiteralTok extends Token {}
export class StringTok extends LiteralTok {
    constructor() {
        super()
    }
}
export class IntTok extends LiteralTok {
    constructor() {
        super()
    }
}

export class BigIntTok extends IntTok {
    constructor() {
        super()
    }
}

export class Keyword extends Token {}

export class CreateTok extends Keyword {
    constructor() {
        super()
    }
}

export class TableTok extends Keyword {
    constructor() {
        super()
    }
}

export class InsertTok extends Keyword {
    constructor() {
        super()
    }
}

export class IntoTok extends Keyword {
    constructor() {
        super()
    }
}

export class DeleteTok extends Keyword {
    constructor() {
        super()
    }
}

export class FromTok extends Keyword {
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

export class CommaTok extends Token {
    constructor() {
        super()
    }
}

export class SemiColonTok extends Token {
    constructor() {
        super()
    }
}

export class DotTok extends Token {
    constructor() {
        super()
    }
}

/* tslint:disable:class-name */
// virtual tokens for Building the parseTree, these just give a "type/specification/categorization" to a ParseTree
export class STATEMENTS extends VirtualToken {}
export class CREATE_STMT extends VirtualToken {}
export class INSERT_STMT extends VirtualToken {}
export class DELETE_STMT extends VirtualToken {}
export class QUALIFIED_NAME extends VirtualToken {}
export class DOTS extends VirtualToken {}
export class COMMAS extends VirtualToken {}

// some "INVALID" virtual tokens can be defined to output a more "precise" ParseTree in case of an re-sync error
// defining them as subclasses of the "valid" virtual tokens can making handling of invalid input easier in whatever
// component which consumes the output ParseTree in order to build some Ast or other data structure.
export class INVALID_DDL extends VirtualToken {}
export class INVALID_CREATE_STMT extends CREATE_STMT {}
export class INVALID_INSERT_STMT extends INSERT_STMT {}
export class INVALID_DELETE_STMT extends DELETE_STMT {}
export class INVALID_QUALIFIED_NAME extends QUALIFIED_NAME {}
/* tslint:enable:class-name */
