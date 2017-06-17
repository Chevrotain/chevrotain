import { TokenConstructor } from "../../scan/lexer_public"
/**
 * this interfaces defines the path the parser "took" to reach a certain position
 * in the grammar.
 */
export interface IGrammarPath {
    /**
     * The Grammar rules invoked and still unterminated to reach this Grammar Path.
     */
    ruleStack: string[]
    /**
     * The occurrence index (SUBRULE1/2/3/5/...) of each Grammar rule invoked and still unterminated.
     * Used to distinguish between two invocations of the same subrule at the same top level rule.
     * Example: (QualifiedName: SUBRULE1(Identifier) (DOT SUBRULE2(Identifier))*
     */
    occurrenceStack: number[]
}

export interface ITokenGrammarPath extends IGrammarPath {
    lastTok: Function
    lastTokOccurrence: number
}

export interface ISyntacticContentAssistPath extends IGrammarPath {
    nextTokenType: TokenConstructor
    nextTokenOccurrence: number
}

export interface IRuleGrammarPath extends IGrammarPath {
    occurrence: number
}
