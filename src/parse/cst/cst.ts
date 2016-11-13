import {ISimpleTokenOrIToken, tokenName} from "../../scan/tokens_public"
import {CstChildrenDictionary, CstNode} from "./cst_public"
import {gast} from "../grammar/gast_public"
import {cloneArr, cloneObj, drop, dropRight, forEach, has, isEmpty, isUndefined, last} from "../../utils/utils"
import {HashTable} from "../../lang/lang_extensions"
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

export function addTerminalToCst(node:CstNode, token:ISimpleTokenOrIToken, cstType:CST_SUBTYPE, tokenTypeName:string):void {
    if (cstType === CST_SUBTYPE.COLLECTION) {
        (node.children[tokenTypeName] as Array<ISimpleTokenOrIToken>).push(token)
    }
    else {
        node.children[tokenTypeName] = token
    }
}

export function addNoneTerminalToCst(node:CstNode, ruleName:string, ruleResult:any, cstType:CST_SUBTYPE):void {
    if (cstType === CST_SUBTYPE.COLLECTION) {
        (node.children[ruleName] as Array<CstNode>).push(ruleResult)
    }
    else {
        node.children[ruleName] = ruleResult
    }
}

export interface DefAndKeyAndName {
    def:IProduction[]
    key:number
    name:string
}

export class NamedDSLMethodsCollectorVisitor extends GAstVisitor {

    public result:DefAndKeyAndName[] = []
    public ruleIdx:number

    constructor(ruleIdx) {
        super()
        this.ruleIdx = ruleIdx
    }

    private collectNamedDSLMethod(node:IOptionallyNamedProduction & IProductionWithOccurrence & AbstractProduction,
                                  newNodeConstructor:any,
                                  methodIdx:number):void {
        if (!isUndefined(node.name)) {
            // copy without name so this will indeed be processed later.
            let nameLessNode
            if (has(node, "separator")) {
                // hack to avoid code duplication and refactoring the Gast type declaration / constructors arguments order.
                nameLessNode = new (<any>newNodeConstructor)(node.definition, (<any>node).separator, node.occurrenceInParent)
            } else {
                nameLessNode = new newNodeConstructor(node.definition, node.occurrenceInParent)
            }
            let def = [nameLessNode]
            let key = getKeyForAutomaticLookahead(this.ruleIdx, methodIdx, node.occurrenceInParent)
            this.result.push({def, key, name: node.name})
        }
    }

    visitOption(node:gast.Option):void {
        this.collectNamedDSLMethod(node, gast.Option, OPTION_IDX)
    }

    visitRepetition(node:gast.Repetition):void {
        this.collectNamedDSLMethod(node, gast.Repetition, MANY_IDX)
    }

    visitRepetitionMandatory(node:gast.RepetitionMandatory):void {
        this.collectNamedDSLMethod(node, gast.RepetitionMandatory, AT_LEAST_ONE_IDX)
    }

    visitRepetitionMandatoryWithSeparator(node:gast.RepetitionMandatoryWithSeparator):void {
        this.collectNamedDSLMethod(node, gast.RepetitionMandatoryWithSeparator, AT_LEAST_ONE_SEP_IDX)
    }

    visitRepetitionWithSeparator(node:gast.RepetitionWithSeparator):void {
        this.collectNamedDSLMethod(node, gast.RepetitionWithSeparator, MANY_SEP_IDX)
    }

    visitAlternation(node:gast.Alternation):void {
        this.collectNamedDSLMethod(node, gast.Alternation, OR_IDX)

        const hasMoreThanOneAlternative = node.definition.length > 1
        forEach(node.definition, (currFlatAlt:gast.Flat, altIdx) => {
            if (!isUndefined(currFlatAlt.name)) {
                let def = currFlatAlt.definition
                if (hasMoreThanOneAlternative) {
                    def = [new gast.Option(currFlatAlt.definition)]
                }
                // mandatory
                else {
                    def = currFlatAlt.definition
                }
                let key = getKeyForAltIndex(this.ruleIdx, OR_IDX, node.occurrenceInParent, altIdx)
                this.result.push({def, key, name: currFlatAlt.name})
            }
        })
    }
}

