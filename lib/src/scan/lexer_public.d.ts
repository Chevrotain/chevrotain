import { CustomPatternMatcherFunc, ILexerConfig, ILexerDefinitionError, ILexingError, IMultiModeLexerDefinition, IToken, TokenType } from "../../api";
export interface ILexingResult {
    tokens: IToken[];
    groups: {
        [groupName: string]: IToken[];
    };
    errors: ILexingError[];
}
export declare enum LexerDefinitionErrorType {
    MISSING_PATTERN = 0,
    INVALID_PATTERN = 1,
    EOI_ANCHOR_FOUND = 2,
    UNSUPPORTED_FLAGS_FOUND = 3,
    DUPLICATE_PATTERNS_FOUND = 4,
    INVALID_GROUP_TYPE_FOUND = 5,
    PUSH_MODE_DOES_NOT_EXIST = 6,
    MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE = 7,
    MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY = 8,
    MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST = 9,
    LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED = 10,
    SOI_ANCHOR_FOUND = 11,
    EMPTY_MATCH_PATTERN = 12,
    NO_LINE_BREAKS_FLAGS = 13,
    UNREACHABLE_PATTERN = 14,
    IDENTIFY_TERMINATOR = 15,
    CUSTOM_LINE_BREAK = 16
}
export interface IRegExpExec {
    exec: CustomPatternMatcherFunc;
}
export declare class Lexer {
    protected lexerDefinition: TokenType[] | IMultiModeLexerDefinition;
    static SKIPPED: string;
    static NA: RegExp;
    lexerDefinitionErrors: ILexerDefinitionError[];
    lexerDefinitionWarning: ILexerDefinitionError[];
    protected patternIdxToConfig: any;
    protected charCodeToPatternIdxToConfig: any;
    protected modes: string[];
    protected defaultMode: string;
    protected emptyGroups: {
        [groupName: string]: IToken;
    };
    private config;
    private trackStartLines;
    private trackEndLines;
    private hasCustom;
    private canModeBeOptimized;
    constructor(lexerDefinition: TokenType[] | IMultiModeLexerDefinition, config?: ILexerConfig);
    tokenize(text: string, initialMode?: string): ILexingResult;
    private tokenizeInternal;
    private handleModes;
    private chopInput;
    private updateLastIndex;
    private updateTokenEndLineColumnLocation;
    private computeNewColumn;
    private createTokenInstance;
    private createOffsetOnlyToken;
    private createStartOnlyToken;
    private createFullToken;
    private addToken;
    private addTokenUsingPush;
    private addTokenUsingMemberAccess;
    private match;
    private matchWithTest;
    private matchWithExec;
}
