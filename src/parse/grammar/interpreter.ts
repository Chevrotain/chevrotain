import {RestWalker} from "./rest"
import {gast} from "./gast_public"
import {
    IGrammarPath,
    ITokenGrammarPath
} from "./path"
/* tslint:disable:no-use-before-declare */
import {
    cloneArr,
    isEmpty,
    first as _first, forEach, drop
} from "../../utils/utils"
/* tslint:enable:no-use-before-declare */
import {tokenName} from "../../scan/tokens_public"
import {first} from "./first"

export abstract class AbstractNextPossibleTokensWalker extends RestWalker {

    protected possibleTokTypes:Function[] = []
    protected ruleStack:string[]
    protected occurrenceStack:number[]

    protected nextProductionName = ""
    protected nextProductionOccurrence = 0
    protected found = false
    protected isAtEndOfPath = false

    constructor(protected topProd:gast.Rule, protected path:IGrammarPath) {super() }

    startWalking():Function[] {

        this.found = false

        if (this.path.ruleStack[0] !== this.topProd.name) {
            throw Error("The path does not start with the walker's top Rule!")
        }

        // immutable for the win
        this.ruleStack = (cloneArr(this.path.ruleStack)).reverse() // intelij bug requires assertion
        this.occurrenceStack = (cloneArr(this.path.occurrenceStack)).reverse() // intelij bug requires assertion

        // already verified that the first production is valid, we now seek the 2nd production
        this.ruleStack.pop()
        this.occurrenceStack.pop()

        this.updateExpectedNext()
        this.walk(this.topProd)

        return this.possibleTokTypes
    }


    walk(prod:gast.AbstractProduction, prevRest:gast.IProduction[] = []):void {
        // stop scanning once we found the path
        if (!this.found) {
            super.walk(prod, prevRest)
        }
    }

    walkProdRef(refProd:gast.NonTerminal, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        // found the next production, need to keep walking in it
        if (refProd.referencedRule.name === this.nextProductionName &&
            refProd.occurrenceInParent === this.nextProductionOccurrence
        ) {
            let fullRest = currRest.concat(prevRest)
            this.updateExpectedNext()
            this.walk(refProd.referencedRule, <any>fullRest)
        }
    }

    updateExpectedNext():void {
        // need to consume the Terminal
        if (isEmpty(this.ruleStack)) {
            // must reset nextProductionXXX to avoid walking down another Top Level production while what we are
            // really seeking is the last Terminal...
            this.nextProductionName = ""
            this.nextProductionOccurrence = 0
            this.isAtEndOfPath = true
        }
        else {
            this.nextProductionName = this.ruleStack.pop()
            this.nextProductionOccurrence = this.occurrenceStack.pop()
        }

    }
}

export class NextAfterTokenWalker extends AbstractNextPossibleTokensWalker {
    private nextTerminalName = ""
    private nextTerminalOccurrence = 0

    constructor(topProd:gast.Rule, protected path:ITokenGrammarPath) {
        super(topProd, path)
        this.nextTerminalName = tokenName(this.path.lastTok)
        this.nextTerminalOccurrence = this.path.lastTokOccurrence
    }

    walkTerminal(terminal:gast.Terminal, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (this.isAtEndOfPath && tokenName(terminal.terminalType) === this.nextTerminalName &&
            terminal.occurrenceInParent === this.nextTerminalOccurrence && !(this.found)
        ) {
            let fullRest = currRest.concat(prevRest)
            let restProd = new gast.Flat(<any>fullRest)
            this.possibleTokTypes = first(restProd)
            this.found = true
        }
    }
}

export type AlternativesFirstTokens = Function[][]

export interface IFirstAfterRepetition {
    token:Function
    occurrence:number
    isEndOfRule:boolean
}

/**
 * This walker only "walks" a single "TOP" level in the Grammar Ast, this means
 * it never "follows" production refs
 */
export class AbstractNextTerminalAfterProductionWalker extends RestWalker {

    protected result = {token: undefined, occurrence: undefined, isEndOfRule: undefined}

    constructor(protected topRule:gast.Rule, protected occurrence:number) {
        super()
    }

    startWalking():IFirstAfterRepetition {
        this.walk(this.topRule)
        return this.result
    }
}

export class NextTerminalAfterManyWalker extends AbstractNextTerminalAfterProductionWalker {

