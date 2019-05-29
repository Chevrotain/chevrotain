import {
    addNoneTerminalToCst,
    addTerminalToCst,
    setNodeLocationFromTokenOnlyOffset,
    setNodeLocationFull,
    setNodeLocationFromNodeOnlyOffset
} from "../../cst/cst"
import { has, isUndefined, NOOP } from "../../../utils/utils"
import {
    createBaseSemanticVisitorConstructor,
    createBaseVisitorConstructorWithDefaults
} from "../../cst/cst_visitor"
import {
    CstNode,
    CstNodeLocation,
    ICstVisitor,
    IParserConfig,
    IToken,
    NodePositionTrackingOptions
} from "../../../../api"
import { getKeyForAltIndex } from "../../grammar/keys"
import { MixedInParser } from "./parser_traits"
import { DEFAULT_PARSER_CONFIG } from "../parser"

/**
 * This trait is responsible for the CST building logic.
 */
export class TreeBuilder {
    outputCst: boolean
    CST_STACK: CstNode[]
    baseCstVisitorConstructor: Function
    baseCstVisitorWithDefaultsConstructor: Function
    LAST_EXPLICIT_RULE_STACK: number[]

    // TODO: this method should have a better signature
    setNodeLocationFromNode: (
        nodeLocation: CstNodeLocation,
        locationInformation: any
    ) => void
    setNodeLocationFromToken: (
        nodeLocation: CstNodeLocation,
        locationInformation: any
    ) => void
    setInitialNodeLocation: (cstNode: CstNode) => void
    nodePositionTracking: NodePositionTrackingOptions

    initTreeBuilder(this: MixedInParser, config: IParserConfig) {
        this.LAST_EXPLICIT_RULE_STACK = []
        this.CST_STACK = []
        this.outputCst = has(config, "outputCst")
            ? config.outputCst
            : DEFAULT_PARSER_CONFIG.outputCst

        this.nodePositionTracking = has(config, "nodePositionTracking")
            ? config.nodePositionTracking
            : DEFAULT_PARSER_CONFIG.nodePositionTracking

        if (!this.outputCst) {
            this.cstInvocationStateUpdate = NOOP
            this.cstFinallyStateUpdate = NOOP
            this.cstPostTerminal = NOOP
            this.cstPostNonTerminal = NOOP
            this.getLastExplicitRuleShortName = this.getLastExplicitRuleShortNameNoCst
            this.getPreviousExplicitRuleShortName = this.getPreviousExplicitRuleShortNameNoCst
            this.getLastExplicitRuleOccurrenceIndex = this.getLastExplicitRuleOccurrenceIndexNoCst
            this.manyInternal = this.manyInternalNoCst
            this.orInternal = this.orInternalNoCst
            this.optionInternal = this.optionInternalNoCst
            this.atLeastOneInternal = this.atLeastOneInternalNoCst
            this.manySepFirstInternal = this.manySepFirstInternalNoCst
            this.atLeastOneSepFirstInternal = this.atLeastOneSepFirstInternalNoCst
        }

        if (/full/i.test(this.nodePositionTracking)) {
            this.setNodeLocationFromToken = setNodeLocationFull
            this.setNodeLocationFromNode = setNodeLocationFull
            this.setInitialNodeLocation = this.setInitialNodeLocationFull
        } else if (/onlyOffset/i.test(this.nodePositionTracking)) {
            this.setNodeLocationFromToken = setNodeLocationFromTokenOnlyOffset
            this.setNodeLocationFromNode = setNodeLocationFromNodeOnlyOffset
            this.setInitialNodeLocation = this.setInitialNodeLocationOnlyOffset
        } else if (/none/i.test(this.nodePositionTracking)) {
            this.setNodeLocationFromToken = NOOP
            this.setNodeLocationFromNode = NOOP
            this.setInitialNodeLocation = NOOP
        } else {
            throw Error(
                `Invalid <nodePositionTracking> config option: "${
                    config.nodePositionTracking
                }"`
            )
        }
    }

