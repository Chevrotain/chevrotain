import { Rule } from "../../../src/parse/grammar/gast/gast_public";
export declare class IdentTok {
    static PATTERN: RegExp;
}
export declare class DotTok {
    static PATTERN: RegExp;
}
export declare class DotDotTok {
    static PATTERN: RegExp;
}
export declare class ColonTok {
    static PATTERN: RegExp;
}
export declare class LSquareTok {
    static PATTERN: RegExp;
}
export declare class RSquareTok {
    static PATTERN: RegExp;
}
export declare class ActionTok {
    static PATTERN: RegExp;
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
export declare class SemicolonTok {
    static PATTERN: RegExp;
}
export declare class UnsignedIntegerLiteralTok {
    static PATTERN: RegExp;
}
export declare class DefaultTok {
    static PATTERN: RegExp;
}
export declare class AsteriskTok {
    static PATTERN: RegExp;
}
export declare class EntityTok {
    static PATTERN: RegExp;
}
export declare class NamespaceTok {
    static PATTERN: RegExp;
}
export declare class TypeTok {
    static PATTERN: RegExp;
}
export declare class ConstTok {
    static PATTERN: RegExp;
}
export declare class RequiredTok {
    static PATTERN: RegExp;
}
export declare class KeyTok {
    static PATTERN: RegExp;
}
export declare class ElementTok {
    static PATTERN: RegExp;
}
export declare let atLeastOneRule: Rule;
export declare let atLeastOneSepRule: Rule;
export declare let qualifiedName: Rule;
export declare let qualifiedNameSep: Rule;
export declare let paramSpec: Rule;
export declare let actionDec: Rule;
export declare let actionDecSep: Rule;
export declare let manyActions: Rule;
export declare let cardinality: Rule;
export declare let assignedTypeSpec: Rule;
export declare let lotsOfOrs: Rule;
export declare let emptyAltOr: Rule;
export declare let callArguments: Rule;
