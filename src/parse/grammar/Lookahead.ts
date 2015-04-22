/// <reference path="GAst.ts" />
/// <reference path="../../scan/Tokens.ts" />
/// <reference path="Path.ts" />
/// <reference path="Interpreter2.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

module chevrotain.lookahead {

    import gast = chevrotain.gast
    import t = chevrotain.tokens
    import p = chevrotain.path
    import interp = chevrotain.interpreter

    export function buildLookaheadForOption(optionOccurrence:number, ruleName:string, ruleGrammar:gast.TOP_LEVEL):() => boolean {
        return buildLookAheadForGrammarRule(interp.NextInsideOptionWalker, optionOccurrence, ruleName, ruleGrammar)
    }

    export function buildLookaheadForMany(manyOccurrence:number, ruleName:string, ruleGrammar:gast.TOP_LEVEL):() => boolean {
        return buildLookAheadForGrammarRule(interp.NextInsideManyWalker, manyOccurrence, ruleName, ruleGrammar)
    }

    function buildLookAheadForGrammarRule(ruleWalker:typeof interp.AbstractNextPossibleTokensWalker, ruleOccurrence:number,
                                          ruleName:string, ruleGrammar:gast.TOP_LEVEL):() => boolean {
        var path:p.IRuleGrammarPath = {
            ruleStack: [ruleName],
            occurrenceStack: [1],
            occurrence: ruleOccurrence
        }

        var possibleNextTokTypes = new ruleWalker(ruleGrammar, path).startWalking()

        return function () {
            return _.any(possibleNextTokTypes, function (possibleTok) {
                return this.NEXT_TOKEN() instanceof possibleTok
            }, this)
        }

    }

}