    setInitialNodeLocationOnlyOffset(cstNode: CstNode): void {
        cstNode.location = {
            startOffset: Infinity,
            endOffset: -Infinity
        }
    }

    // TODO: I am not yet sure about which initial values should be used
    //   For Invalid Nodes we currently use NaN
    //   -  https://github.com/SAP/chevrotain/blob/fb714a7650dbff3b3342448fd284365384c85880/packages/chevrotain/src/parse/parser/parser.ts#L45-L54
    //  But this would make the conditions more complicated (and slower?)
    //  Number.MAX_VALUE is bad because it is a valid value theoretically so it cannot be distinguished
    //  from a Node with invalid location info (e.g recovered node)
    //  Perhaps we should use +/- Infinity
    //  But If we can use NaN and still keep things fast that would see the best for me.
    setInitialNodeLocationFull(cstNode: CstNode): void {
        cstNode.location = {
            startOffset: Infinity,
            startLine: Infinity,
            startColumn: Infinity,
            endOffset: -Infinity,
            endLine: -Infinity,
            endColumn: -Infinity
        }
    }

    // CST
    cstNestedInvocationStateUpdate(
        this: MixedInParser,
        nestedName: string,
        shortName: string | number
    ): void {
        const cstNode: CstNode = {
            name: nestedName,
            fullName:
                this.shortRuleNameToFull.get(
                    this.getLastExplicitRuleShortName()
                ) + nestedName,
            children: {}
        }

        this.setInitialNodeLocation(cstNode)

        this.CST_STACK.push(cstNode)
    }

    cstInvocationStateUpdate(
        this: MixedInParser,
        fullRuleName: string,
        shortName: string | number
    ): void {
        this.LAST_EXPLICIT_RULE_STACK.push(this.RULE_STACK.length - 1)

        const cstNode: CstNode = {
            name: fullRuleName,
            children: {}
        }

        this.setInitialNodeLocation(cstNode)

        this.CST_STACK.push(cstNode)
    }

    cstFinallyStateUpdate(this: MixedInParser): void {
        this.LAST_EXPLICIT_RULE_STACK.pop()
        this.CST_STACK.pop()
    }

    cstNestedFinallyStateUpdate(this: MixedInParser): void {
        this.CST_STACK.pop()
    }

    cstPostTerminal(
        this: MixedInParser,
        key: string,
        consumedToken: IToken
    ): void {
        // TODO: would save the "current rootCST be faster than locating it for each terminal?
        let rootCst = this.CST_STACK[this.CST_STACK.length - 1]
        addTerminalToCst(rootCst, consumedToken, key)
        this.setNodeLocationFromToken(rootCst.location, consumedToken)
    }

    cstPostNonTerminal(
        this: MixedInParser,
        ruleCstResult: CstNode,
        ruleName: string
    ): void {
        let node = this.CST_STACK[this.CST_STACK.length - 1]

        addNoneTerminalToCst(node, ruleName, ruleCstResult)
        this.setNodeLocationFromNode(node.location, ruleCstResult.location)
    }

    getBaseCstVisitorConstructor(
        this: MixedInParser
    ): {
        new (...args: any[]): ICstVisitor<any, any>
    } {
        if (isUndefined(this.baseCstVisitorConstructor)) {
            const newBaseCstVisitorConstructor = createBaseSemanticVisitorConstructor(
                this.className,
                this.allRuleNames
            )
            this.baseCstVisitorConstructor = newBaseCstVisitorConstructor
            return newBaseCstVisitorConstructor
        }

        return <any>this.baseCstVisitorConstructor
    }

    getBaseCstVisitorConstructorWithDefaults(
        this: MixedInParser
    ): {
        new (...args: any[]): ICstVisitor<any, any>
    } {
        if (isUndefined(this.baseCstVisitorWithDefaultsConstructor)) {
            const newConstructor = createBaseVisitorConstructorWithDefaults(
                this.className,
                this.allRuleNames,
                this.getBaseCstVisitorConstructor()
            )
            this.baseCstVisitorWithDefaultsConstructor = newConstructor
            return newConstructor
        }

        return <any>this.baseCstVisitorWithDefaultsConstructor
    }

