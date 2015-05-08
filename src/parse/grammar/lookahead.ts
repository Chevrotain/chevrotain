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
    import f = chevrotain.first

    export function buildLookaheadForTopLevel(rule:gast.TOP_LEVEL):() => boolean {
        var restProd = new gast.FLAT(rule.definition)
        var possibleTokTypes = f.first(restProd)
        return getSimpleLookahead(possibleTokTypes)
    }

    export function buildLookaheadForOption(optionOccurrence:number, ruleGrammar:gast.TOP_LEVEL):() => boolean {
        return buildLookAheadForGrammarProd(interp.NextInsideOptionWalker, optionOccurrence, ruleGrammar)
    }

    export function buildLookaheadForMany(manyOccurrence:number, ruleGrammar:gast.TOP_LEVEL):() => boolean {
        return buildLookAheadForGrammarProd(interp.NextInsideManyWalker, manyOccurrence, ruleGrammar)
    }

    export function buildLookaheadForAtLeastOne(manyOccurrence:number, ruleGrammar:gast.TOP_LEVEL):() => boolean {
        return buildLookAheadForGrammarProd(interp.NextInsideAtLeastOneWalker, manyOccurrence, ruleGrammar)
    }

    export function buildLookaheadForOr(orOccurrence:number, ruleGrammar:gast.TOP_LEVEL):() => number {

        var alternativesTokens = new interp.NextInsideOrWalker(ruleGrammar, orOccurrence).startWalking()

        /**
         * This will return the Index of the alternative to take or -1 if none of the alternatives match
         */
        return function ():number {
            for (var i = 0; i < alternativesTokens.length; i++) {
                if (_.any(alternativesTokens[i], function (possibleTok) {
                        return this.NEXT_TOKEN() instanceof possibleTok
                    }, this)) {
                    return i;
                }
            }
            return -1;
        }
    }

    function buildLookAheadForGrammarProd(prodWalker:typeof interp.AbstractNextPossibleTokensWalker, ruleOccurrence:number,
                                          ruleGrammar:gast.TOP_LEVEL):() => boolean {
        var path:p.IRuleGrammarPath = {
            ruleStack:       [ruleGrammar.name],
            occurrenceStack: [1],
            occurrence:      ruleOccurrence
        }

        var walker:interp.AbstractNextPossibleTokensWalker = new prodWalker(ruleGrammar, path)
        var possibleNextTokTypes = walker.startWalking()

        return getSimpleLookahead(possibleNextTokTypes)
    }

    function getSimpleLookahead(possibleNextTokTypes:Function[]):() => boolean {
        return function ():boolean {
            return _.any(possibleNextTokTypes, function (possibleTok) {
                return this.NEXT_TOKEN() instanceof possibleTok
            }, this)
        }
    }

}
