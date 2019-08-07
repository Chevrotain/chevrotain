import {
    ConsumeMethodOpts,
    DSLMethodOpts,
    GrammarAction,
    IAnyOrAlt,
    ManySepMethodOpts,
    OrMethodOpts,
    SubruleMethodOpts,
    TokenType
} from "../../../../api"
import {
    Repetition,
    Terminal,
    NonTerminal,
    Alternation,
    Flat,
    Option
} from "../../grammar/gast/gast_public"
import { RecognizerEngine } from "../traits/recognizer_engine"
import { SmartMixedInParser } from "./traits"
import {
    PROP_ANALYSER_CONTEXT,
    IRuleDefinitionInfo,
    ParserRuleAnalyserContext
} from "./rule-analyser"
import { MixedInParser } from "../traits/parser_traits"

function TODO() {
    throw new Error("TODO: not implemented yet")
}

/**
 * This trait is responsible for the runtime parsing engine
 * Used by the official API (recognizer_api.ts)
 */
export class SmartRecognizerEngine extends RecognizerEngine {
    // Implementation of parsing DSL
    optionInternal<OUT>(
        this: SmartMixedInParser,
        ...args: Parameters<RecognizerEngine["optionInternal"]>
    ): any {
        const ctx = this[PROP_ANALYSER_CONTEXT]

        if (!ctx) {
            return (super.optionInternal as any)(...args)
        }

        const [actionORMethodDef, occurrence] = args

        if (typeof actionORMethodDef !== "function") {
            return TODO()
        }

        const optionImpl = actionORMethodDef

        ctx.addToRecorded(
            new Option({
                definition: ctx.recordDefinitions(optionImpl),
                idx: occurrence
            })
        )
    }

    manyInternal<OUT>(
        this: SmartMixedInParser,
        ...args: Parameters<RecognizerEngine["manyInternal"]>
    ): void {
        const ctx = this[PROP_ANALYSER_CONTEXT]

        if (!ctx) {
            return (super.manyInternal as any)(...args)
        }

        const [prodOccurrence, actionORMethodDef] = args
        const manyImpl =
            typeof actionORMethodDef === "function"
                ? actionORMethodDef
                : actionORMethodDef.DEF // TODO: GATE, NAME

        ctx.addToRecorded(
            new Repetition({
                definition: ctx.recordDefinitions(manyImpl),
                idx: prodOccurrence
            })
        )
    }

    manySepFirstInternal<OUT>(
        this: SmartMixedInParser,
        ...args: Parameters<RecognizerEngine["manySepFirstInternal"]>
    ): void {
        const ctx = this[PROP_ANALYSER_CONTEXT]
        if (!ctx) {
            return (super.manySepFirstInternal as any)(...args)
        }

        const [prodOccurrence, options] = args
        TODO()
    }

    orInternal<T>(
        this: SmartMixedInParser,
        ...args: Parameters<RecognizerEngine["orInternal"]>
    ): any {
        const ctx = this[PROP_ANALYSER_CONTEXT]
        if (!ctx) {
            return (super.orInternal as any)(...args)
        }

        const [altsOrOpts, occurrence] = args

        if (!Array.isArray(altsOrOpts)) {
            return TODO()
        }
        ctx.addToRecorded(
            new Alternation({
                definition: altsOrOpts.map(
                    alt =>
                        new Flat({
                            definition: ctx.recordDefinitions(() => {
                                alt.ALT()
                            })
                        })
                ),
                idx: occurrence
            })
        )
    }

    subruleInternal<T>(
        this: SmartMixedInParser,
        ...args: Parameters<RecognizerEngine["subruleInternal"]>
    ) {
        const ctx = this[PROP_ANALYSER_CONTEXT]
        if (!ctx) {
            return (super.subruleInternal as any)(...args)
        }

        const [ruleToCall, idx, /* TODO */ options] = args
        ctx.addToRecorded(
            new NonTerminal({
                nonTerminalName: ((ruleToCall as any) as IRuleDefinitionInfo<T>)
                    .ruleName,
                idx
            })
        )
    }

    consumeInternal(
        this: SmartMixedInParser,
        ...args: Parameters<RecognizerEngine["consumeInternal"]>
    ): any {
        const ctx = this[PROP_ANALYSER_CONTEXT]
        if (!ctx) {
            return (super.consumeInternal as any)(...args)
        }

        const [tokType, idx, /* TODO */ options] = args
        ctx.addToRecorded(new Terminal({ terminalType: tokType, idx }))
    }
}
