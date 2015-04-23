/// <reference path="gast.ts" />
/// <reference path="../../scan/tokens.ts" />
/// <reference path="path.ts" />
/// <reference path="interpreter.ts" />
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

    function buildLookAheadForGrammarRule(prodWalker:typeof interp.AbstractNextPossibleTokensWalker, ruleOccurrence:number,
                                          ruleName:string, ruleGrammar:gast.TOP_LEVEL):() => boolean {
        var path:p.IRuleGrammarPath = {
            ruleStack:       [ruleName],
            occurrenceStack: [1],
            occurrence:      ruleOccurrence
        }

        var possibleNextTokTypes = new prodWalker(ruleGrammar, path).startWalking()

        return function () {
            return _.any(possibleNextTokTypes, function (possibleTok) {
                return this.NEXT_TOKEN() instanceof possibleTok
            }, this)
        }
    }
}
