/* tslint:disable:no-use-before-declare */
import { RestWalker } from "./rest"
import { gast } from "./gast_public"
import {
    IGrammarPath,
    ISyntacticContentAssistPath,
    ITokenGrammarPath
} from "./path_public"
import {
    cloneArr,
    drop,
    dropRight,
    first as _first,
    forEach,
    isEmpty,
    last
} from "../../utils/utils"
import { IToken, tokenName } from "../../scan/tokens_public"
import { first } from "./first"
import { TokenType } from "../../scan/lexer_public"
import { TokenMatcher } from "../parser_public"
import IProduction = gast.IProduction

/* tslint:enable:no-use-before-declare */

export abstract class AbstractNextPossibleTokensWalker extends RestWalker {
    protected possibleTokTypes: TokenType[] = []
    protected ruleStack: string[]
    protected occurrenceStack: number[]

    protected nextProductionName = ""
    protected nextProductionOccurrence = 0
    protected found = false
    protected isAtEndOfPath = false

    constructor(protected topProd: gast.Rule, protected path: IGrammarPath) {
        super()
    }

    startWalking(): TokenType[] {
        this.found = false

        if (this.path.ruleStack[0] !== this.topProd.name) {
            throw Error("The path does not start with the walker's top Rule!")
        }

        // immutable for the win
        this.ruleStack = cloneArr(this.path.ruleStack).reverse() // intelij bug requires assertion
        this.occurrenceStack = cloneArr(this.path.occurrenceStack).reverse() // intelij bug requires assertion

        // already verified that the first production is valid, we now seek the 2nd production
        this.ruleStack.pop()
        this.occurrenceStack.pop()

        this.updateExpectedNext()
        this.walk(this.topProd)

        return this.possibleTokTypes
    }

    walk(
        prod: gast.AbstractProduction,
        prevRest: gast.IProduction[] = []
    ): void {
        // stop scanning once we found the path
        if (!this.found) {
            super.walk(prod, prevRest)
        }
    }

    walkProdRef(
        refProd: gast.NonTerminal,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        // found the next production, need to keep walking in it
        if (
            refProd.referencedRule.name === this.nextProductionName &&
            refProd.occurrenceInParent === this.nextProductionOccurrence
        ) {
            let fullRest = currRest.concat(prevRest)
            this.updateExpectedNext()
            this.walk(refProd.referencedRule, <any>fullRest)
        }
    }

    updateExpectedNext(): void {
        // need to consume the Terminal
        if (isEmpty(this.ruleStack)) {
            // must reset nextProductionXXX to avoid walking down another Top Level production while what we are
            // really seeking is the last Terminal...
            this.nextProductionName = ""
            this.nextProductionOccurrence = 0
            this.isAtEndOfPath = true
        } else {
            this.nextProductionName = this.ruleStack.pop()
            this.nextProductionOccurrence = this.occurrenceStack.pop()
        }
    }
}

export class NextAfterTokenWalker extends AbstractNextPossibleTokensWalker {
    private nextTerminalName = ""
    private nextTerminalOccurrence = 0

    constructor(topProd: gast.Rule, protected path: ITokenGrammarPath) {
        super(topProd, path)
        this.nextTerminalName = tokenName(this.path.lastTok)
        this.nextTerminalOccurrence = this.path.lastTokOccurrence
    }

    walkTerminal(
        terminal: gast.Terminal,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (
            this.isAtEndOfPath &&
            tokenName(terminal.terminalType) === this.nextTerminalName &&
            terminal.occurrenceInParent === this.nextTerminalOccurrence &&
            !this.found
        ) {
            let fullRest = currRest.concat(prevRest)
            let restProd = new gast.Flat({ definition: fullRest })
            this.possibleTokTypes = first(restProd)
            this.found = true
        }
    }
}

export type AlternativesFirstTokens = TokenType[][]

export interface IFirstAfterRepetition {
    token: TokenType
    occurrence: number
    isEndOfRule: boolean
}

/**
 * This walker only "walks" a single "TOP" level in the Grammar Ast, this means
 * it never "follows" production refs
 */
export class AbstractNextTerminalAfterProductionWalker extends RestWalker {
    protected result = {
        token: undefined,
        occurrence: undefined,
        isEndOfRule: undefined
    }

    constructor(protected topRule: gast.Rule, protected occurrence: number) {
        super()
    }

    startWalking(): IFirstAfterRepetition {
        this.walk(this.topRule)
        return this.result
    }
}

