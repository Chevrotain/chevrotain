import { forEach, isUndefined } from "../../utils/utils"
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
    Option,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    RepetitionWithSeparator,
    Rule
} from "../grammar/gast/gast_public"
import { GAstVisitor } from "../grammar/gast/gast_visitor_public"
import {
    CstChildrenDictionary,
    CstNode,
    CstNodeLocation,
    IOptionallyNamedProduction,
    IProduction,
    IToken
} from "../../../api"

/**
 * This nodeLocation tracking is not efficient and should only be used
 * when error recovery is enabled or the Token Vector contains virtual Tokens
 * (e.g, Python Indent/Outdent)
 * As it executes the calculation for every single terminal/nonTerminal
 * and does not rely on the fact the token vector is **sorted**
 */
export function setNodeLocationOnlyOffset(
    currNodeLocation: CstNodeLocation,
    newLocationInfo: IToken
): void {
    // First (valid) update for this cst node
    if (isNaN(currNodeLocation.startOffset) === true) {
        // assumption1: Token location information is either NaN or a valid number
        // assumption2: Token location information is fully valid if it exist
        // (both start/end offsets exist and are numbers).
        currNodeLocation.startOffset = newLocationInfo.startOffset
        currNodeLocation.endOffset = newLocationInfo.endOffset
    }
    // Once the startOffset has been updated with a valid number it should never receive
    // any farther updates as the Token vector is sorted.
    // We still have to check this this condition for every new possible location info
    // because with error recovery enabled we may encounter invalid tokens (NaN location props)
    else if (currNodeLocation.endOffset < newLocationInfo.endOffset === true) {
        currNodeLocation.endOffset = newLocationInfo.endOffset
    }
}

/**
 * This nodeLocation tracking is not efficient and should only be used
 * when error recovery is enabled or the Token Vector contains virtual Tokens
 * (e.g, Python Indent/Outdent)
 * As it executes the calculation for every single terminal/nonTerminal
 * and does not rely on the fact the token vector is **sorted**
 */
export function setNodeLocationFull(
    currNodeLocation: CstNodeLocation,
    newLocationInfo: CstNodeLocation
): void {
    // First (valid) update for this cst node
    if (isNaN(currNodeLocation.startOffset) === true) {
        // assumption1: Token location information is either NaN or a valid number
        // assumption2: Token location information is fully valid if it exist
        // (all start/end props exist and are numbers).
        currNodeLocation.startOffset = newLocationInfo.startOffset
        currNodeLocation.startColumn = newLocationInfo.startColumn
        currNodeLocation.startLine = newLocationInfo.startLine
        currNodeLocation.endOffset = newLocationInfo.endOffset
        currNodeLocation.endColumn = newLocationInfo.endColumn
        currNodeLocation.endLine = newLocationInfo.endLine
    }
    // Once the start props has been updated with a valid number it should never receive
    // any farther updates as the Token vector is sorted.
    // We still have to check this this condition for every new possible location info
    // because with error recovery enabled we may encounter invalid tokens (NaN location props)
    else if (currNodeLocation.endOffset < newLocationInfo.endOffset === true) {
        currNodeLocation.endOffset = newLocationInfo.endOffset
        currNodeLocation.endColumn = newLocationInfo.endColumn
        currNodeLocation.endLine = newLocationInfo.endLine
    }
}

export function addTerminalToCst(
    node: CstNode,
    token: IToken,
    tokenTypeName: string
): void {
    if (node.children[tokenTypeName] === undefined) {
        node.children[tokenTypeName] = [token]
    } else {
        node.children[tokenTypeName].push(token)
    }
}

export function addNoneTerminalToCst(
    node: CstNode,
    ruleName: string,
    ruleResult: any
): void {
    if (node.children[ruleName] === undefined) {
        node.children[ruleName] = [ruleResult]
    } else {
        node.children[ruleName].push(ruleResult)
    }
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

            /* istanbul ignore else */
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

export function expandAllNestedRuleNames(
    topRules: Rule[],
    fullToShortName: Record<string, number>
): {
    allRuleNames: string[]
} {
    let result = {
        allRuleNames: []
    }

    forEach(topRules, currTopRule => {
        let currTopRuleShortName = fullToShortName[currTopRule.name]
        result.allRuleNames.push(currTopRule.name)

        let namedCollectorVisitor = new NamedDSLMethodsCollectorVisitor(
            currTopRuleShortName
        )
        currTopRule.accept(namedCollectorVisitor)
        forEach(namedCollectorVisitor.result, ({ def, key, name }) => {
            result.allRuleNames.push(currTopRule.name + name)
        })
    })

    return result
}
