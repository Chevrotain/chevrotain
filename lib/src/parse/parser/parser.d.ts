import { CstNode, IgnoredParserIssues, IParserConfig, IParserDefinitionError, IRecognitionException, IRuleConfig, IToken, TokenType, TokenVocabulary } from "../../../api";
import { MixedInParser } from "./traits/parser_traits";
export declare const END_OF_FILE: IToken;
export declare type TokenMatcher = (token: IToken, tokType: TokenType) => boolean;
export declare type lookAheadSequence = TokenType[][];
export declare const DEFAULT_PARSER_CONFIG: IParserConfig;
export declare const DEFAULT_RULE_CONFIG: IRuleConfig<any>;
export declare enum ParserDefinitionErrorType {
    INVALID_RULE_NAME = 0,
    DUPLICATE_RULE_NAME = 1,
    INVALID_RULE_OVERRIDE = 2,
    DUPLICATE_PRODUCTIONS = 3,
    UNRESOLVED_SUBRULE_REF = 4,
    LEFT_RECURSION = 5,
    NONE_LAST_EMPTY_ALT = 6,
    AMBIGUOUS_ALTS = 7,
    CONFLICT_TOKENS_RULES_NAMESPACE = 8,
    INVALID_TOKEN_NAME = 9,
    INVALID_NESTED_RULE_NAME = 10,
    DUPLICATE_NESTED_NAME = 11,
    NO_NON_EMPTY_LOOKAHEAD = 12,
    AMBIGUOUS_PREFIX_ALTS = 13,
    TOO_MANY_ALTS = 14
}
export interface IParserDuplicatesDefinitionError extends IParserDefinitionError {
    dslName: string;
    occurrence: number;
    parameter?: string;
}
export interface IParserEmptyAlternativeDefinitionError extends IParserDefinitionError {
    occurrence: number;
    alternative: number;
}
export interface IParserAmbiguousAlternativesDefinitionError extends IParserDefinitionError {
    occurrence: number;
    alternatives: number[];
}
export interface IParserUnresolvedRefDefinitionError extends IParserDefinitionError {
    unresolvedRefName: string;
}
export interface IParserState {
    errors: IRecognitionException[];
    lexerState: any;
    RULE_STACK: string[];
    CST_STACK: CstNode[];
    LAST_EXPLICIT_RULE_STACK: number[];
}
export declare type Predicate = () => boolean;
export declare function EMPTY_ALT<T>(value?: T): () => T;
export declare class Parser {
    static DEFER_DEFINITION_ERRORS_HANDLING: boolean;
    /**
     *  @deprecated use the **instance** method with the same name instead
     */
    static performSelfAnalysis(parserInstance: Parser): void;
    performSelfAnalysis(this: MixedInParser): void;
    ignoredIssues: IgnoredParserIssues;
    definitionErrors: IParserDefinitionError[];
    selfAnalysisDone: boolean;
    constructor(tokenVocabulary: TokenVocabulary, config?: IParserConfig);
}
