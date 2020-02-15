import {
  addNoneTerminalToCst,
  addTerminalToCst,
  setNodeLocationFull,
  setNodeLocationOnlyOffset
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
  nodeLocationTrackingOptions
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

  // dynamically assigned Methods
  setNodeLocationFromNode: (
    nodeLocation: CstNodeLocation,
    locationInformation: CstNodeLocation
  ) => void
  setNodeLocationFromToken: (
    nodeLocation: CstNodeLocation,
    locationInformation: CstNodeLocation
  ) => void
  cstPostRule: (this: MixedInParser, ruleCstNode: CstNode) => void

  setInitialNodeLocation: (cstNode: CstNode) => void
  nodeLocationTracking: nodeLocationTrackingOptions

  initTreeBuilder(this: MixedInParser, config: IParserConfig) {
    this.LAST_EXPLICIT_RULE_STACK = []
    this.CST_STACK = []

    // outputCst is no longer exposed/defined in the pubic API
    this.outputCst = (config as any).outputCst

    this.nodeLocationTracking = has(config, "nodeLocationTracking")
      ? config.nodeLocationTracking
      : DEFAULT_PARSER_CONFIG.nodeLocationTracking

    if (!this.outputCst) {
      this.cstInvocationStateUpdate = NOOP
      this.cstFinallyStateUpdate = NOOP
      this.cstPostTerminal = NOOP
      this.cstPostNonTerminal = NOOP
      this.cstPostRule = NOOP
      this.getLastExplicitRuleShortName = this.getLastExplicitRuleShortNameNoCst
      this.getPreviousExplicitRuleShortName = this.getPreviousExplicitRuleShortNameNoCst
      this.getLastExplicitRuleOccurrenceIndex = this.getLastExplicitRuleOccurrenceIndexNoCst
      this.manyInternal = this.manyInternalNoCst
      this.orInternal = this.orInternalNoCst
      this.optionInternal = this.optionInternalNoCst
      this.atLeastOneInternal = this.atLeastOneInternalNoCst
      this.manySepFirstInternal = this.manySepFirstInternalNoCst
      this.atLeastOneSepFirstInternal = this.atLeastOneSepFirstInternalNoCst
    } else {
      if (/full/i.test(this.nodeLocationTracking)) {
        if (this.recoveryEnabled) {
          this.setNodeLocationFromToken = setNodeLocationFull
          this.setNodeLocationFromNode = setNodeLocationFull
          this.cstPostRule = NOOP
          this.setInitialNodeLocation = this.setInitialNodeLocationFullRecovery
        } else {
          this.setNodeLocationFromToken = NOOP
          this.setNodeLocationFromNode = NOOP
          this.cstPostRule = this.cstPostRuleFull
          this.setInitialNodeLocation = this.setInitialNodeLocationFullRegular
        }
      } else if (/onlyOffset/i.test(this.nodeLocationTracking)) {
        if (this.recoveryEnabled) {
          this.setNodeLocationFromToken = <any>setNodeLocationOnlyOffset
          this.setNodeLocationFromNode = <any>setNodeLocationOnlyOffset
          this.cstPostRule = NOOP
          this.setInitialNodeLocation = this.setInitialNodeLocationOnlyOffsetRecovery
        } else {
          this.setNodeLocationFromToken = NOOP
          this.setNodeLocationFromNode = NOOP
          this.cstPostRule = this.cstPostRuleOnlyOffset
          this.setInitialNodeLocation = this.setInitialNodeLocationOnlyOffsetRegular
        }
      } else if (/none/i.test(this.nodeLocationTracking)) {
        this.setNodeLocationFromToken = NOOP
        this.setNodeLocationFromNode = NOOP
        this.cstPostRule = NOOP
        this.setInitialNodeLocation = NOOP
      } else {
        throw Error(
          `Invalid <nodeLocationTracking> config option: "${config.nodeLocationTracking}"`
        )
      }
    }
  }

  setInitialNodeLocationOnlyOffsetRecovery(
    this: MixedInParser,
    cstNode: any
  ): void {
    cstNode.location = {
      startOffset: NaN,
      endOffset: NaN
    }
  }

  setInitialNodeLocationOnlyOffsetRegular(
    this: MixedInParser,
    cstNode: any
  ): void {
    cstNode.location = {
      // without error recovery the starting Location of a new CstNode is guaranteed
      // To be the next Token's startOffset (for valid inputs).
      // For invalid inputs there won't be any CSTOutput so this potential
      // inaccuracy does not matter
      startOffset: this.LA(1).startOffset,
      endOffset: NaN
    }
  }

  setInitialNodeLocationFullRecovery(this: MixedInParser, cstNode: any): void {
    cstNode.location = {
      startOffset: NaN,
      startLine: NaN,
      startColumn: NaN,
      endOffset: NaN,
      endLine: NaN,
      endColumn: NaN
    }
  }

  /**
     *  @see setInitialNodeLocationOnlyOffsetRegular for explanation why this work

     * @param cstNode
     */
  setInitialNodeLocationFullRegular(this: MixedInParser, cstNode: any): void {
    const nextToken = this.LA(1)
    cstNode.location = {
      startOffset: nextToken.startOffset,
      startLine: nextToken.startLine,
      startColumn: nextToken.startColumn,
      endOffset: NaN,
      endLine: NaN,
      endColumn: NaN
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
        this.shortRuleNameToFull[this.getLastExplicitRuleShortName()] +
        nestedName,
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
    const lastCstNode = this.CST_STACK.pop()
    // TODO: the naming is bad, this should go directly to the
    //       (correct) cstLocation update method
    //       e.g if we put other logic in postRule...
    this.cstPostRule(lastCstNode)
  }

  cstPostRuleFull(this: MixedInParser, ruleCstNode: CstNode): void {
    const prevToken = this.LA(0)
    const loc = ruleCstNode.location

    // If this condition is true it means we consumed at least one Token
    // In this CstNode or its nested children.
    if (loc.startOffset <= prevToken.startOffset === true) {
      loc.endOffset = prevToken.endOffset
      loc.endLine = prevToken.endLine
      loc.endColumn = prevToken.endColumn
    }
    // "empty" CstNode edge case
    else {
      loc.startOffset = NaN
      loc.startLine = NaN
      loc.startColumn = NaN
    }
  }

  cstPostRuleOnlyOffset(this: MixedInParser, ruleCstNode: CstNode): void {
    const prevToken = this.LA(0)
    const loc = ruleCstNode.location

    // If this condition is true it means we consumed at least one Token
    // In this CstNode or its nested children.
    if (loc.startOffset <= prevToken.startOffset === true) {
      loc.endOffset = prevToken.endOffset
    }
    // "empty" CstNode edge case
    else {
      loc.startOffset = NaN
    }
  }

  cstPostTerminal(
    this: MixedInParser,
    key: string,
    consumedToken: IToken
  ): void {
    const rootCst = this.CST_STACK[this.CST_STACK.length - 1]
    addTerminalToCst(rootCst, consumedToken, key)
    // This is only used when **both** error recovery and CST Output are enabled.
    this.setNodeLocationFromToken(rootCst.location, <any>consumedToken)
  }

  cstPostNonTerminal(
    this: MixedInParser,
    ruleCstResult: CstNode,
    ruleName: string
  ): void {
    // Avoid side effects due to back tracking
    // TODO: This costs a 2-3% in performance, A flag on IParserConfig
    //   could be used to get rid of this conditional, but not sure its worth the effort
    //   and API complexity.
    if (this.isBackTracking() !== true) {
      const preCstNode = this.CST_STACK[this.CST_STACK.length - 1]
      addNoneTerminalToCst(preCstNode, ruleName, ruleCstResult)
      // This is only used when **both** error recovery and CST Output are enabled.
      this.setNodeLocationFromNode(preCstNode.location, ruleCstResult.location)
    }
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
    this.setNodeLocationFromNode(parentCstNode.location, nestedRuleCst.location)
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
