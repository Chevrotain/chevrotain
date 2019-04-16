import { IRange, Range } from "../text/range"
import {
    every,
    filter,
    forEach,
    map,
    isEmpty,
    isUndefined,
    partial,
    sortBy,
    uniq
} from "../utils/utils"
import {
    AbstractProduction,
    Alternation,
    Flat,
    NonTerminal,
    Option,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    RepetitionWithSeparator,
    Rule,
    Terminal,
    ISerializedGastAny
} from "./grammar/gast/gast_public"
import {
    IOptionallyNamedProduction,
    IProduction,
    IProductionWithOccurrence,
    TokenType,
    ISerializedGast
} from "../../api"

export enum ProdType {
    OPTION,
    OR,
    MANY,
    MANY_SEP,
    AT_LEAST_ONE,
    AT_LEAST_ONE_SEP,
    REF,
    TERMINAL,
    FLAT
}

export interface IProdRange {
    range: IRange
    text: string
    type: ProdType
}

const namePropRegExp = /(?:\s*{\s*NAME\s*:\s*["'`]([\w$]*)["'`])?/
const namePropRegExpNoCurlyFirstOfTwo = new RegExp(
    namePropRegExp.source
        // remove opening curly brackets
        .replace("{", "")
        // add the comma between the NAME prop and the following prop
        .replace(")?", "\\s*,)?")
)

const terminalRegEx = /\.\s*CONSUME(\d+)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/
const terminalRegGlobal = new RegExp(terminalRegEx.source, "g")

const refRegEx = /\.\s*SUBRULE(\d+)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/
const refRegExGlobal = new RegExp(refRegEx.source, "g")

const optionPrefixRegEx = /\.\s*OPTION(\d+)?\s*\(/
const optionRegEx = new RegExp(optionPrefixRegEx.source + namePropRegExp.source)
const optionRegExGlobal = new RegExp(optionPrefixRegEx.source, "g")

const manyPrefixRegEx = /\.\s*MANY(\d+)?\s*\(/
const manyRegEx = new RegExp(manyPrefixRegEx.source + namePropRegExp.source)
const manyRegExGlobal = new RegExp(manyPrefixRegEx.source, "g")

const sepPropRegEx = /\s*SEP\s*:\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/
const manySepPrefixRegEx = /\.\s*MANY_SEP(\d+)?\s*\(\s*{/
const manyWithSeparatorRegEx = new RegExp(
    manySepPrefixRegEx.source +
        namePropRegExpNoCurlyFirstOfTwo.source +
        sepPropRegEx.source
)
const manyWithSeparatorRegExGlobal = new RegExp(
    manyWithSeparatorRegEx.source,
    "g"
)

const atLeastOneSepPrefixRegEx = /\.\s*AT_LEAST_ONE_SEP(\d+)?\s*\(\s*{/
const atLeastOneWithSeparatorRegEx = new RegExp(
    atLeastOneSepPrefixRegEx.source +
        namePropRegExpNoCurlyFirstOfTwo.source +
        sepPropRegEx.source
)
const atLeastOneWithSeparatorRegExGlobal = new RegExp(
    atLeastOneWithSeparatorRegEx.source,
    "g"
)

const atLeastOnePrefixRegEx = /\.\s*AT_LEAST_ONE(\d+)?\s*\(/
const atLeastOneRegEx = new RegExp(
    atLeastOnePrefixRegEx.source + namePropRegExp.source
)
const atLeastOneRegExGlobal = new RegExp(atLeastOnePrefixRegEx.source, "g")

const orPrefixRegEx = /\.\s*OR(\d+)?\s*\(/
const orRegEx = new RegExp(orPrefixRegEx.source + namePropRegExp.source)
const orRegExGlobal = new RegExp(orPrefixRegEx.source, "g")

const orPartSuffixRegEx = /\s*(ALT)\s*:/
const orPartRegEx = new RegExp(
    namePropRegExpNoCurlyFirstOfTwo.source + orPartSuffixRegEx.source
)
const orPartRegExGlobal = new RegExp(orPartRegEx.source, "g")

export interface ITerminalNameToConstructor {
    [fqn: string]: TokenType
}

export let terminalNameToConstructor: ITerminalNameToConstructor = {}

export function buildTopProduction(
    impelText: string,
    name: string,
    terminals: ITerminalNameToConstructor
): Rule {
    // pseudo state. so little state does not yet mandate the complexity of wrapping in a class...
    // TODO: this is confusing, might be time to create a class..
    terminalNameToConstructor = terminals
    // the top most range must strictly contain all the other ranges
    // which is why we prefix the text with " " (curr Range impel is only for positive ranges)
    let spacedImpelText = " " + impelText
    // TODO: why do we add whitespace twice?
    let txtWithoutComments = removeComments(" " + spacedImpelText)
    let textWithoutCommentsAndStrings = removeStringLiterals(txtWithoutComments)
    let prodRanges = createRanges(textWithoutCommentsAndStrings)
    let topRange = new Range(0, impelText.length + 2)
    let topRule = buildTopLevel(name, topRange, prodRanges, impelText)
    return topRule
}

function buildTopLevel(
    name: string,
    topRange: IRange,
    allRanges: IProdRange[],
    orgText: string
): Rule {
    let topLevelProd = new Rule({
        name: name,
        definition: [],
        orgText: orgText
    })
    return buildAbstractProd(topLevelProd, topRange, allRanges, name)
}

export function buildProdGast(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): IProduction {
    switch (prodRange.type) {
        case ProdType.AT_LEAST_ONE:
            return buildAtLeastOneProd(prodRange, allRanges, ruleName)
        case ProdType.AT_LEAST_ONE_SEP:
            return buildAtLeastOneSepProd(prodRange, allRanges, ruleName)
        case ProdType.MANY_SEP:
            return buildManySepProd(prodRange, allRanges, ruleName)
        case ProdType.MANY:
            return buildManyProd(prodRange, allRanges, ruleName)
        case ProdType.OPTION:
            return buildOptionProd(prodRange, allRanges, ruleName)
        case ProdType.OR:
            return buildOrProd(prodRange, allRanges, ruleName)
        case ProdType.FLAT:
            return buildFlatProd(prodRange, allRanges, ruleName)
        case ProdType.REF:
            return buildRefProd(prodRange)
        case ProdType.TERMINAL:
            return buildTerminalProd(prodRange, ruleName)
        /* istanbul ignore next */
        default:
            throw Error("non exhaustive match")
    }
}

function buildRefProd(prodRange: IProdRange): NonTerminal {
    let reResult = refRegEx.exec(prodRange.text)
    let isImplicitOccurrenceIdx = reResult[1] === undefined
    let refOccurrence = isImplicitOccurrenceIdx ? 0 : parseInt(reResult[1], 10)
    let refProdName = reResult[2]
    let newRef = new NonTerminal({
        nonTerminalName: refProdName,
        idx: refOccurrence
    })
    return newRef
}

function buildTerminalProd(prodRange: IProdRange, ruleName: string): Terminal {
    let reResult = terminalRegEx.exec(prodRange.text)
    let isImplicitOccurrenceIdx = reResult[1] === undefined
    let terminalOccurrence = isImplicitOccurrenceIdx
        ? 0
        : parseInt(reResult[1], 10)
    let terminalName = reResult[2]
    let terminalType = terminalNameToConstructor[terminalName]
    if (!terminalType) {
        throw Error(
            `Terminal Token name: <${terminalName}> not found in rule: <${ruleName}>  \n` +
                "\tSee: https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#TERMINAL_NAME_NOT_FOUND\n" +
                "\tFor Further details."
        )
    }

    let newTerminal = new Terminal({
        terminalType: terminalType,
        idx: terminalOccurrence
    })
    return newTerminal
}

// http://stackoverflow.com/questions/17125764/can-you-specify-multiple-type-constraints-for-typescript-generics
interface AbsProdWithOccurrence
    extends IProductionWithOccurrence,
        AbstractProduction {}

function buildProdWithOccurrence<T extends AbsProdWithOccurrence>(
    regEx: RegExp,
    prodInstance: T,
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): T {
    let reResult = regEx.exec(prodRange.text)
    let isImplicitOccurrenceIdx = reResult[1] === undefined
    prodInstance.idx = isImplicitOccurrenceIdx ? 0 : parseInt(reResult[1], 10)

    let nestedName = reResult[2]
    if (!isUndefined(nestedName)) {
        ;(prodInstance as IOptionallyNamedProduction).name = nestedName
    }
    return buildAbstractProd(prodInstance, prodRange.range, allRanges, ruleName)
}

function buildAtLeastOneProd(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): RepetitionMandatory {
    return buildProdWithOccurrence(
        atLeastOneRegEx,
        new RepetitionMandatory({ definition: [] }),
        prodRange,
        allRanges,
        ruleName
    )
}

function buildAtLeastOneSepProd(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): RepetitionWithSeparator {
    return buildRepetitionWithSep(
        prodRange,
        allRanges,
        RepetitionMandatoryWithSeparator,
        atLeastOneWithSeparatorRegEx,
        ruleName
    )
}

function buildManyProd(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): Repetition {
    return buildProdWithOccurrence(
        manyRegEx,
        new Repetition({ definition: [] }),
        prodRange,
        allRanges,
        ruleName
    )
}

function buildManySepProd(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): RepetitionWithSeparator {
    return buildRepetitionWithSep(
        prodRange,
        allRanges,
        RepetitionWithSeparator,
        manyWithSeparatorRegEx,
        ruleName
    )
}

function buildRepetitionWithSep(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    repConstructor: Function,
    regExp: RegExp,
    ruleName: string
): RepetitionWithSeparator {
    let reResult = regExp.exec(prodRange.text)
    let isImplicitOccurrenceIdx = reResult[1] === undefined
    let occurrenceIdx = isImplicitOccurrenceIdx ? 0 : parseInt(reResult[1], 10)

    let sepName = reResult[3]
    let separatorType = terminalNameToConstructor[sepName]
    if (!separatorType) {
        throw Error("Separator Terminal Token name: " + sepName + " not found")
    }

    let repetitionInstance: any = new (<any>repConstructor)({
        definition: [],
        separator: separatorType,
        idx: occurrenceIdx
    })
    let nestedName = reResult[2]
    if (!isUndefined(nestedName)) {
        ;(repetitionInstance as IOptionallyNamedProduction).name = nestedName
    }
    return <any>(
        buildAbstractProd(
            repetitionInstance,
            prodRange.range,
            allRanges,
            ruleName
        )
    )
}

function buildOptionProd(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): Option {
    return buildProdWithOccurrence(
        optionRegEx,
        new Option({ definition: [] }),
        prodRange,
        allRanges,
        ruleName
    )
}

function buildOrProd(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): Alternation {
    return buildProdWithOccurrence(
        orRegEx,
        new Alternation({ definition: [] }),
        prodRange,
        allRanges,
        ruleName
    )
}

function buildFlatProd(
    prodRange: IProdRange,
    allRanges: IProdRange[],
    ruleName: string
): Flat {
    let prodInstance = new Flat({ definition: [] })
    let reResult = orPartRegEx.exec(prodRange.text)

    let nestedName = reResult[1]
    if (!isUndefined(nestedName)) {
        ;(prodInstance as IOptionallyNamedProduction).name = nestedName
    }
    return buildAbstractProd(prodInstance, prodRange.range, allRanges, ruleName)
}

function buildAbstractProd<T extends AbstractProduction>(
    prod: T,
    topLevelRange: IRange,
    allRanges: IProdRange[],
    ruleName: string
): T {
    let secondLevelProds = getDirectlyContainedRanges(topLevelRange, allRanges)
    let secondLevelInOrder = sortBy(secondLevelProds, prodRng => {
        return prodRng.range.start
    })

    let definition: IProduction[] = []
    forEach(secondLevelInOrder, prodRng => {
        definition.push(buildProdGast(prodRng, allRanges, ruleName))
    })

    prod.definition = definition
    return prod
}

export function getDirectlyContainedRanges(
    y: IRange,
    prodRanges: IProdRange[]
): IProdRange[] {
    return filter(prodRanges, (x: IProdRange) => {
        let isXDescendantOfY = y.strictlyContainsRange(x.range)
        let xDoesNotHaveAnyAncestorWhichIsDecendantOfY = every(
            prodRanges,
            (maybeAnotherParent: IProdRange) => {
                let isParentOfX = maybeAnotherParent.range.strictlyContainsRange(
                    x.range
                )
                let isChildOfY = maybeAnotherParent.range.isStrictlyContainedInRange(
                    y
                )
                return !(isParentOfX && isChildOfY)
            }
        )
        return isXDescendantOfY && xDoesNotHaveAnyAncestorWhichIsDecendantOfY
    })
}

let singleLineCommentRegEx = /\/\/.*/g
let multiLineCommentRegEx = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g
let doubleQuoteStringLiteralRegEx = /(NAME\s*:\s*)?"([^\\"]|\\([bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/g
let singleQuoteStringLiteralRegEx = /(NAME\s*:\s*)?'([^\\']|\\([bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/g

export function removeComments(text: string): string {
    let noSingleLine = text.replace(singleLineCommentRegEx, "")
    let noComments = noSingleLine.replace(multiLineCommentRegEx, "")
    return noComments
}

function replaceWithEmptyStringExceptNestedRules(
    match,
    nestedRuleGroup
): string {
    // do not replace with empty string if a nest rule (NAME:"bamba") was detected
    if (nestedRuleGroup !== undefined) {
        return match
    }
    return ""
}
export function removeStringLiterals(text: string): string {
    let noDoubleQuotes = text.replace(
        doubleQuoteStringLiteralRegEx,
        replaceWithEmptyStringExceptNestedRules
    )
    let noSingleQuotes = noDoubleQuotes.replace(
        singleQuoteStringLiteralRegEx,
        replaceWithEmptyStringExceptNestedRules
    )
    return noSingleQuotes
}

export function createRanges(text: string): IProdRange[] {
    let terminalRanges = createTerminalRanges(text)
    let refsRanges = createRefsRanges(text)
    let atLeastOneRanges = createAtLeastOneRanges(text)
    let atLeastOneSepRanges = createAtLeastOneSepRanges(text)
    let manyRanges = createManyRanges(text)
    let manySepRanges = createManySepRanges(text)
    let optionRanges = createOptionRanges(text)
    let orRanges = createOrRanges(text)

    return [].concat(
        terminalRanges,
        refsRanges,
        atLeastOneRanges,
        atLeastOneSepRanges,
        manyRanges,
        manySepRanges,
        optionRanges,
        orRanges
    )
}

export function createTerminalRanges(text: string): IProdRange[] {
    return createRefOrTerminalProdRangeInternal(
        text,
        ProdType.TERMINAL,
        terminalRegGlobal
    )
}

export function createRefsRanges(text: string): IProdRange[] {
    return createRefOrTerminalProdRangeInternal(
        text,
        ProdType.REF,
        refRegExGlobal
    )
}

export function createAtLeastOneRanges(text: string): IProdRange[] {
    return createOperatorProdRangeParenthesis(
        text,
        ProdType.AT_LEAST_ONE,
        atLeastOneRegExGlobal
    )
}

export function createAtLeastOneSepRanges(text: string): IProdRange[] {
    return createOperatorProdRangeParenthesis(
        text,
        ProdType.AT_LEAST_ONE_SEP,
        atLeastOneWithSeparatorRegExGlobal
    )
}

export function createManyRanges(text: string): IProdRange[] {
    return createOperatorProdRangeParenthesis(
        text,
        ProdType.MANY,
        manyRegExGlobal
    )
}

export function createManySepRanges(text: string): IProdRange[] {
    return createOperatorProdRangeParenthesis(
        text,
        ProdType.MANY_SEP,
        manyWithSeparatorRegExGlobal
    )
}

export function createOptionRanges(text: string): IProdRange[] {
    return createOperatorProdRangeParenthesis(
        text,
        ProdType.OPTION,
        optionRegExGlobal
    )
}

export function createOrRanges(text): IProdRange[] {
    let orRanges = createOperatorProdRangeParenthesis(
        text,
        ProdType.OR,
        orRegExGlobal
    )
    // have to split up the OR cases into separate FLAT productions
    // (A |BB | CDE) ==> or.def[0] --> FLAT(A) , or.def[1] --> FLAT(BB) , or.def[2] --> FLAT(CCDE)
    let orSubPartsRanges = createOrPartRanges(orRanges)
    return orRanges.concat(orSubPartsRanges)
}

let findClosingCurly: (start: number, text: string) => number = <any>(
    partial(findClosingOffset, "{", "}")
)

let findClosingParen: (start: number, text: string) => number = <any>(
    partial(findClosingOffset, "(", ")")
)

export function createOrPartRanges(orRanges: IProdRange[]): IProdRange[] {
    let orPartRanges: IProdRange[] = []
    forEach(orRanges, orRange => {
        let currOrParts = createOperatorProdRangeInternal(
            orRange.text,
            ProdType.FLAT,
            orPartRegExGlobal,
            findClosingCurly
        )
        let currOrRangeStart = orRange.range.start
        // fix offsets as we are working on a subset of the text
        forEach(currOrParts, orPart => {
            orPart.range.start += currOrRangeStart
            orPart.range.end += currOrRangeStart
        })
        orPartRanges = orPartRanges.concat(currOrParts)
    })

    let uniqueOrPartRanges = uniq(orPartRanges, (prodRange: IProdRange) => {
        // using "~" as a separator for the identify function as its not a valid char in javascript
        return (
            prodRange.type +
            "~" +
            prodRange.range.start +
            "~" +
            prodRange.range.end +
            "~" +
            prodRange.text
        )
    })

    return uniqueOrPartRanges
}

function createRefOrTerminalProdRangeInternal(
    text: string,
    prodType: ProdType,
    pattern: RegExp
): IProdRange[] {
    let prodRanges: IProdRange[] = []
    let matched: RegExpExecArray
    while ((matched = pattern.exec(text))) {
        let start = matched.index
        let stop = pattern.lastIndex
        let currRange = new Range(start, stop)
        let currText = matched[0]
        prodRanges.push({
            range: currRange,
            text: currText,
            type: prodType
        })
    }
    return prodRanges
}

function createOperatorProdRangeParenthesis(
    text: string,
    prodType: ProdType,
    pattern: RegExp
): IProdRange[] {
    return createOperatorProdRangeInternal(
        text,
        prodType,
        pattern,
        findClosingParen
    )
}

function createOperatorProdRangeInternal(
    text: string,
    prodType: ProdType,
    pattern: RegExp,
    findTerminatorOffSet: (startAt: number, text: string) => number
): IProdRange[] {
    let operatorRanges: IProdRange[] = []
    let matched: RegExpExecArray
    while ((matched = pattern.exec(text))) {
        let start = matched.index
        // note that (start + matched[0].length) is the first character AFTER the match
        let stop = findTerminatorOffSet(start + matched[0].length, text)
        let currRange = new Range(start, stop)
        let currText = text.substr(start, stop - start + 1)
        operatorRanges.push({
            range: currRange,
            text: currText,
            type: prodType
        })
    }
    return operatorRanges
}

export function findClosingOffset(
    opening: string,
    closing: string,
    start: number,
    text: string
): number {
    let parenthesisStack = [1]

    let i = -1
    while (!isEmpty(parenthesisStack) && i + start < text.length) {
        i++
        let nextChar = text.charAt(start + i)
        if (nextChar === opening) {
            parenthesisStack.push(1)
        } else if (nextChar === closing) {
            parenthesisStack.pop()
        }
    }

    // valid termination of the search loop
    if (isEmpty(parenthesisStack)) {
        return i + start
    } else {
        throw new Error("INVALID INPUT TEXT, UNTERMINATED PARENTHESIS")
    }
}

export function deserializeGrammar(
    grammar: ISerializedGast[],
    terminals: ITerminalNameToConstructor
): IProduction[] {
    return map(grammar, production =>
        deserializeProduction(production, terminals)
    )
}

export function deserializeProduction(
    node: ISerializedGastAny,
    terminals: ITerminalNameToConstructor
): IProduction {
    switch (node.type) {
        case "NonTerminal":
            return new NonTerminal({
                nonTerminalName: node.name,
                idx: node.idx
            })
        case "Flat":
            return new Flat({
                name: node.name,
                definition: deserializeGrammar(node.definition, terminals)
            })
        case "Option":
            return new Option({
                name: node.name,
                idx: node.idx,
                definition: deserializeGrammar(node.definition, terminals)
            })
        case "RepetitionMandatory":
            return new RepetitionMandatory({
                name: node.name,
                idx: node.idx,
                definition: deserializeGrammar(node.definition, terminals)
            })
        case "RepetitionMandatoryWithSeparator":
            return new RepetitionMandatoryWithSeparator({
                name: node.name,
                idx: node.idx,
                separator: terminals[node.separator.name],
                definition: deserializeGrammar(node.definition, terminals)
            })
        case "RepetitionWithSeparator":
            return new RepetitionWithSeparator({
                name: node.name,
                idx: node.idx,
                separator: terminals[node.separator.name],
                definition: deserializeGrammar(node.definition, terminals)
            })
        case "Repetition":
            return new Repetition({
                name: node.name,
                idx: node.idx,
                definition: deserializeGrammar(node.definition, terminals)
            })
        case "Alternation":
            return new Alternation({
                name: node.name,
                idx: node.idx,
                definition: deserializeGrammar(node.definition, terminals)
            })
        case "Terminal":
            return new Terminal({
                terminalType: terminals[node.name],
                idx: node.idx
            })
        case "Rule":
            return new Rule({
                name: node.name,
                orgText: node.orgText,
                definition: deserializeGrammar(node.definition, terminals)
            })
        /* istanbul ignore next */
        default:
            const _never: never = node
    }
}
