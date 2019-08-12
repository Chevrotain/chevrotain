import {
    AtLeastOneSepMethodOpts,
    ConsumeMethodOpts,
    DSLMethodOpts,
    DSLMethodOptsWithErr,
    GrammarAction,
    IAnyOrAlt,
    IParserConfig,
    IProduction,
    IToken,
    ManySepMethodOpts,
    OrMethodOpts,
    SubruleMethodOpts,
    TokenType
} from "../../../../api"
import { forEach, has, isArray, isFunction, peek } from "../../../utils/utils"
import { MixedInParser } from "./parser_traits"
import {
    Terminal,
    NonTerminal,
    Option,
    Rule,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    Repetition,
    RepetitionWithSeparator,
    Alternation,
    Flat
} from "../../grammar/gast/gast_public"
import { END_OF_FILE } from "../parser"

type ProdWithDef = IProduction & { definition?: IProduction[] }
const RECORDING_NULL_OBJECT = {
    description: "TODO: ADD Helper docs here..."
}
Object.freeze(RECORDING_NULL_OBJECT)

const HANDLE_SEPARATOR = true

/**
 * This trait handles the creation of the GAST structure for Chevrotain Grammars
 */
// TODO: do we need to override any other methods here? (BACKTrack? LA?)
export class GastRecorder {
    prodStack: ProdWithDef[]
    optionInternalOrg: MixedInParser["optionInternal"]
    atLeastOneInternalOrg: MixedInParser["atLeastOneInternal"]
    atLeastOneSepFirstInternalOrg: MixedInParser["atLeastOneSepFirstInternal"]
    manyInternalOrg: MixedInParser["manyInternal"]
    manySepFirstInternalOrg: MixedInParser["manySepFirstInternal"]
    orInternalOrg: MixedInParser["orInternal"]
    subruleInternalOrg: MixedInParser["subruleInternal"]
    consumeInternalOrg: MixedInParser["consumeInternal"]

    initGastRecorder(this: MixedInParser, config: IParserConfig): void {
        this.prodStack = []
        this.optionInternalOrg = this.optionInternal
        this.atLeastOneInternalOrg = this.atLeastOneInternal
        this.atLeastOneSepFirstInternalOrg = this.atLeastOneSepFirstInternal
        this.manyInternalOrg = this.manyInternal
        this.manySepFirstInternalOrg = this.manySepFirstInternal
        this.orInternalOrg = this.orInternal
        this.subruleInternalOrg = this.subruleInternal
        this.consumeInternalOrg = this.consumeInternal
    }

    enableRecording(this: MixedInParser): void {
        this.optionInternal = this.optionInternalRecord
        this.atLeastOneInternal = this.atLeastOneInternalRecord
        this.atLeastOneSepFirstInternal = this.atLeastOneSepFirstInternalRecord
        this.manyInternal = this.manyInternalRecord
        this.manySepFirstInternal = this.manySepFirstInternalRecord
        this.orInternal = this.orInternalRecord
        this.subruleInternal = this.subruleInternalRecord
        this.consumeInternal = this.consumeInternalRecord
    }

    disableRecording(this: MixedInParser) {
        this.optionInternal = this.optionInternalOrg
        this.atLeastOneInternal = this.atLeastOneInternalOrg
        this.atLeastOneSepFirstInternal = this.atLeastOneSepFirstInternalOrg
        this.manyInternal = this.manyInternalOrg
        this.manySepFirstInternal = this.manySepFirstInternalOrg
        this.orInternal = this.orInternalOrg
        this.subruleInternal = this.subruleInternalOrg
        this.consumeInternal = this.consumeInternalOrg
    }

    topLevelRuleRecord(name: string, def: Function): Rule {
        const newTopLevelRule = new Rule({ definition: [], name: name })
        newTopLevelRule.name = name
        this.prodStack.push(newTopLevelRule)
        def.call(this)
        this.prodStack.pop()
        return newTopLevelRule
    }

    // Implementation of parsing DSL
    optionInternalRecord<OUT>(
        this: MixedInParser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number
    ): OUT {
        return recordProd.call(this, Option, actionORMethodDef, occurrence)
    }

