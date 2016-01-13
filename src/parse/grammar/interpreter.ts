import {RestWalker} from "./rest"
import {gast} from "./gast_public"
import {IGrammarPath, ITokenGrammarPath, IRuleGrammarPath} from "./path"
/* tslint:disable:no-use-before-declare */
import {cloneArr, isEmpty, map, first as _first} from "../../utils/utils"
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

export class NextInsideOptionWalker extends AbstractNextPossibleTokensWalker {

    private nextOptionOccurrence = 0

    constructor(topProd:gast.Rule, protected path:IRuleGrammarPath) {
        super(topProd, path)
        this.nextOptionOccurrence = this.path.occurrence
    }

    walkOption(optionProd:gast.Option, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (this.isAtEndOfPath && optionProd.occurrenceInParent === this.nextOptionOccurrence && !(this.found)) {
            let restProd = new gast.Flat(optionProd.definition)
            this.possibleTokTypes = first(restProd)
            this.found = true
        }
        else {
            super.walkOption(optionProd, currRest, prevRest)
        }
    }
}

export class NextInsideManyWalker extends AbstractNextPossibleTokensWalker {

    private nextOccurrence = 0

    constructor(topProd:gast.Rule, protected path:IRuleGrammarPath) {
        super(topProd, path)
        this.nextOccurrence = this.path.occurrence
    }

    walkMany(manyProd:gast.Repetition, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (this.isAtEndOfPath && manyProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
            let restProd = new gast.Flat(manyProd.definition)
            this.possibleTokTypes = first(restProd)
            this.found = true
        }
        else {
            super.walkMany(manyProd, currRest, prevRest)
        }
    }
}

export class NextInsideManySepWalker extends AbstractNextPossibleTokensWalker {

    private nextOccurrence = 0

    constructor(topProd:gast.Rule, protected path:IRuleGrammarPath) {
        super(topProd, path)
        this.nextOccurrence = this.path.occurrence
    }

    walkManySep(manySepProd:gast.RepetitionWithSeparator, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (this.isAtEndOfPath && manySepProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
            let restProd = new gast.Flat(manySepProd.definition)
            this.possibleTokTypes = first(restProd)
            this.found = true
        }
        else {
            super.walkManySep(manySepProd, currRest, prevRest)
        }
    }
}

export class NextInsideAtLeastOneWalker extends AbstractNextPossibleTokensWalker {

    private nextOccurrence = 0

    constructor(topProd:gast.Rule, protected path:IRuleGrammarPath) {
        super(topProd, path)
        this.nextOccurrence = this.path.occurrence
    }

    walkAtLeastOne(atLeastOneProd:gast.RepetitionMandatory, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (this.isAtEndOfPath && atLeastOneProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
            let restProd = new gast.Flat(atLeastOneProd.definition)
            this.possibleTokTypes = first(restProd)
            this.found = true
        }
        else {
            super.walkAtLeastOne(atLeastOneProd, currRest, prevRest)
        }
    }
}

export class NextInsideAtLeastOneSepWalker extends AbstractNextPossibleTokensWalker {

    private nextOccurrence = 0

    constructor(topProd:gast.Rule, protected path:IRuleGrammarPath) {
        super(topProd, path)
        this.nextOccurrence = this.path.occurrence
    }

    walkAtLeastOneSep(atLeastOneSepProd:gast.RepetitionMandatoryWithSeparator,
                      currRest:gast.IProduction[],
                      prevRest:gast.IProduction[]):void {
        if (this.isAtEndOfPath && atLeastOneSepProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
            let restProd = new gast.Flat(atLeastOneSepProd.definition)
            this.possibleTokTypes = first(restProd)
            this.found = true
        }
        else {
            super.walkAtLeastOneSep(atLeastOneSepProd, currRest, prevRest)
        }
    }
}

export type AlternativesFirstTokens = Function[][]

export class NextInsideOrWalker extends RestWalker {

    public result:AlternativesFirstTokens = []

    constructor(protected topRule:gast.Rule, protected occurrence:number) {
        super()
    }

    startWalking():AlternativesFirstTokens {
        this.walk(this.topRule)
        return this.result
    }

    walkOr(orProd:gast.Alternation, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (orProd.occurrenceInParent === this.occurrence) {
            this.result = map(orProd.definition, (alt) => {
                let altWrapper = new gast.Flat([alt])
                return first(altWrapper)
            })
        }
        else {
            super.walkOr(orProd, currRest, prevRest)
        }
    }
}

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
