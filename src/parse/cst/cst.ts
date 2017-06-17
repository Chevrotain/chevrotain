import { IToken, tokenName } from "../../scan/tokens_public"
import { CstNode } from "./cst_public"
import { gast } from "../grammar/gast_public"
import {
    cloneObj,
    drop,
    forEach,
    has,
    isEmpty,
    isUndefined,
    map
} from "../../utils/utils"
import { HashTable } from "../../lang/lang_extensions"
import {
    AT_LEAST_ONE_IDX,
    AT_LEAST_ONE_SEP_IDX,
    getKeyForAltIndex,
    getKeyForAutomaticLookahead,
    MANY_IDX,
    MANY_SEP_IDX,
    OPTION_IDX,
    OR_IDX
} from "../grammar/keys"
import IProduction = gast.IProduction
import GAstVisitor = gast.GAstVisitor
import NonTerminal = gast.NonTerminal
import Terminal = gast.Terminal
import IOptionallyNamedProduction = gast.IOptionallyNamedProduction
import IProductionWithOccurrence = gast.IProductionWithOccurrence
import AbstractProduction = gast.AbstractProduction

export function addTerminalToCst(
    node: CstNode,
    token: IToken,
    tokenTypeName: string
): void {
    ;(node.children[tokenTypeName] as Array<IToken>).push(token)
}

export function addNoneTerminalToCst(
    node: CstNode,
    ruleName: string,
    ruleResult: any
): void {
    ;(node.children[ruleName] as Array<CstNode>).push(ruleResult)
}

export interface DefAndKeyAndName {
    def: IProduction[]
    key: number
    name: string
}

export class NamedDSLMethodsCollectorVisitor extends GAstVisitor {
    public result: DefAndKeyAndName[] = []
    public ruleIdx: number

    constructor(ruleIdx) {
        super()
        this.ruleIdx = ruleIdx
    }

    private collectNamedDSLMethod(
        node: IOptionallyNamedProduction &
            IProductionWithOccurrence &
            AbstractProduction,
        newNodeConstructor: any,
        methodIdx: number
    ): void {
        if (!isUndefined(node.name)) {
            // copy without name so this will indeed be processed later.
            let nameLessNode
            if (has(node, "separator")) {
                // hack to avoid code duplication and refactoring the Gast type declaration / constructors arguments order.
                nameLessNode = new (<any>newNodeConstructor)(
                    node.definition,
                    (<any>node).separator,
                    node.occurrenceInParent
                )
            } else {
                nameLessNode = new newNodeConstructor(
                    node.definition,
                    node.occurrenceInParent
                )
            }
            let def = [nameLessNode]
            let key = getKeyForAutomaticLookahead(
                this.ruleIdx,
                methodIdx,
                node.occurrenceInParent
            )
            this.result.push({ def, key, name: node.name })
        }
    }

    visitOption(node: gast.Option): void {
        this.collectNamedDSLMethod(node, gast.Option, OPTION_IDX)
    }

    visitRepetition(node: gast.Repetition): void {
        this.collectNamedDSLMethod(node, gast.Repetition, MANY_IDX)
    }

    visitRepetitionMandatory(node: gast.RepetitionMandatory): void {
        this.collectNamedDSLMethod(
            node,
            gast.RepetitionMandatory,
            AT_LEAST_ONE_IDX
        )
    }

    visitRepetitionMandatoryWithSeparator(
        node: gast.RepetitionMandatoryWithSeparator
    ): void {
        this.collectNamedDSLMethod(
            node,
            gast.RepetitionMandatoryWithSeparator,
            AT_LEAST_ONE_SEP_IDX
        )
    }

    visitRepetitionWithSeparator(node: gast.RepetitionWithSeparator): void {
        this.collectNamedDSLMethod(
            node,
            gast.RepetitionWithSeparator,
            MANY_SEP_IDX
        )
    }

    visitAlternation(node: gast.Alternation): void {
        this.collectNamedDSLMethod(node, gast.Alternation, OR_IDX)

        const hasMoreThanOneAlternative = node.definition.length > 1
        forEach(node.definition, (currFlatAlt: gast.Flat, altIdx) => {
            if (!isUndefined(currFlatAlt.name)) {
                let def = currFlatAlt.definition
                if (hasMoreThanOneAlternative) {
                    def = [new gast.Option(currFlatAlt.definition)]
                } else {
                    // mandatory
                    def = currFlatAlt.definition
                }
                let key = getKeyForAltIndex(
                    this.ruleIdx,
                    OR_IDX,
                    node.occurrenceInParent,
                    altIdx
                )
                this.result.push({ def, key, name: currFlatAlt.name })
            }
        })
    }
}

