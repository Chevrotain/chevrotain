/// <reference path="gast.ts" />
/// <reference path="../../scan/tokens.ts" />
/// <reference path="path.ts" />
/// <reference path="interpreter.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

module chevrotain.lookahead {

    import gast = chevrotain.gast
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

    export function buildLookaheadForOr(orOccurrence:number, ruleGrammar:gast.TOP_LEVEL, ignoreAmbiguities:boolean = false):() => number {

        var alternativesTokens = new interp.NextInsideOrWalker(ruleGrammar, orOccurrence).startWalking()

        if (!ignoreAmbiguities) {
            var altsAmbiguityErrors = checkAlternativesAmbiguities(alternativesTokens)

            if (!_.isEmpty(altsAmbiguityErrors)) {
                var errorMessages = _.map(altsAmbiguityErrors, (currAmbiguity) => {
                    return `Ambiguous alternatives ${currAmbiguity.alts.join(" ,")} in OR${orOccurrence} inside ${ruleGrammar.name} ` +
                        `Rule, ${tokenName(currAmbiguity.token)} may appears as the first Terminal in all these alternatives.\n`
                })

                throw new Error(errorMessages.join("\n ---------------- \n") +
                    "To Resolve this, either: \n" +
                    "1. refactor your grammar to be LL(1)\n" +
                    "2. provide explicit lookahead functions in the form {WHEN:laFunc, THEN_DO:...}\n" +
                    "3. Add ignore arg to this OR Production:\n" +
                    "OR([], 'msg', recognizer.IGNORE_AMBIGUITIES)\n" +
                    "In that case the parser will always pick the first alternative that" +
                    " matches and ignore all the others")
            }
        }

        /**
         * This will return the Index of the alternative to take or -1 if none of the alternatives match
         */
        return function ():number {
            var nextToken = this.NEXT_TOKEN()
            for (var i = 0; i < alternativesTokens.length; i++) {
                var currAltTokens = alternativesTokens[i]
                for (var j = 0; j < (<any>currAltTokens).length; j++) {
                    if (nextToken instanceof currAltTokens[j]) {
                        return i
                    }
                }
            }
            return -1;
        }
    }

    export interface IAmbiguityDescriptor {
        alts:number[]
        token:Function
    }

    export function checkAlternativesAmbiguities(alternativesTokens:Function[][]):IAmbiguityDescriptor[] {

        var allTokensFlat = _.flatten(alternativesTokens)
        var uniqueTokensFlat = _.uniq(allTokensFlat)

        var tokensToAltsIndicesItAppearsIn = _.map(uniqueTokensFlat, (seekToken) => {
            var altsCurrTokenAppearsIn = _.pick(alternativesTokens, (altToLookIn) => {
                return <any> _.find(altToLookIn, (currToken) => {
                    return currToken === seekToken
                })
            })

            var altsIndicesTokenAppearsIn = _.map(_.keys(altsCurrTokenAppearsIn), (index) => {
                return parseInt(index, 10) + 1
            })

            return {token: seekToken, alts: altsIndicesTokenAppearsIn}
        })

        var tokensToAltsIndicesWithAmbiguity:any = _.filter(tokensToAltsIndicesItAppearsIn, (tokAndAltsItAppearsIn) => {
            return tokAndAltsItAppearsIn.alts.length > 1
        })

        return tokensToAltsIndicesWithAmbiguity
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
            var nextToken = this.NEXT_TOKEN()
            for (var j = 0; j < possibleNextTokTypes.length; j++) {
                if (nextToken instanceof possibleNextTokTypes[j]) {
                    return true
                }
            }
            return false
        }
    }

}
