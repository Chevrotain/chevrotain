import { gast } from "../parse/grammar/gast_public"
import { forEach, map } from "../utils/utils"
import IProduction = gast.IProduction
import { tokenName } from "../scan/tokens_public"

export function genRule(prod: gast.Rule, n: number): string {
    // TODO: how to define and support arguments
    let result = indent(n, `$.RULE("${prod.name}", function() {`)
    result += genDefinition(prod.definition, n + 1)
    result += indent(n, `})`)
    return result
}

export function genFlat(prod: gast.Flat, n: number): string {
    return genDefinition(prod.definition, n)
}

export function genTerminal(prod: gast.Terminal, n: number): string {
    const name = tokenName(prod.terminalType)
    // TODO: extract _toks
    // or verify no param named _toks?
    // or use a more special name?
    return indent(n, `$.CONSUME${prod.occurrenceInParent}(_toks.${name}})`)
}

export function genNonTerminal(prod: gast.NonTerminal, n: number): string {
    return indent(
        n,
        `$.SUBRULE${prod.occurrenceInParent}($.${prod.nonTerminalName}})`
    )
}

export function genAlternation(prod: gast.Alternation, n: number): string {
    let result = indent(n, `$.OR${prod.occurrenceInParent}([`)
    const alts = map(prod.definition, altDef => genSingleAlt(altDef, n + 1))
    result += alts.join(indent(n + 1, ","))
    result += indent(n, `])`)
    return result
}

export function genSingleAlt(prod: gast.Flat, n: number): string {
    let result = indent(n, `{ALT: function() {`)
    result += genDefinition(prod.definition, n + 1)
    result += indent(n, `}}`)
    return result
}

export function genOption(prod: gast.Option, n: number): string {
    return "todo"
}

export function genRepetition(prod: gast.Repetition, n: number): string {
    return "todo"
}

export function genRepetitionMandatory(
    prod: gast.RepetitionMandatory,
    n: number
): string {
    return "todo"
}

export function genRepetitionSep(
    prod: gast.RepetitionWithSeparator,
    n: number
): string {
    return "todo"
}

export function genRepetitionMandatorySep(
    prod: gast.RepetitionMandatoryWithSeparator,
    n: number
): string {
    return "todo"
}

function genProd(prod: gast.IProduction, n: number): string {
    if (prod instanceof gast.NonTerminal) {
        return genNonTerminal(prod, n)
    } else if (prod instanceof gast.Flat) {
        return genFlat(prod, n)
    } else if (prod instanceof gast.Option) {
        return genOption(prod, n)
    } else if (prod instanceof gast.RepetitionMandatory) {
        return genRepetitionMandatory(prod, n)
    } else if (prod instanceof gast.RepetitionMandatoryWithSeparator) {
        return genRepetitionMandatorySep(prod, n)
    } else if (prod instanceof gast.RepetitionWithSeparator) {
        return genRepetitionSep(prod, n)
    } else if (prod instanceof gast.Repetition) {
        return genRepetition(prod, n)
    } else if (prod instanceof gast.Alternation) {
        return genAlternation(prod, n)
    } else if (prod instanceof gast.Terminal) {
        return genTerminal(prod, n)
    } else if (prod instanceof gast.Rule) {
        return genRule(prod, n)
    } else {
        throw Error("non exhaustive match")
    }
}

function genDefinition(def: IProduction[], n: number): string {
    let result = ""
    forEach(def, prod => {
        result += genProd(prod, n + 1)
    })
    return result
}

function indent(howMuch: number, text: string): string {
    const spaces = Array(howMuch * 4).join(" ")
    return spaces + text + "\n"
}
