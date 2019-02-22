export declare class VirtualToken {
    static PATTERN: RegExp;
}
export declare class IdentTok {
    static PATTERN: RegExp;
}
export declare class LiteralTok {
    static PATTERN: RegExp;
}
export declare class StringTok extends LiteralTok {
}
export declare class IntTok extends LiteralTok {
}
export declare class BigIntTok extends IntTok {
}
export declare class Keyword {
    static PATTERN: RegExp;
}
export declare class CreateTok extends Keyword {
}
export declare class TableTok extends Keyword {
}
export declare class InsertTok extends Keyword {
}
export declare class IntoTok extends Keyword {
}
export declare class DeleteTok extends Keyword {
}
export declare class FromTok extends Keyword {
}
export declare class LParenTok {
    static PATTERN: RegExp;
}
export declare class RParenTok {
    static PATTERN: RegExp;
}
export declare class CommaTok {
    static PATTERN: RegExp;
}
export declare class SemiColonTok {
    static PATTERN: RegExp;
}
export declare class DotTok {
    static PATTERN: RegExp;
}
export declare class STATEMENTS extends VirtualToken {
}
export declare class CREATE_STMT extends VirtualToken {
}
export declare class INSERT_STMT extends VirtualToken {
}
export declare class DELETE_STMT extends VirtualToken {
}
export declare class QUALIFIED_NAME extends VirtualToken {
}
export declare class DOTS extends VirtualToken {
}
export declare class COMMAS extends VirtualToken {
}
export declare class INVALID_DDL extends VirtualToken {
}
export declare class INVALID_CREATE_STMT extends CREATE_STMT {
}
export declare class INVALID_INSERT_STMT extends INSERT_STMT {
}
export declare class INVALID_DELETE_STMT extends DELETE_STMT {
}
export declare class INVALID_QUALIFIED_NAME extends QUALIFIED_NAME {
}
