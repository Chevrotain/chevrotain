import { IToken, tokenName } from "../../scan/tokens_public"
import { CstNode } from "./cst_public"
import {
    cloneObj,
    drop,
    forEach,
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
import {
    Alternation,
    Flat,
    IOptionallyNamedProduction,
    IProduction,
    NonTerminal,
    Option,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    RepetitionWithSeparator,
    Rule,
    Terminal
} from "../grammar/gast/gast_public"
import { GAstVisitor } from "../grammar/gast/gast_visitor_public"

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
    orgProd: IOptionallyNamedProduction
}

export class NamedDSLMethodsCollectorVisitor extends GAstVisitor {
    public result: DefAndKeyAndName[] = []
    public ruleIdx: number

    constructor(ruleIdx) {
        super()
        this.ruleIdx = ruleIdx
    }

    private collectNamedDSLMethod(
        node: any,
        newNodeConstructor: any,
        methodIdx: number
    ): void {
        // TODO: better hack to copy what we need here...
        if (!isUndefined(node.name)) {
            // copy without name so this will indeed be processed later.
            let nameLessNode

            if (
                node instanceof Option ||
                node instanceof Repetition ||
                node instanceof RepetitionMandatory ||
                node instanceof Alternation
            ) {
                nameLessNode = new (<any>newNodeConstructor)({
                    definition: node.definition,
                    idx: node.idx
                })
            } else if (
                node instanceof RepetitionMandatoryWithSeparator ||
                node instanceof RepetitionWithSeparator
            ) {
                nameLessNode = new (<any>newNodeConstructor)({
                    definition: node.definition,
                    idx: node.idx,
                    separator: node.separator
                })
            } else {
                /* istanbul ignore next */
                throw Error("non exhaustive match")
            }
            let def = [nameLessNode]
            let key = getKeyForAutomaticLookahead(
                this.ruleIdx,
                methodIdx,
                node.idx
            )
            this.result.push({ def, key, name: node.name, orgProd: node })
        }
    }

    visitOption(node: Option): void {
        this.collectNamedDSLMethod(node, Option, OPTION_IDX)
    }

    visitRepetition(node: Repetition): void {
        this.collectNamedDSLMethod(node, Repetition, MANY_IDX)
    }

    visitRepetitionMandatory(node: RepetitionMandatory): void {
        this.collectNamedDSLMethod(node, RepetitionMandatory, AT_LEAST_ONE_IDX)
    }

    visitRepetitionMandatoryWithSeparator(
        node: RepetitionMandatoryWithSeparator
    ): void {
        this.collectNamedDSLMethod(
            node,
            RepetitionMandatoryWithSeparator,
            AT_LEAST_ONE_SEP_IDX
        )
    }

    visitRepetitionWithSeparator(node: RepetitionWithSeparator): void {
        this.collectNamedDSLMethod(node, RepetitionWithSeparator, MANY_SEP_IDX)
    }

    visitAlternation(node: Alternation): void {
        this.collectNamedDSLMethod(node, Alternation, OR_IDX)

        const hasMoreThanOneAlternative = node.definition.length > 1
        forEach(node.definition, (currFlatAlt: Flat, altIdx) => {
            if (!isUndefined(currFlatAlt.name)) {
                let def = currFlatAlt.definition
                if (hasMoreThanOneAlternative) {
                    def = [new Option({ definition: currFlatAlt.definition })]
                } else {
                    // mandatory
                    def = currFlatAlt.definition
                }
                let key = getKeyForAltIndex(
                    this.ruleIdx,
                    OR_IDX,
                    node.idx,
                    altIdx
                )
                this.result.push({
                    def,
                    key,
                    name: currFlatAlt.name,
                    orgProd: currFlatAlt
                })
            }
        })
    }
}

export function analyzeCst(
    topRules: Rule[],
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
        if (prod instanceof Terminal) {
            let terminalName = tokenName(prod.terminalType)
            addSingleItemToResult(terminalName)
        } else if (prod instanceof NonTerminal) {
            let nonTerminalName = prod.nonTerminalName
            addSingleItemToResult(nonTerminalName)
        } else if (prod instanceof Option) {
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            } else {
                let nextPathWith = {
                    def: prod.definition.concat(drop(currDef))
                }
                possiblePaths.push(nextPathWith)
            }
        } else if (
            prod instanceof RepetitionMandatory ||
            prod instanceof Repetition
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
            prod instanceof RepetitionMandatoryWithSeparator ||
            prod instanceof RepetitionWithSeparator
        ) {
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            } else {
                let separatorGast = new Terminal({
                    terminalType: prod.separator
                })
                let secondIteration: any = new Repetition({
                    definition: [<any>separatorGast].concat(prod.definition),
                    idx: prod.idx
                })
                // Hack: X (, X)* --> (, X) because it is identical in terms of identifying "isCollection?"
                let nextDef = [secondIteration].concat(drop(currDef))
                let nextPath = {
                    def: nextDef
                }
                possiblePaths.push(nextPath)
            }
        } else if (prod instanceof Alternation) {
            /* istanbul ignore else */
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
            /* istanbul ignore next */ throw Error("non exhaustive match")
        }
    }
    return result
}
