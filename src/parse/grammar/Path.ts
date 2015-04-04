/// <reference path="../../scan/Tokens.ts" />

module chevrotain.path {

    import tok = chevrotain.tokens

    /**
     * this interfaces defines the path the parser "took" to reach the position
     * in which a content assist is required
     */
    export interface IGrammarPath {
        ruleStack:string[]
        occurrenceStack:number[]
        lastTok:Function
        lastTokOccurrence:number
    }

    var invalidContentAssistPath = {ruleStack: [], occurrenceStack: [], lastTok: tok.NoneToken, lastTokOccurrence: -1}

    export function NO_PATH_FOUND():IGrammarPath {
        return invalidContentAssistPath
    }
}