    atLeastOneInternalRecord<OUT>(
        this: MixedInParser,
        occurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        recordProd.call(
            this,
            RepetitionMandatory,
            actionORMethodDef,
            occurrence
        )
    }

    atLeastOneSepFirstInternalRecord<OUT>(
        this: MixedInParser,
        occurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        recordProd.call(
            this,
            RepetitionMandatoryWithSeparator,
            options,
            occurrence,
            HANDLE_SEPARATOR
        )
    }

    manyInternalRecord<OUT>(
        this: MixedInParser,
        occurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        recordProd.call(this, Repetition, actionORMethodDef, occurrence)
    }

    manySepFirstInternalRecord<OUT>(
        this: MixedInParser,
        occurrence: number,
        options: ManySepMethodOpts<OUT>
    ): void {
        recordProd.call(
            this,
            RepetitionWithSeparator,
            options,
            occurrence,
            HANDLE_SEPARATOR
        )
    }

    orInternalRecord<T>(
        this: MixedInParser,
        altsOrOpts: IAnyOrAlt[] | OrMethodOpts,
        occurrence: number
    ): T {
        return recordOrProd.call(this, altsOrOpts, occurrence)
    }

    subruleInternalRecord<T>(
        this: MixedInParser,
        ruleToCall: (idx: number) => T,
        occurrence: number,
        options?: SubruleMethodOpts
    ): T {
        const prevProd: any = peek(this.prodStack)
        const ruleName = ruleToCall["ruleName"]
        const newNoneTerminal = new NonTerminal({
            idx: occurrence,
            nonTerminalName: ruleName,
            // The resolving of the `referencedRule` property will be done once all the Rule's GASTs have been created
            referencedRule: undefined
        })
        prevProd.definition.push(newNoneTerminal)

        // TODO: do we want to return an empty CSTNOde if CST building is enabled?
        return <any>RECORDING_NULL_OBJECT
    }

    consumeInternalRecord(
        this: MixedInParser,
        tokType: TokenType,
        occurrence: number,
        options: ConsumeMethodOpts
    ): IToken {
        const prevProd: any = peek(this.prodStack)
        const newNoneTerminal = new Terminal({
            idx: occurrence,
            terminalType: tokType
        })
        prevProd.definition.push(newNoneTerminal)

        // TODO: Custom Recording Token
        return END_OF_FILE
    }
}

function recordProd(
    prodConstructor: any,
    mainProdArg: any,
    occurrence: number,
    handleSep: boolean = false
): any {
    const prevProd: any = peek(this.prodStack)
    const grammarAction = isFunction(mainProdArg)
        ? mainProdArg
        : mainProdArg.DEF

    const newProd = new prodConstructor({ definition: [], idx: occurrence })
    if (has(mainProdArg, "NAME")) {
        newProd.name = mainProdArg.NAME
    }
    if (handleSep) {
        newProd.separator = mainProdArg.SEP
    }

    this.prodStack.push(newProd)
    grammarAction.call(this)
    prevProd.definition.push(newProd)
    this.prodStack.pop()

    return RECORDING_NULL_OBJECT
}

function recordOrProd(mainProdArg: any, occurrence: number): any {
    const prevProd: any = peek(this.prodStack)
    const alts = isArray(mainProdArg) ? mainProdArg : mainProdArg.DEF

    const newOrProd = new Alternation({ definition: [], idx: occurrence })
    if (has(mainProdArg, "NAME")) {
        newOrProd.name = mainProdArg.NAME
    }
    prevProd.definition.push(newOrProd)

    forEach(alts, currAlt => {
        const currAltFlat = new Flat({ definition: [] })
        newOrProd.definition.push(currAltFlat)
        if (has(currAlt, "NAME")) {
            currAltFlat.name = currAlt.NAME
        }
        this.prodStack.push(currAltFlat)
        currAlt.ALT.call(this)
        this.prodStack.pop()
    })
    return RECORDING_NULL_OBJECT
}
