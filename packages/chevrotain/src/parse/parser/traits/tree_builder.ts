import { has, isUndefined, NOOP } from "../../../utils/utils"
import {
    createBaseSemanticVisitorConstructor,
    createBaseVisitorConstructorWithDefaults
} from "../../cst/cst_visitor"
import { CstNode, ICstVisitor, IParserConfig, IToken } from "../../../../api"
import { getKeyForAltIndex } from "../../grammar/keys"
import { MixedInParser } from "./parser_traits"
import { DEFAULT_PARSER_CONFIG } from "../parser"

/**
 * This trait is responsible for the CST building logic.
 */
export class TreeBuilder {
    outputCst: boolean
    cstOrderedChildren: boolean
    CST_STACK: CstNode[]
    baseCstVisitorConstructor: Function
    baseCstVisitorWithDefaultsConstructor: Function
    LAST_EXPLICIT_RULE_STACK: number[]

    initTreeBuilder(this: MixedInParser, config: IParserConfig) {
        this.LAST_EXPLICIT_RULE_STACK = []
        this.CST_STACK = []
        this.outputCst = has(config, "outputCst")
            ? config.outputCst
            : DEFAULT_PARSER_CONFIG.outputCst

        this.cstOrderedChildren = has(config, "cstOrderedChildren")
            ? config.cstOrderedChildren
            : DEFAULT_PARSER_CONFIG.cstOrderedChildren

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
    }

    // CST
    cstNestedInvocationStateUpdate(
        this: MixedInParser,
        nestedName: string,
        shortName: string | number
    ): void {
        const newCstNode: any = {
            name: nestedName,
            fullName:
                this.shortRuleNameToFull.get(
                    this.getLastExplicitRuleShortName()
                ) + nestedName,
            children: {}
        }

        if (this.cstOrderedChildren === true) {
            newCstNode.orderedChildren = []
        }

        this.CST_STACK.push(newCstNode)
    }

    cstInvocationStateUpdate(
        this: MixedInParser,
        fullRuleName: string,
        shortName: string | number
    ): void {
        this.LAST_EXPLICIT_RULE_STACK.push(this.RULE_STACK.length - 1)

        const newCstNode: any = {
            name: fullRuleName,
            children: {}
        }

        if (this.cstOrderedChildren === true) {
            newCstNode.orderedChildren = []
        }

        this.CST_STACK.push(newCstNode)
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
        this.addTerminalToCst(consumedToken, key)
    }

    cstPostNonTerminal(
        this: MixedInParser,
        ruleCstResult: CstNode,
        ruleName: string
    ): void {
        this.addNoneTerminalToCst(ruleName, ruleCstResult)
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
        this.addNoneTerminalToCst(nestedName, nestedRuleCst)
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

    addTerminalToCst(token: IToken, tokenTypeName: string): void {
        let rootCst = this.CST_STACK[this.CST_STACK.length - 1]

        if (rootCst.children[tokenTypeName] === undefined) {
            rootCst.children[tokenTypeName] = [token]
        } else {
            rootCst.children[tokenTypeName].push(token)
        }

        if (this.cstOrderedChildren === true) {
            rootCst.orderedChildren.push(token)
        }
    }

    addNoneTerminalToCst(ruleName: string, ruleResult: any): void {
        let rootCst = this.CST_STACK[this.CST_STACK.length - 1]
        if (rootCst.children[ruleName] === undefined) {
            rootCst.children[ruleName] = [ruleResult]
        } else {
            rootCst.children[ruleName].push(ruleResult)
        }

        if (this.cstOrderedChildren === true) {
            rootCst.orderedChildren.push(ruleResult)
        }
    }
}
