/**
 * this interfaces defines the path the parser "took" to reach a certain position
 * in the grammar.
 */
export interface IGrammarPath {
    ruleStack:string[]
    occurrenceStack:number[]
}

export interface ITokenGrammarPath extends IGrammarPath {
    lastTok:Function
    lastTokOccurrence:number
}

export interface IRuleGrammarPath extends IGrammarPath {
    occurrence:number
}