    nestedRuleBeforeClause(
        this: MixedInParser,
        methodOpts: { NAME?: string },
        laKey: number
    ): string {
        let nestedName
        if (methodOpts.NAME !== undefined) {
            nestedName = methodOpts.NAME
            this.nestedRuleInvocationStateUpdate(nestedName, laKey)
            return nestedName
        } else {
            return undefined
        }
    }

    nestedAltBeforeClause(
        this: MixedInParser,
        methodOpts: { NAME?: string },
        occurrence: number,
        methodKeyIdx: number,
        altIdx: number
    ): { shortName?: number; nestedName?: string } {
        let ruleIdx = this.getLastExplicitRuleShortName()
        let shortName = getKeyForAltIndex(
            <any>ruleIdx,
            methodKeyIdx,
            occurrence,
            altIdx
        )
        let nestedName
        if (methodOpts.NAME !== undefined) {
            nestedName = methodOpts.NAME
            this.nestedRuleInvocationStateUpdate(nestedName, shortName)
            return {
                shortName,
                nestedName
            }
        } else {
            return undefined
        }
    }

    nestedRuleFinallyClause(
        this: MixedInParser,
        laKey: number,
        nestedName: string
    ): void {
        let cstStack = this.CST_STACK
        let nestedRuleCst = cstStack[cstStack.length - 1]
        this.nestedRuleFinallyStateUpdate()
        // this return a different result than the previous invocation because "nestedRuleFinallyStateUpdate" pops the cst stack
        let parentCstNode = cstStack[cstStack.length - 1]
        addNoneTerminalToCst(parentCstNode, nestedName, nestedRuleCst)
        this.setNodeLocationFromNode(
            parentCstNode.location,
            nestedRuleCst.location
        )
    }

    getLastExplicitRuleShortName(this: MixedInParser): string {
        let lastExplictIndex = this.LAST_EXPLICIT_RULE_STACK[
            this.LAST_EXPLICIT_RULE_STACK.length - 1
        ]
        return this.RULE_STACK[lastExplictIndex]
    }

    getLastExplicitRuleShortNameNoCst(this: MixedInParser): string {
        let ruleStack = this.RULE_STACK
        return ruleStack[ruleStack.length - 1]
    }

    getPreviousExplicitRuleShortName(this: MixedInParser): string {
        let lastExplicitIndex = this.LAST_EXPLICIT_RULE_STACK[
            this.LAST_EXPLICIT_RULE_STACK.length - 2
        ]
        return this.RULE_STACK[lastExplicitIndex]
    }

    getPreviousExplicitRuleShortNameNoCst(this: MixedInParser): string {
        let ruleStack = this.RULE_STACK
        return ruleStack[ruleStack.length - 2]
    }

    getLastExplicitRuleOccurrenceIndex(this: MixedInParser): number {
        let lastExplicitIndex = this.LAST_EXPLICIT_RULE_STACK[
            this.LAST_EXPLICIT_RULE_STACK.length - 1
        ]
        return this.RULE_OCCURRENCE_STACK[lastExplicitIndex]
    }

    getLastExplicitRuleOccurrenceIndexNoCst(this: MixedInParser): number {
        let occurrenceStack = this.RULE_OCCURRENCE_STACK
        return occurrenceStack[occurrenceStack.length - 1]
    }

    nestedRuleInvocationStateUpdate(
        this: MixedInParser,
        nestedRuleName: string,
        shortNameKey: number
    ): void {
        this.RULE_OCCURRENCE_STACK.push(1)
        this.RULE_STACK.push(<any>shortNameKey)
        this.cstNestedInvocationStateUpdate(nestedRuleName, shortNameKey)
    }

    nestedRuleFinallyStateUpdate(this: MixedInParser): void {
        this.RULE_STACK.pop()
        this.RULE_OCCURRENCE_STACK.pop()

        // NOOP when cst is disabled
        this.cstNestedFinallyStateUpdate()
    }
}