export function buildChildrenDictionaryDefTopRules(topRules:gast.Rule[],
                                                   fullToShortName:HashTable<number>):HashTable<HashTable<CST_SUBTYPE>> {
    let result = new HashTable<HashTable<CST_SUBTYPE>>()

    forEach(topRules, (currTopRule) => {
        let currRuleDictionaryDef = buildChildDictionaryDef(currTopRule.definition)
        let currTopRuleShortName = fullToShortName.get(currTopRule.name)
        result.put(currTopRuleShortName, currRuleDictionaryDef)

        let namedCollectorVisitor = new NamedDSLMethodsCollectorVisitor(currTopRuleShortName)
        currTopRule.accept(namedCollectorVisitor)
        forEach(namedCollectorVisitor.result, ({def, key}) => {
            let currNamedMethodDictionaryDef = buildChildDictionaryDef(def)
            result.put(key, currNamedMethodDictionaryDef)
        })
    })

    return result
}

export type InitCstDef = HashTable<{ collections:string[], optionals:string[] }>
export function buildInitCstDef(childrenDictionaryDef:HashTable<HashTable<CST_SUBTYPE>>):InitCstDef {
    let result = new HashTable<{ collections:string[], optionals:string[] }>()

    forEach(childrenDictionaryDef.keys(), (currKey) => {
        let currRuleDictDef = childrenDictionaryDef.get(currKey)
        let collections:string[] = []
        let optionals:string[] = []

        forEach(currRuleDictDef.keys(), (currDefKey) => {
            let dictValue = currRuleDictDef.get(currDefKey)
            if (dictValue === CST_SUBTYPE.COLLECTION) {
                collections.push(currDefKey)
            }
            else if (dictValue === CST_SUBTYPE.OPTIONAL) {
                optionals.push(currDefKey)
            }
        })

        result.put(currKey, {collections, optionals})
    })

    return result
}

export enum CST_SUBTYPE {NONE, COLLECTION, OPTIONAL}

export class ChildDictionaryDefInitVisitor extends GAstVisitor {

    public result:HashTable<CST_SUBTYPE>

    constructor() {
        super()
        this.result = new HashTable<CST_SUBTYPE>()
    }

    public visitNonTerminal(node:NonTerminal):any {
        let id = node.nonTerminalName
        this.result.put(id, CST_SUBTYPE.NONE)
    }

    public visitTerminal(node:Terminal):any {
        let id = tokenName(node.terminalType)
        this.result.put(id, CST_SUBTYPE.NONE)
    }
}

