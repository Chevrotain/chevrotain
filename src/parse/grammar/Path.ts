/// <reference path="../../scan/Tokens.ts" />

module chevrotain.path {

    import tok = chevrotain.tokens

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

    var invalidContentAssistPath = {ruleStack: [], occurrenceStack: [], lastTok: tok.NoneToken, lastTokOccurrence: -1}

    export function NO_PATH_FOUND():ITokenGrammarPath {
        return invalidContentAssistPath
    }
}