    walkMany(manyProd:gast.Repetition, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (manyProd.occurrenceInParent === this.occurrence) {

            let firstAfterMany = _first(currRest.concat(prevRest))
            this.result.isEndOfRule = firstAfterMany === undefined
            if (firstAfterMany instanceof gast.Terminal) {
                this.result.token = firstAfterMany.terminalType
                this.result.occurrence = firstAfterMany.occurrenceInParent
            }
        }
        else {
            super.walkMany(manyProd, currRest, prevRest)
        }
    }
}

export class NextTerminalAfterManySepWalker extends AbstractNextTerminalAfterProductionWalker {

    walkManySep(manySepProd:gast.RepetitionWithSeparator, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (manySepProd.occurrenceInParent === this.occurrence) {

            let firstAfterManySep = _first(currRest.concat(prevRest))
            this.result.isEndOfRule = firstAfterManySep === undefined
            if (firstAfterManySep instanceof gast.Terminal) {
                this.result.token = firstAfterManySep.terminalType
                this.result.occurrence = firstAfterManySep.occurrenceInParent
            }
        }
        else {
            super.walkManySep(manySepProd, currRest, prevRest)
        }
    }
}

export class NextTerminalAfterAtLeastOneWalker extends AbstractNextTerminalAfterProductionWalker {

    walkAtLeastOne(atLeastOneProd:gast.RepetitionMandatory, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (atLeastOneProd.occurrenceInParent === this.occurrence) {

            let firstAfterAtLeastOne = _first(currRest.concat(prevRest))
            this.result.isEndOfRule = firstAfterAtLeastOne === undefined
            if (firstAfterAtLeastOne instanceof gast.Terminal) {
                this.result.token = firstAfterAtLeastOne.terminalType
                this.result.occurrence = firstAfterAtLeastOne.occurrenceInParent
            }
        }
        else {
            super.walkAtLeastOne(atLeastOneProd, currRest, prevRest)
        }
    }
}

// TODO: reduce code duplication in the AfterWalkers
export class NextTerminalAfterAtLeastOneSepWalker extends AbstractNextTerminalAfterProductionWalker {

    walkAtLeastOneSep(atleastOneSepProd:gast.RepetitionMandatoryWithSeparator,
                      currRest:gast.IProduction[],
                      prevRest:gast.IProduction[]):void {
        if (atleastOneSepProd.occurrenceInParent === this.occurrence) {

            let firstAfterfirstAfterAtLeastOneSep = _first(currRest.concat(prevRest))
            this.result.isEndOfRule = firstAfterfirstAfterAtLeastOneSep === undefined
            if (firstAfterfirstAfterAtLeastOneSep instanceof gast.Terminal) {
                this.result.token = firstAfterfirstAfterAtLeastOneSep.terminalType
                this.result.occurrence = firstAfterfirstAfterAtLeastOneSep.occurrenceInParent
            }
        }
        else {
            super.walkAtLeastOneSep(atleastOneSepProd, currRest, prevRest)
        }
    }
}

export function possiblePathsFrom(targetDef:gast.IProduction[], maxLength:number, currPath = []):Function[][] {
    // avoid side effects
    currPath = cloneArr(currPath)
    let result = []
    let i = 0

    function remainingPathWith(nextDef:gast.IProduction[]) {
        return nextDef.concat(drop(targetDef, i + 1))
    }

    function getAlternativesForProd(prod:gast.AbstractProduction) {
        let alternatives = possiblePathsFrom(remainingPathWith(prod.definition), maxLength, currPath)
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
            return getAlternativesForProd(prod)
        }
        else if (prod instanceof gast.NonTerminal) {
            return getAlternativesForProd(prod)
        }
        else if (prod instanceof gast.Option) {
            result = getAlternativesForProd(prod)
        }
        else if (prod instanceof gast.RepetitionMandatory) {
            return getAlternativesForProd(prod)
        }
        else if (prod instanceof gast.RepetitionMandatoryWithSeparator) {
            return getAlternativesForProd(prod)
        }
        else if (prod instanceof gast.RepetitionWithSeparator) {
            result = getAlternativesForProd(prod)
        }
        else if (prod instanceof gast.Repetition) {
            result = getAlternativesForProd(prod)
        }
        else if (prod instanceof gast.Alternation) {
            forEach(prod.definition, (currAlt) => {
                result = getAlternativesForProd(currAlt)
            })
            return result
        }
        else if (prod instanceof gast.Terminal) {
            currPath.push(prod.terminalType)
        }
        else {
            throw Error("non exhaustive match")
        }

        i++
    }
    result.push(currPath)

    return result
}