export class NextTerminalAfterManyWalker extends AbstractNextTerminalAfterProductionWalker {
    walkMany(
        manyProd: gast.Repetition,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (manyProd.occurrenceInParent === this.occurrence) {
            let firstAfterMany = _first(currRest.concat(prevRest))
            this.result.isEndOfRule = firstAfterMany === undefined
            if (firstAfterMany instanceof gast.Terminal) {
                this.result.token = firstAfterMany.terminalType
                this.result.occurrence = firstAfterMany.occurrenceInParent
            }
        } else {
            super.walkMany(manyProd, currRest, prevRest)
        }
    }
}

export class NextTerminalAfterManySepWalker extends AbstractNextTerminalAfterProductionWalker {
    walkManySep(
        manySepProd: gast.RepetitionWithSeparator,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (manySepProd.occurrenceInParent === this.occurrence) {
            let firstAfterManySep = _first(currRest.concat(prevRest))
            this.result.isEndOfRule = firstAfterManySep === undefined
            if (firstAfterManySep instanceof gast.Terminal) {
                this.result.token = firstAfterManySep.terminalType
                this.result.occurrence = firstAfterManySep.occurrenceInParent
            }
        } else {
            super.walkManySep(manySepProd, currRest, prevRest)
        }
    }
}

export class NextTerminalAfterAtLeastOneWalker extends AbstractNextTerminalAfterProductionWalker {
    walkAtLeastOne(
        atLeastOneProd: gast.RepetitionMandatory,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (atLeastOneProd.occurrenceInParent === this.occurrence) {
            let firstAfterAtLeastOne = _first(currRest.concat(prevRest))
            this.result.isEndOfRule = firstAfterAtLeastOne === undefined
            if (firstAfterAtLeastOne instanceof gast.Terminal) {
                this.result.token = firstAfterAtLeastOne.terminalType
                this.result.occurrence = firstAfterAtLeastOne.occurrenceInParent
            }
        } else {
            super.walkAtLeastOne(atLeastOneProd, currRest, prevRest)
        }
    }
}

// TODO: reduce code duplication in the AfterWalkers
export class NextTerminalAfterAtLeastOneSepWalker extends AbstractNextTerminalAfterProductionWalker {
    walkAtLeastOneSep(
        atleastOneSepProd: gast.RepetitionMandatoryWithSeparator,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (atleastOneSepProd.occurrenceInParent === this.occurrence) {
            let firstAfterfirstAfterAtLeastOneSep = _first(
                currRest.concat(prevRest)
            )
            this.result.isEndOfRule =
                firstAfterfirstAfterAtLeastOneSep === undefined
            if (firstAfterfirstAfterAtLeastOneSep instanceof gast.Terminal) {
                this.result.token =
                    firstAfterfirstAfterAtLeastOneSep.terminalType
                this.result.occurrence =
                    firstAfterfirstAfterAtLeastOneSep.occurrenceInParent
            }
        } else {
            super.walkAtLeastOneSep(atleastOneSepProd, currRest, prevRest)
        }
    }
}

export interface PartialPathAndSuffixes {
    partialPath: TokenType[]
    suffixDef: gast.IProduction[]
}

export function possiblePathsFrom(
    targetDef: gast.IProduction[],
    maxLength: number,
    currPath = []
): PartialPathAndSuffixes[] {
    // avoid side effects
    currPath = cloneArr(currPath)
    let result = []
    let i = 0

    function remainingPathWith(nextDef: gast.IProduction[]) {
        return nextDef.concat(drop(targetDef, i + 1))
    }

    function getAlternativesForProd(definition: gast.IProduction[]) {
        let alternatives = possiblePathsFrom(
            remainingPathWith(definition),
            maxLength,
            currPath
        )
        return result.concat(alternatives)
    }

    /**
     * Mandatory productions will halt the loop as the paths computed from their recursive calls will already contain the
     * following (rest) of the targetDef.
     *
     * For optional productions (Option/Repetition/...) the loop will continue to represent the paths that do not include the
     * the optional production.
     */
    while (currPath.length < maxLength && i < targetDef.length) {
        let prod = targetDef[i]

        if (prod instanceof gast.Flat) {
            return getAlternativesForProd(prod.definition)
        } else if (prod instanceof gast.NonTerminal) {
            return getAlternativesForProd(prod.definition)
        } else if (prod instanceof gast.Option) {
            result = getAlternativesForProd(prod.definition)
        } else if (prod instanceof gast.RepetitionMandatory) {
            return getAlternativesForProd(prod.definition)
        } else if (prod instanceof gast.RepetitionMandatoryWithSeparator) {
            const newDef = [
                new gast.Flat({ definition: prod.definition }),
                new gast.Repetition(
                    [new gast.Terminal(prod.separator)].concat(
                        <any>prod.definition
                    )
                )
            ]
            return getAlternativesForProd(newDef)
        } else if (prod instanceof gast.RepetitionWithSeparator) {
            const newDef = prod.definition.concat([
                new gast.Repetition(
                    [new gast.Terminal(prod.separator)].concat(
                        <any>prod.definition
                    )
                )
            ])
            result = getAlternativesForProd(newDef)
        } else if (prod instanceof gast.Repetition) {
            result = getAlternativesForProd(prod.definition)
        } else if (prod instanceof gast.Alternation) {
            forEach(prod.definition, currAlt => {
                result = getAlternativesForProd(currAlt.definition)
            })
            return result
        } else if (prod instanceof gast.Terminal) {
            currPath.push(prod.terminalType)
        } else {
            /* istanbul ignore next */
            throw Error("non exhaustive match")
        }

        i++
    }
    result.push({
        partialPath: currPath,
        suffixDef: drop(targetDef, i)
    })

    return result
}

