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
// TODO: do we need to override any other methods here?
export class GastRecorder {
    prodStack: ProdWithDef[]

    initGastRecorder(config: IParserConfig) {
        this.prodStack = []
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
        return recordProd(Option, actionORMethodDef, occurrence)
    }

    atLeastOneInternalRecord<OUT>(
        this: MixedInParser,
        occurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        recordProd(RepetitionMandatory, actionORMethodDef, occurrence)
    }

    atLeastOneSepFirstInternalRecord<OUT>(
        this: MixedInParser,
        occurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        recordProd(
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
        recordProd(Repetition, actionORMethodDef, occurrence)
    }

    manySepFirstInternalRecord<OUT>(
        this: MixedInParser,
        occurrence: number,
        options: ManySepMethodOpts<OUT>
    ): void {
        recordProd(
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
        return recordOrProd(Alternation, occurrence)
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
    const name = isFunction(mainProdArg)
        ? undefined
        : mainProdArg.NAME || undefined

    const newProd = new prodConstructor({ definition: [], idx: occurrence })
    newProd.name = name
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
    const name = isFunction(mainProdArg)
        ? undefined
        : mainProdArg.NAME || undefined

    const newOrProd = new Alternation({ definition: [], idx: occurrence })
    newOrProd.name = name
    prevProd.definition.push(newOrProd)

    forEach(alts, currAlt => {
        const currAltFlat = new Flat({ definition: [] })
        newOrProd.definition.push(currAltFlat)
        if (has(currAlt, "NAME")) {
            currAltFlat.name = currAlt.NAME
        }
        this.prodStack.push(newOrProd)
        currAlt.call(this)
        this.prodStack.pop()
    })
    return RECORDING_NULL_OBJECT
}
