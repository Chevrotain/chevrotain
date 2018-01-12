import { gast } from "../parse/grammar/gast_public"
import { forEach, map } from "../utils/utils"
import IProduction = gast.IProduction
import { tokenName } from "../scan/tokens_public"

/**
 * Missing features
 * 1. Rule arguments
 * 2. Gates
 * 3. embedded actions
 */

const NL = "\n"

export function genUmdModule(options: {
    name: string
    rules: gast.Rule[]
}): string {
    return `
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['chevrotain'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('chevrotain'));
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root.b);
    }
}(typeof self !== 'undefined' ? self : this, function (chevrotain) {

    ${genClass(options)}
    
    return {
        ${options.name}: ${options.name} 
    }
}));
`
}

export function genWrapperFunction(options: {
    name: string
    rules: gast.Rule[]
}): string {
    return `    
${genClass(options)}
return new ${options.name}(tokenVocabulary, config)    
`
}

export function genClass(options: {
    name: string
    rules: gast.Rule[]
}): string {
    // TODO: how to pass the token vocabulary? Constructor? other?
    // TODO: should outputCst be enabled by default?
    let result = `
function ${options.name}(tokenVocabulary, config) {
    // invoke super constructor
    chevrotain.Parser.call(this, [], tokenVocabulary, config)

    const $ = this

    ${genAllRules(options.rules)}

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    chevrotain.Parser.performSelfAnalysis(this)
}

// inheritance as implemented in javascript in the previous decade... :(
${options.name}.prototype = Object.create(chevrotain.Parser.prototype)
${options.name}.prototype.constructor = ${options.name}    
    `

    return result
}

export function genAllRules(rules: gast.Rule[]): string {
    let rulesText = map(rules, genRule)

    return rulesText.join("\n")
}

export function genRule(prod: gast.Rule, n: number): string {
    if (n === undefined) {
        n = 1
    }
    let result = indent(n, `$.RULE("${prod.name}", function() {`) + NL
    result += genDefinition(prod.definition, n + 1)
    result += indent(n + 1, `})`) + NL
    return result
}

export function genFlat(prod: gast.Flat, n: number): string {
    return genDefinition(prod.definition, n)
}

export function genTerminal(prod: gast.Terminal, n: number): string {
    const name = tokenName(prod.terminalType)
    // TODO: potential performance optimization, avoid tokenMap Dictionary access
    return indent(
        n,
        `$.CONSUME${prod.occurrenceInParent}(this.tokensMap.${name})` + NL
    )
}

export function genNonTerminal(prod: gast.NonTerminal, n: number): string {
    return indent(
        n,
        `$.SUBRULE${prod.occurrenceInParent}($.${prod.nonTerminalName})` + NL
    )
}

export function genAlternation(prod: gast.Alternation, n: number): string {
    let result = indent(n, `$.OR${prod.occurrenceInParent}([`) + NL
    const alts = map(prod.definition, altDef => genSingleAlt(altDef, n + 1))
    result += alts.join(indent(n + 1, ",") + NL)
    result += indent(n, `])`) + NL
    return result
}

export function genSingleAlt(prod: gast.Flat, n: number): string {
    let result = indent(n, `{`) + NL

    if (prod.name) {
        result += indent(n + 1, `NAME: ${prod.name},`) + NL
    }
    result += indent(n + 1, "ALT: function() {") + NL
    result += genDefinition(prod.definition, n + 2)
    result += indent(n + 1, `}`) + NL
    result += indent(n, `}`) + NL

    return result
}

function genProd(prod: gast.IProduction, n: number): string {
    if (prod instanceof gast.NonTerminal) {
        return genNonTerminal(prod, n)
    } else if (prod instanceof gast.Flat) {
        return genFlat(prod, n)
    } else if (prod instanceof gast.Option) {
        return genDSLRule("OPTION", prod, n)
    } else if (prod instanceof gast.RepetitionMandatory) {
        return genDSLRule("AT_LEAST_ONE", prod, n)
    } else if (prod instanceof gast.RepetitionMandatoryWithSeparator) {
        return genDSLRule("AT_LEAST_ONE_SEP", prod, n)
    } else if (prod instanceof gast.RepetitionWithSeparator) {
        return genDSLRule("MANY_SEP", prod, n)
    } else if (prod instanceof gast.Repetition) {
        return genDSLRule("MANY", prod, n)
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

function genDSLRule(
    dslName,
    prod: {
        definition: IProduction[]
        occurrenceInParent: number
        name?: string
        separator?
    },
    n: number
): string {
    let result = indent(n, `$.${dslName + prod.occurrenceInParent}(`) + NL

    if (prod.name || prod.separator) {
        result += "{" + NL
        if (prod.name) {
            result += indent(n + 1, `NAME: ${prod.name}`) + "," + NL
        }
        if (prod.separator) {
            result +=
                indent(
                    n + 1,
                    `SEP: this.tokensMap.${tokenName(prod.separator)}`
                ) +
                "," +
                NL
        }
        result +=
            indent(n + 1, `DEF: ${genDefFunction(prod.definition, n + 2)}`) + NL
        result += indent(n, "}") + NL
    } else {
        result += genDefFunction(prod.definition, n + 1)
    }

    result += indent(n, `)`) + NL
    return result
}

function genDefFunction(definition: IProduction[], n: number): string {
    let def = "function() {" + NL
    def += genDefinition(definition, n + 1)
    def += indent(n, `}`) + NL
    return def
}

function genDefinition(def: IProduction[], n: number): string {
    let result = ""
    forEach(def, prod => {
        result += genProd(prod, n + 1)
    })
    return result
}

function indent(howMuch: number, text: string): string {
    const spaces = Array(howMuch * 5).join(" ")
    return spaces + text
}