export function analyzeCst(
    topRules: gast.Rule[],
    fullToShortName: HashTable<number>
): {
    dictDef: HashTable<Function>
    allRuleNames: string[]
} {
    let result = { dictDef: new HashTable<Function>(), allRuleNames: [] }

    forEach(topRules, currTopRule => {
        let currChildrenNames = buildChildDictionaryDef(currTopRule.definition)
        let currTopRuleShortName = fullToShortName.get(currTopRule.name)
        result.dictDef.put(
            currTopRuleShortName,
            buildInitDefFunc(currChildrenNames)
        )
        result.allRuleNames.push(currTopRule.name)

        let namedCollectorVisitor = new NamedDSLMethodsCollectorVisitor(
            currTopRuleShortName
        )
        currTopRule.accept(namedCollectorVisitor)
        forEach(namedCollectorVisitor.result, ({ def, key, name }) => {
            let currNestedChildrenNames = buildChildDictionaryDef(def)
            result.dictDef.put(key, buildInitDefFunc(currNestedChildrenNames))
            result.allRuleNames.push(currTopRule.name + name)
        })
    })

    return result
}
function buildInitDefFunc(childrenNames: string[]): Function {
    let funcString = `return {\n`

    funcString += map(childrenNames, currName => `"${currName}" : []`).join(
        ",\n"
    )
    funcString += `}`

    // major performance optimization, faster to create the children dictionary this way
    // versus iterating over the childrenNames each time.
    return Function(funcString)
}

export function buildChildDictionaryDef(initialDef: IProduction[]): string[] {
    let result = []

    let possiblePaths = []
    possiblePaths.push({ def: initialDef })

    let currDef: IProduction[]
    let currInIteration
    let currInOption
    let currResult

    function addSingleItemToResult(itemName) {
        result.push(itemName)

        let nextPath = {
            def: drop(currDef),
            inIteration: currInIteration,
            inOption: currInOption,
            currResult: cloneObj(currResult)
        }
        possiblePaths.push(nextPath)
    }

    while (!isEmpty(possiblePaths)) {
        let currPath = possiblePaths.pop()

        currDef = currPath.def
        currInIteration = currPath.inIteration
        currInOption = currPath.inOption
        currResult = currPath.currResult

        // For Example: an empty path could exist in a valid grammar in the case of an EMPTY_ALT
        if (isEmpty(currDef)) {
            continue
        }

        let prod = currDef[0]
        if (prod instanceof gast.Terminal) {
            let terminalName = tokenName(prod.terminalType)
            addSingleItemToResult(terminalName)
        } else if (prod instanceof gast.NonTerminal) {
            let nonTerminalName = prod.nonTerminalName
            addSingleItemToResult(nonTerminalName)
        } else if (prod instanceof gast.Option) {
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            } else {
                let nextPathWith = {
                    def: prod.definition.concat(drop(currDef))
                }
                possiblePaths.push(nextPathWith)
            }
        } else if (
            prod instanceof gast.RepetitionMandatory ||
            prod instanceof gast.Repetition
        ) {
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            } else {
                let nextDef = prod.definition.concat(drop(currDef))
                let nextPath = {
                    def: nextDef
                }
                possiblePaths.push(nextPath)
            }
        } else if (
            prod instanceof gast.RepetitionMandatoryWithSeparator ||
            prod instanceof gast.RepetitionWithSeparator
        ) {
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            } else {
                let separatorGast = new gast.Terminal(prod.separator)
                let secondIteration: any = new gast.Repetition(
                    [<any>separatorGast].concat(prod.definition),
                    prod.occurrenceInParent
                )
                // Hack: X (, X)* --> (, X) because it is identical in terms of identifying "isCollection?"
                let nextDef = [secondIteration].concat(drop(currDef))
                let nextPath = {
                    def: nextDef
                }
                possiblePaths.push(nextPath)
            }
        } else if (prod instanceof gast.Alternation) {
            // IGNORE ABOVE ELSE
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            } else {
                // the order of alternatives is meaningful, FILO (Last path will be traversed first).
                for (let i = prod.definition.length - 1; i >= 0; i--) {
                    let currAlt: any = prod.definition[i]
                    // named alternatives
                    if (!isUndefined(currAlt.name)) {
                        addSingleItemToResult(currAlt.name)
                    } else {
                        let newDef = currAlt.definition.concat(drop(currDef))
                        let currAltPath = {
                            def: newDef
                        }
                        possiblePaths.push(currAltPath)
                    }
                }
            }
        } else {
            throw Error("non exhaustive match")
        }
    }
    return result
}
