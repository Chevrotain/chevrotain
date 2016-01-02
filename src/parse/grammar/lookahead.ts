namespace chevrotain.lookahead {

    import gast = chevrotain.gast
    import p = chevrotain.path
    import interp = chevrotain.interpreter
    import f = chevrotain.first
    import AlternativesFirstTokens = chevrotain.interpreter.AlternativesFirstTokens

    export function buildLookaheadForTopLevel(rule:gast.Rule):() => boolean {
        let restProd = new gast.Flat(rule.definition)
        let possibleTokTypes = f.first(restProd)
        return getSimpleLookahead(possibleTokTypes)
    }

    export function buildLookaheadForOption(optionOccurrence:number, ruleGrammar:gast.Rule):() => boolean {
        return buildLookAheadForGrammarProd(interp.NextInsideOptionWalker, optionOccurrence, ruleGrammar)
    }

    export function buildLookaheadForMany(manyOccurrence:number, ruleGrammar:gast.Rule):() => boolean {
        return buildLookAheadForGrammarProd(interp.NextInsideManyWalker, manyOccurrence, ruleGrammar)
    }

    export function buildLookaheadForManySep(manyOccurrence:number, ruleGrammar:gast.Rule):() => boolean {
        return buildLookAheadForGrammarProd(interp.NextInsideManySepWalker, manyOccurrence, ruleGrammar)
    }

    export function buildLookaheadForAtLeastOne(manyOccurrence:number, ruleGrammar:gast.Rule):() => boolean {
        return buildLookAheadForGrammarProd(interp.NextInsideAtLeastOneWalker, manyOccurrence, ruleGrammar)
    }

    export function buildLookaheadForAtLeastOneSep(manyOccurrence:number, ruleGrammar:gast.Rule):() => boolean {
        return buildLookAheadForGrammarProd(interp.NextInsideAtLeastOneSepWalker, manyOccurrence, ruleGrammar)
    }

    export function buildLookaheadForOr(orOccurrence:number, ruleGrammar:gast.Rule, ignoreAmbiguities:boolean = false):() => number {

        let alternativesTokens = new interp.NextInsideOrWalker(ruleGrammar, orOccurrence).startWalking()

        if (!ignoreAmbiguities) {
            checkForOrAmbiguities(alternativesTokens, orOccurrence, ruleGrammar)
        }

        let hasLastAnEmptyAlt = utils.isEmpty(_.last(alternativesTokens))
        if (hasLastAnEmptyAlt) {
            let lastIdx = alternativesTokens.length - 1
            /**
             * This will return the Index of the alternative to take or the <lastidx> if only the empty alternative matched
             */
            return function chooseAlternativeWithEmptyAlt():number {
                let nextToken = this.NEXT_TOKEN()
                // checking only until length - 1 because there is nothing to check in an empty alternative, it is always valid
                for (let i = 0; i < lastIdx; i++) {
                    let currAltTokens = alternativesTokens[i]
                    // 'for' loop for performance reasons.
                    for (let j = 0; j < (<any>currAltTokens).length; j++) {
                        if (nextToken instanceof currAltTokens[j]) {
                            return i
                        }
                    }
                }
                // an OR(alternation) with an empty alternative will always match
                return lastIdx;
            }
        }
        else {
            /**
             * This will return the Index of the alternative to take or -1 if none of the alternatives match
             */
            return function chooseAlternative():number {
                let nextToken = this.NEXT_TOKEN()
                for (let i = 0; i < alternativesTokens.length; i++) {
                    let currAltTokens = alternativesTokens[i]
                    // 'for' loop for performance reasons.
                    for (let j = 0; j < (<any>currAltTokens).length; j++) {
                        if (nextToken instanceof currAltTokens[j]) {
                            return i
                        }
                    }
                }
                return -1;
            }
        }
    }

    export function checkForOrAmbiguities(alternativesTokens:AlternativesFirstTokens,
                                          orOccurrence:number,
                                          ruleGrammar:gast.Rule):void {
        let altsAmbiguityErrors = checkAlternativesAmbiguities(alternativesTokens)

        if (!utils.isEmpty(altsAmbiguityErrors)) {
            let errorMessages = _.map(altsAmbiguityErrors, (currAmbiguity) => {
                return `Ambiguous alternatives: <${currAmbiguity.alts.join(" ,")}> in <OR${orOccurrence}> inside <${ruleGrammar.name}> ` +
                    `Rule, <${tokenName(currAmbiguity.token)}> may appears as the first Terminal in all these alternatives.\n`
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

    export interface IAmbiguityDescriptor {
        alts:number[]
        token:Function
    }

    export function checkAlternativesAmbiguities(alternativesTokens:Function[][]):IAmbiguityDescriptor[] {

        let allTokensFlat = _.flatten(alternativesTokens)
        let uniqueTokensFlat = _.uniq(allTokensFlat)

        let tokensToAltsIndicesItAppearsIn = _.map(uniqueTokensFlat, (seekToken) => {
            let altsCurrTokenAppearsIn = _.pick(alternativesTokens, (altToLookIn) => {
                return <any> _.find(altToLookIn, (currToken) => {
                    return currToken === seekToken
                })
            })

            let altsIndicesTokenAppearsIn = _.map(_.keys(altsCurrTokenAppearsIn), (index) => {
                return parseInt(index, 10) + 1
            })

            return {token: seekToken, alts: altsIndicesTokenAppearsIn}
        })

        let tokensToAltsIndicesWithAmbiguity:any = _.filter(tokensToAltsIndicesItAppearsIn, (tokAndAltsItAppearsIn) => {
            return tokAndAltsItAppearsIn.alts.length > 1
        })

        return tokensToAltsIndicesWithAmbiguity
    }

    function buildLookAheadForGrammarProd(prodWalkerConstructor:any, ruleOccurrence:number,
                                          ruleGrammar:gast.Rule):() => boolean {
        let path:p.IRuleGrammarPath = {
            ruleStack:       [ruleGrammar.name],
            occurrenceStack: [1],
            occurrence:      ruleOccurrence
        }

        let walker:interp.AbstractNextPossibleTokensWalker = new prodWalkerConstructor(ruleGrammar, path)
        let possibleNextTokTypes = walker.startWalking()

        return getSimpleLookahead(possibleNextTokTypes)
    }

    function getSimpleLookahead(possibleNextTokTypes:Function[]):() => boolean {
        return function ():boolean {
            let nextToken = this.NEXT_TOKEN()
            for (let j = 0; j < possibleNextTokTypes.length; j++) {
                if (nextToken instanceof possibleNextTokTypes[j]) {
                    return true
                }
            }
            return false
        }
    }
}