interface IPathToExamine {
    idx: number
    def: IProduction[]
    ruleStack: string[]
    occurrenceStack: number[]
}

export function nextPossibleTokensAfter(
    initialDef: IProduction[],
    tokenVector: IToken[],
    tokMatcher: TokenMatcher,
    maxLookAhead: number
): ISyntacticContentAssistPath[] {
    const EXIT_NON_TERMINAL: any = "EXIT_NONE_TERMINAL"
    // to avoid creating a new Array each time.
    const EXIT_NON_TERMINAL_ARR = [EXIT_NON_TERMINAL]
    const EXIT_ALTERNATIVE: any = "EXIT_ALTERNATIVE"
    let foundCompletePath = false

    const tokenVectorLength = tokenVector.length
    let minimalAlternativesIndex = tokenVectorLength - maxLookAhead - 1

    let result: ISyntacticContentAssistPath[] = []

    let possiblePaths: IPathToExamine[] = []
    possiblePaths.push({
        idx: -1,
        def: initialDef,
        ruleStack: [],
        occurrenceStack: []
    })

    while (!isEmpty(possiblePaths)) {
        let currPath = possiblePaths.pop()

        // skip alternatives if no more results can be found (assuming deterministic grammar with fixed lookahead)
        if (currPath === EXIT_ALTERNATIVE) {
            if (
                foundCompletePath &&
                last(possiblePaths).idx <= minimalAlternativesIndex
            ) {
                // remove irrelevant alternative
                possiblePaths.pop()
            }
            continue
        }

        let currDef = currPath.def
        let currIdx = currPath.idx
        let currRuleStack = currPath.ruleStack
        let currOccurrenceStack = currPath.occurrenceStack

        // For Example: an empty path could exist in a valid grammar in the case of an EMPTY_ALT
        if (isEmpty(currDef)) {
            continue
        }

        let prod = currDef[0]
        if (prod === EXIT_NON_TERMINAL) {
            let nextPath = {
                idx: currIdx,
                def: drop(currDef),
                ruleStack: dropRight(currRuleStack),
                occurrenceStack: dropRight(currOccurrenceStack)
            }
            possiblePaths.push(nextPath)
        } else if (prod instanceof gast.Terminal) {
            if (currIdx < tokenVectorLength - 1) {
                let nextIdx = currIdx + 1
                let actualToken = tokenVector[nextIdx]
                if (tokMatcher(actualToken, prod.terminalType)) {
                    let nextPath = {
                        idx: nextIdx,
                        def: drop(currDef),
                        ruleStack: currRuleStack,
                        occurrenceStack: currOccurrenceStack
                    }
                    possiblePaths.push(nextPath)
                }
                // end of the line
            } else if (currIdx === tokenVectorLength - 1) {
                // IGNORE ABOVE ELSE
                result.push({
                    nextTokenType: prod.terminalType,
                    nextTokenOccurrence: prod.occurrenceInParent,
                    ruleStack: currRuleStack,
                    occurrenceStack: currOccurrenceStack
                })
                foundCompletePath = true
            } else {
                /* istanbul ignore next */
                throw Error("non exhaustive match")
            }
        } else if (prod instanceof gast.NonTerminal) {
            let newRuleStack = cloneArr(currRuleStack)
            newRuleStack.push(prod.nonTerminalName)

            let newOccurrenceStack = cloneArr(currOccurrenceStack)
            newOccurrenceStack.push(prod.occurrenceInParent)

            let nextPath = {
                idx: currIdx,
                def: prod.definition.concat(
                    EXIT_NON_TERMINAL_ARR,
                    drop(currDef)
                ),
                ruleStack: newRuleStack,
                occurrenceStack: newOccurrenceStack
            }
            possiblePaths.push(nextPath)
        } else if (prod instanceof gast.Option) {
            // the order of alternatives is meaningful, FILO (Last path will be traversed first).
            let nextPathWithout = {
                idx: currIdx,
                def: drop(currDef),
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            }
            possiblePaths.push(nextPathWithout)
            // required marker to avoid backtracking paths whose higher priority alternatives already matched
            possiblePaths.push(EXIT_ALTERNATIVE)

            let nextPathWith = {
                idx: currIdx,
                def: prod.definition.concat(drop(currDef)),
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            }
            possiblePaths.push(nextPathWith)
        } else if (prod instanceof gast.RepetitionMandatory) {
            // TODO:(THE NEW operators here take a while...) (convert once?)
            let secondIteration = new gast.Repetition(
                prod.definition,
                prod.occurrenceInParent
            )
            let nextDef = prod.definition.concat(
                [secondIteration],
                drop(currDef)
            )
            let nextPath = {
                idx: currIdx,
                def: nextDef,
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            }
            possiblePaths.push(nextPath)
        } else if (prod instanceof gast.RepetitionMandatoryWithSeparator) {
            // TODO:(THE NEW operators here take a while...) (convert once?)
            let separatorGast = new gast.Terminal(prod.separator)
            let secondIteration = new gast.Repetition(
                [<any>separatorGast].concat(prod.definition),
                prod.occurrenceInParent
            )
            let nextDef = prod.definition.concat(
                [secondIteration],
                drop(currDef)
            )
            let nextPath = {
                idx: currIdx,
                def: nextDef,
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            }
            possiblePaths.push(nextPath)
        } else if (prod instanceof gast.RepetitionWithSeparator) {
            // the order of alternatives is meaningful, FILO (Last path will be traversed first).
            let nextPathWithout = {
                idx: currIdx,
                def: drop(currDef),
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            }
            possiblePaths.push(nextPathWithout)
            // required marker to avoid backtracking paths whose higher priority alternatives already matched
            possiblePaths.push(EXIT_ALTERNATIVE)

            let separatorGast = new gast.Terminal(prod.separator)
            let nthRepetition = new gast.Repetition(
                [<any>separatorGast].concat(prod.definition),
                prod.occurrenceInParent
            )
            let nextDef = prod.definition.concat([nthRepetition], drop(currDef))
            let nextPathWith = {
                idx: currIdx,
                def: nextDef,
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            }
            possiblePaths.push(nextPathWith)
        } else if (prod instanceof gast.Repetition) {
            // the order of alternatives is meaningful, FILO (Last path will be traversed first).
            let nextPathWithout = {
                idx: currIdx,
                def: drop(currDef),
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            }
            possiblePaths.push(nextPathWithout)
            // required marker to avoid backtracking paths whose higher priority alternatives already matched
            possiblePaths.push(EXIT_ALTERNATIVE)

            // TODO: an empty repetition will cause infinite loops here, will the parser detect this in selfAnalysis?
            let nthRepetition = new gast.Repetition(
                prod.definition,
                prod.occurrenceInParent
            )
            let nextDef = prod.definition.concat([nthRepetition], drop(currDef))
            let nextPathWith = {
                idx: currIdx,
                def: nextDef,
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            }
            possiblePaths.push(nextPathWith)
        } else if (prod instanceof gast.Alternation) {
            // the order of alternatives is meaningful, FILO (Last path will be traversed first).
            for (let i = prod.definition.length - 1; i >= 0; i--) {
                let currAlt: any = prod.definition[i]
                let currAltPath = {
                    idx: currIdx,
                    def: currAlt.definition.concat(drop(currDef)),
                    ruleStack: currRuleStack,
                    occurrenceStack: currOccurrenceStack
                }
                possiblePaths.push(currAltPath)
                possiblePaths.push(EXIT_ALTERNATIVE)
            }
        } else if (prod instanceof gast.Flat) {
            possiblePaths.push({
                idx: currIdx,
                def: prod.definition.concat(drop(currDef)),
                ruleStack: currRuleStack,
                occurrenceStack: currOccurrenceStack
            })
        } else if (prod instanceof gast.Rule) {
            // last because we should only encounter at most a single one of these per invocation.
            possiblePaths.push(
                expandTopLevelRule(
                    prod,
                    currIdx,
                    currRuleStack,
                    currOccurrenceStack
                )
            )
        } else {
            /* istanbul ignore next */
            throw Error("non exhaustive match")
        }
    }
    return result
}

function expandTopLevelRule(
    topRule: gast.Rule,
    currIdx: number,
    currRuleStack: string[],
    currOccurrenceStack: number[]
): IPathToExamine {
    let newRuleStack = cloneArr(currRuleStack)
    newRuleStack.push(topRule.name)

    let newCurrOccurrenceStack = cloneArr(currOccurrenceStack)
    // top rule is always assumed to have been called with occurrence index 1
    newCurrOccurrenceStack.push(1)

    return {
        idx: currIdx,
        def: topRule.definition,
        ruleStack: newRuleStack,
        occurrenceStack: newCurrOccurrenceStack
    }
}
