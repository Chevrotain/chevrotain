export declare class IdentTok {
    static PATTERN: RegExp;
}
export declare class LiteralTok {
    static PATTERN: RegExp;
}
export declare class IntTok extends LiteralTok {
}
export declare class StringTok extends LiteralTok {
}
export declare class Keyword {
    static PATTERN: RegExp;
}
export declare class SwitchTok extends Keyword {
}
export declare class CaseTok extends Keyword {
}
export declare class ReturnTok extends Keyword {
}
export declare class LParenTok {
    static PATTERN: RegExp;
}
export declare class RParenTok {
    static PATTERN: RegExp;
}
export declare class LCurlyTok {
    static PATTERN: RegExp;
}
export declare class RCurlyTok {
    static PATTERN: RegExp;
}
export declare class ColonTok {
    static PATTERN: RegExp;
}
export declare class SemiColonTok {
    static PATTERN: RegExp;
}
export declare class DoubleSemiColonTok extends SemiColonTok {
}
