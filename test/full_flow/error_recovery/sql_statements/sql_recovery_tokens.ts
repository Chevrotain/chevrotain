export class VirtualToken {
	static PATTERN = /NA/
}

export class IdentTok {
	static PATTERN = /NA/
}

// DOCS: once again an example of Token types hierarchies
export class LiteralTok {
	static PATTERN = /NA/
}
export class StringTok extends LiteralTok {}
export class IntTok extends LiteralTok {}

export class BigIntTok extends IntTok {}

export class Keyword {
	static PATTERN = /NA/
}

export class CreateTok extends Keyword {}

export class TableTok extends Keyword {}

export class InsertTok extends Keyword {}

export class IntoTok extends Keyword {}

export class DeleteTok extends Keyword {}

export class FromTok extends Keyword {}

export class LParenTok {
	static PATTERN = /NA/
}

export class RParenTok {
	static PATTERN = /NA/
}

export class CommaTok {
	static PATTERN = /NA/
}

export class SemiColonTok {
	static PATTERN = /NA/
}

export class DotTok {
	static PATTERN = /NA/
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
