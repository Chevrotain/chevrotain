import { Rule } from "./gast_public";
import { IgnoredParserIssues, IGrammarResolverErrorMessageProvider, IGrammarValidatorErrorMessageProvider, IParserDefinitionError, TokenType } from "../../../../api";
export declare function resolveGrammar(options: {
    rules: Rule[];
    errMsgProvider?: IGrammarResolverErrorMessageProvider;
}): IParserDefinitionError[];
export declare function validateGrammar(options: {
    rules: Rule[];
    maxLookahead: number;
    tokenTypes: TokenType[];
    grammarName: string;
    errMsgProvider: IGrammarValidatorErrorMessageProvider;
    ignoredIssues?: IgnoredParserIssues;
}): IParserDefinitionError[];
export declare function assignOccurrenceIndices(options: {
    rules: Rule[];
}): void;
