/// <reference path="../../../../src/scan/tokens.ts" />

module chevrotain.examples.recovery.sql {


    export class IdentTok extends Token {
        constructor(startLine:number, startColumn:number, image:string) { super(image, -1, startLine, startColumn) }
    }

    // DOCS: once again an example of Token types hierarchies
    export class LiteralTok extends Token {}
    export class StringTok extends LiteralTok {
        constructor(startLine:number, startColumn:number, image:string) { super(image, -1, startLine, startColumn) }
    }
    export class IntTok extends LiteralTok {
        constructor(startLine:number, startColumn:number, image:string) { super(image, -1, startLine, startColumn) }
    }

    export class Keyword extends Token {}

    export class CreateTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("CREATE", -1, startLine, startColumn) }
    }

    export class TableTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("TABLE", -1, startLine, startColumn) }
    }

    export class InsertTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("INSERT", -1, startLine, startColumn) }
    }

    export class IntoTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("INTO", -1, startLine, startColumn) }
    }

    export class DeleteTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("DELETE", -1, startLine, startColumn) }
    }

    export class FromTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super("FROM", -1, startLine, startColumn) }
    }

    export class LParenTok extends Token {
        constructor(startLine:number, startColumn:number) { super("(", -1, startLine, startColumn) }
    }

    export class RParenTok extends Token {
        constructor(startLine:number, startColumn:number) { super(")", -1, startLine, startColumn) }
    }

    export class CommaTok extends Token {
        constructor(startLine:number, startColumn:number) { super(",", -1, startLine, startColumn) }
    }

    export class SemiColonTok extends Token {
        constructor(startLine:number, startColumn:number) { super(";", -1, startLine, startColumn) }
    }

    export class DotTok extends Token {
        constructor(startLine:number, startColumn:number) { super(".", -1, startLine, startColumn) }
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
}