export function buildChildDictionaryDef(initialDef:IProduction[]):HashTable<CST_SUBTYPE> {
    let initVisitor = new ChildDictionaryDefInitVisitor()
    let wrapperRule = new gast.Rule("wrapper", initialDef)
    wrapperRule.accept(initVisitor)

    let result = initVisitor.result

    let possiblePaths = []
    possiblePaths.push({def: initialDef, inIteration: [], inOption: [], currResult: {}})

    let currDef:IProduction[]
    let currInIteration
    let currInOption
    let currResult

    function addSingleItemToResult(itemName) {
        if (!has(currResult, itemName)) {
            currResult[itemName] = 0
        }
        currResult[itemName] += 1

        let occurrencesFound = currResult[itemName]
        if (occurrencesFound > 1 || last(currInIteration)) {
            result.put(itemName, CST_SUBTYPE.COLLECTION)
        }
        else if (last(currInOption)) {
            result.put(itemName, CST_SUBTYPE.OPTIONAL)
        }

        let nextPath = {
            def:         drop(currDef),
            inIteration: currInIteration,
            inOption:    currInOption,
            currResult:  cloneObj(currResult)
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

        const EXIT_ITERATION:any = "EXIT_ITERATION"
        const EXIT_OPTION:any = "EXIT_OPTION"

        let prod = currDef[0]
        if (prod === EXIT_ITERATION) {
            let nextPath = {
                def:         drop(currDef),
                inIteration: dropRight(currInIteration),
                inOption:    currInOption,
                currResult:  cloneObj(currResult)
            }
            possiblePaths.push(nextPath)
        }
        else if (prod === EXIT_OPTION) {
            let nextPath = {
                def:         drop(currDef),
                inIteration: currInIteration,
                inOption:    dropRight(currInOption),
                currResult:  cloneObj(currResult)
            }
            possiblePaths.push(nextPath)
        }
        else if (prod instanceof gast.Terminal) {
            let terminalName = tokenName(prod.terminalType)
            addSingleItemToResult(terminalName)
        }
        else if (prod instanceof gast.NonTerminal) {
            let nonTerminalName = prod.nonTerminalName
            addSingleItemToResult(nonTerminalName)
        }
        else if (prod instanceof gast.Option) {
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            }
            else {
                let newInOption = cloneArr(currInIteration)
                newInOption.push(true)

                let nextPathWith = {
                    def:         prod.definition.concat([EXIT_OPTION], drop(currDef)),
                    inIteration: currInIteration,
                    inOption:    newInOption,
                    currResult:  cloneObj(currResult)
                }
                possiblePaths.push(nextPathWith)
            }
        }

        else if (prod instanceof gast.RepetitionMandatory || prod instanceof gast.Repetition) {
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            }
            else {
                let nextDef = prod.definition.concat([EXIT_ITERATION], drop(currDef))
                let newInIteration = cloneArr(currInIteration)
                newInIteration.push(true)
                let nextPath = {
                    def:         nextDef,
                    inIteration: newInIteration,
                    inOption:    currInOption,
                    currResult:  cloneObj(currResult)
                }
                possiblePaths.push(nextPath)
            }
        }
        else if (prod instanceof gast.RepetitionMandatoryWithSeparator || prod instanceof gast.RepetitionWithSeparator) {
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            }
            else {
                let separatorGast = new gast.Terminal(prod.separator)
                let secondIteration:any = new gast.Repetition([<any>separatorGast].concat(prod.definition), prod.occurrenceInParent)
                // Hack: X (, X)* --> (, X) because it is identical in terms of identifying "isCollection?"
                let nextDef = [secondIteration].concat([EXIT_ITERATION], drop(currDef))
                let newInIteration = cloneArr(currInIteration)
                newInIteration.push(true)
                let nextPath = {
                    def:         nextDef,
                    inIteration: newInIteration,
                    inOption:    currInOption,
                    currResult:  cloneObj(currResult)
                }
                possiblePaths.push(nextPath)
            }
        }
        else if (prod instanceof gast.Alternation) {
            // IGNORE ABOVE ELSE
            if (!isUndefined(prod.name)) {
                addSingleItemToResult(prod.name)
            }
            else {
                let hasMoreThanOneAlt = prod.definition.length > 1
                // the order of alternatives is meaningful, FILO (Last path will be traversed first).
                for (let i = prod.definition.length - 1; i >= 0; i--) {
                    let currAlt:any = prod.definition[i]
                    // named alternatives
                    if (!isUndefined(currAlt.name)) {
                        addSingleItemToResult(prod.name)
                    }
                    else {
                        let newInOption
                        let newDef
                        if (hasMoreThanOneAlt) {
                            newInOption = cloneArr(currInIteration)
                            newInOption.push(true)
                            newDef = currAlt.definition.concat([EXIT_OPTION], drop(currDef))
                        }
                        else {
                            newInOption = cloneArr(currInIteration)
                            newDef = currAlt.definition.concat(drop(currDef))
                        }
                        let currAltPath = {
                            def:         newDef,
                            inIteration: currInIteration,
                            inOption:    newInOption,
                            currResult:  cloneObj(currResult)
                        }
                        possiblePaths.push(currAltPath)
                    }
                }
            }
        }
        else {
            throw Error("non exhaustive match")
        }
    }
    return result
}

export function initChildrenDictionary(collections:string[], optionals:string[]):CstChildrenDictionary {
    let childrenDictionary = {}

    let collectionsLength = collections.length
    for (let i = 0; i < collectionsLength; i++) {
        let key = collections[i]
        childrenDictionary[key] = []
    }

    let optionalLength = optionals.length
    for (let i = 0; i < optionalLength; i++) {
        let key = optionals[i]
        childrenDictionary[key] = undefined
    }

    return childrenDictionary
}

/**
 * Side Effect, Modifies the input cstNode
 */
export function AddRecoveryInfoToCstNode(cstNode:CstNode, childrenDictionaryDef:HashTable<CST_SUBTYPE>):void {
    (<any>cstNode).recoveredNode = true

    forEach(childrenDictionaryDef.keys(), (currKey) => {
        let dictValue = childrenDictionaryDef.get(currKey)

        if (dictValue === CST_SUBTYPE.NONE && !has(cstNode.children, currKey)) {
            // during parsing of valid input this key would not have had to be defined
            // as it is a mandatory (non-optional) Cst child. However when dealing with partial parsing results
            // during error recovery, the parser may not have encountered all the "mandatory" cst children.
            cstNode.children[currKey] = undefined
        }
    })
}
