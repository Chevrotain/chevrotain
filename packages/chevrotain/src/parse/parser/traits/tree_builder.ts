import {
  addNoneTerminalToCst,
  addTerminalToCst,
  setNodeLocationFull,
  setNodeLocationOnlyOffset
} from "../../cst/cst"
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
} from "@chevrotain/types"
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
    this.CST_STACK = []

    // outputCst is no longer exposed/defined in the pubic API
    this.outputCst = (config as any).outputCst

    this.nodeLocationTracking =
      config.nodeLocationTracking ?? DEFAULT_PARSER_CONFIG.nodeLocationTracking

    if (!this.outputCst) {
      this.cstInvocationStateUpdate = () => {}
      this.cstFinallyStateUpdate = () => {}
      this.cstPostTerminal = () => {}
      this.cstPostNonTerminal = () => {}
      this.cstPostRule = () => {}
    } else {
      if (/full/i.test(this.nodeLocationTracking)) {
        if (this.recoveryEnabled) {
          this.setNodeLocationFromToken = setNodeLocationFull
          this.setNodeLocationFromNode = setNodeLocationFull
          this.cstPostRule = () => {}
          this.setInitialNodeLocation = this.setInitialNodeLocationFullRecovery
        } else {
          this.setNodeLocationFromToken = () => {}
          this.setNodeLocationFromNode = () => {}
          this.cstPostRule = this.cstPostRuleFull
          this.setInitialNodeLocation = this.setInitialNodeLocationFullRegular
        }
      } else if (/onlyOffset/i.test(this.nodeLocationTracking)) {
        if (this.recoveryEnabled) {
          this.setNodeLocationFromToken = <any>setNodeLocationOnlyOffset
          this.setNodeLocationFromNode = <any>setNodeLocationOnlyOffset
          this.cstPostRule = () => {}
          this.setInitialNodeLocation =
            this.setInitialNodeLocationOnlyOffsetRecovery
        } else {
          this.setNodeLocationFromToken = () => {}
          this.setNodeLocationFromNode = () => {}
          this.cstPostRule = this.cstPostRuleOnlyOffset
          this.setInitialNodeLocation =
            this.setInitialNodeLocationOnlyOffsetRegular
        }
      } else if (/none/i.test(this.nodeLocationTracking)) {
        this.setNodeLocationFromToken = () => {}
        this.setNodeLocationFromNode = () => {}
        this.cstPostRule = () => {}
        this.setInitialNodeLocation = () => {}
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

  cstInvocationStateUpdate(this: MixedInParser, fullRuleName: string): void {
    const cstNode: CstNode = {
      name: fullRuleName,
      children: Object.create(null)
    }

    this.setInitialNodeLocation(cstNode)
    this.CST_STACK.push(cstNode)
  }

  cstFinallyStateUpdate(this: MixedInParser): void {
    this.CST_STACK.pop()
  }

  cstPostRuleFull(this: MixedInParser, ruleCstNode: CstNode): void {
    // casts to `required<CstNodeLocation>` are safe because `cstPostRuleFull` should only be invoked when full location is enabled
    const prevToken = this.LA(0) as Required<CstNodeLocation>
    const loc = ruleCstNode.location as Required<CstNodeLocation>

    // If this condition is true it means we consumed at least one Token
    // In this CstNode.
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
    // `location' is not null because `cstPostRuleOnlyOffset` will only be invoked when location tracking is enabled.
    const loc = ruleCstNode.location!

    // If this condition is true it means we consumed at least one Token
    // In this CstNode.
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
    this.setNodeLocationFromToken(rootCst.location!, <any>consumedToken)
  }

  cstPostNonTerminal(
    this: MixedInParser,
    ruleCstResult: CstNode,
    ruleName: string
  ): void {
    const preCstNode = this.CST_STACK[this.CST_STACK.length - 1]
    addNoneTerminalToCst(preCstNode, ruleName, ruleCstResult)
    // This is only used when **both** error recovery and CST Output are enabled.
    this.setNodeLocationFromNode(preCstNode.location!, ruleCstResult.location!)
  }

  getBaseCstVisitorConstructor<IN = any, OUT = any>(
    this: MixedInParser
  ): {
    new (...args: any[]): ICstVisitor<IN, OUT>
  } {
    if (this.baseCstVisitorConstructor === undefined) {
      const newBaseCstVisitorConstructor = createBaseSemanticVisitorConstructor(
        this.className,
        Object.keys(this.gastProductionsCache)
      )
      this.baseCstVisitorConstructor = newBaseCstVisitorConstructor
      return newBaseCstVisitorConstructor
    }

    return <any>this.baseCstVisitorConstructor
  }

  getBaseCstVisitorConstructorWithDefaults<IN = any, OUT = any>(
    this: MixedInParser
  ): {
    new (...args: any[]): ICstVisitor<IN, OUT>
  } {
    if (this.baseCstVisitorWithDefaultsConstructor === undefined) {
      const newConstructor = createBaseVisitorConstructorWithDefaults(
        this.className,
        Object.keys(this.gastProductionsCache),
        this.getBaseCstVisitorConstructor()
      )
      this.baseCstVisitorWithDefaultsConstructor = newConstructor
      return newConstructor
    }

    return <any>this.baseCstVisitorWithDefaultsConstructor
  }

  getLastExplicitRuleShortName(this: MixedInParser): number {
    const ruleStack = this.RULE_STACK
    return ruleStack[ruleStack.length - 1]
  }

  getPreviousExplicitRuleShortName(this: MixedInParser): number {
    const ruleStack = this.RULE_STACK
    return ruleStack[ruleStack.length - 2]
  }

  getLastExplicitRuleOccurrenceIndex(this: MixedInParser): number {
    const occurrenceStack = this.RULE_OCCURRENCE_STACK
    return occurrenceStack[occurrenceStack.length - 1]
  }
}
