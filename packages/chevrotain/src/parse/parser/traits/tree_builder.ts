import {
  addNoneTerminalToCst,
  addTerminalToCst,
  setNodeLocationFull,
  setNodeLocationOnlyOffset,
} from "../../cst/cst.js";
import {
  createBaseSemanticVisitorConstructor,
  createBaseVisitorConstructorWithDefaults,
} from "../../cst/cst_visitor.js";
import {
  CstNode,
  CstNodeLocation,
  ICstVisitor,
  IParserConfig,
  IToken,
  nodeLocationTrackingOptions,
} from "@chevrotain/types";

/**
 * Fixed-shape CstNode factory. Pre-declaring all fields — including the
 * optional `recoveredNode` and `location` — ensures every CstNode object
 * shares a single V8 hidden class from birth, keeping call sites that read
 * these fields monomorphic.
 */
function createCstNode(name: string): CstNode {
  // Pre-declare `location` as undefined so that setInitialNodeLocation()
  // assigns to an existing property rather than adding one — no hidden-class
  // transition after construction. `recoveredNode` is left absent (matches the
  // public type's optional contract and existing test expectations).
  return {
    name,
    children: Object.create(null),
    location: undefined,
  } as unknown as CstNode; // cast: location is readonly in the public type
}

/**
 * Fixed-shape CstNodeLocation factories — one per location-tracking mode.
 * All objects within a mode have identical property sets, giving them the
 * same V8 hidden class and keeping property-read call sites monomorphic.
 *
 * Two distinct shapes are intentional: onlyOffset consumers expect only
 * {startOffset, endOffset}; full consumers expect all six fields.
 */
function createCstLocationOnlyOffset(): CstNodeLocation {
  return { startOffset: NaN, endOffset: NaN } as CstNodeLocation;
}

function createCstLocationFull(): CstNodeLocation {
  return {
    startOffset: NaN,
    startLine: NaN,
    startColumn: NaN,
    endOffset: NaN,
    endLine: NaN,
    endColumn: NaN,
  };
}
import { MixedInParser } from "./parser_traits.js";
import { DEFAULT_PARSER_CONFIG } from "../parser.js";

/**
 * Watermark snapshot of a CST node's mutable state taken before a
 * non-speculative parse attempt that may fail (OPTION, AT_LEAST_ONE, OR
 * committed fast-path). Stores each existing child array's length so that
 * restoreCheckpoint() can truncate — no .slice() copies, no new objects.
 *
 * Keys added during a failed attempt end up as empty arrays on the children
 * object; that is semantically equivalent to absent for any CST consumer
 * that checks .length. Deleting them would cause hidden-class transitions,
 * so we leave them as [].
 */
export interface CstTopSave {
  /** Parallel arrays: child key name → pre-attempt array length. */
  keys: string[];
  lens: number[];
  location: Record<string, number> | undefined;
}

/**
 * This trait is responsible for the CST building logic.
 */
export class TreeBuilder {
  outputCst: boolean;
  CST_STACK: CstNode[];
  baseCstVisitorConstructor: Function;
  baseCstVisitorWithDefaultsConstructor: Function;

  // dynamically assigned Methods
  setNodeLocationFromNode: (
    nodeLocation: CstNodeLocation,
    locationInformation: CstNodeLocation,
  ) => void;
  setNodeLocationFromToken: (
    nodeLocation: CstNodeLocation,
    locationInformation: CstNodeLocation,
  ) => void;
  cstPostRule: (this: MixedInParser, ruleCstNode: CstNode) => void;

  setInitialNodeLocation: (cstNode: CstNode) => void;
  nodeLocationTracking: nodeLocationTrackingOptions;

  /**
   * Saves a snapshot of the current top CST node's mutable state before a
   * speculative parse attempt. Dynamically dispatched — NOOP when outputCst = false.
   * @see saveCheckpointImpl for the real implementation.
   */
  saveCheckpoint: (this: MixedInParser) => CstTopSave | null;

  /**
   * Restores the top CST node to a previously saved snapshot, undoing any
   * terminal/non-terminal additions from a failed speculative attempt.
   * Dynamically dispatched — NOOP when outputCst = false.
   * @see restoreCheckpointImpl for the real implementation.
   */
  restoreCheckpoint: (this: MixedInParser, save: CstTopSave | null) => void;

  initTreeBuilder(this: MixedInParser, config: IParserConfig) {
    this.CST_STACK = [];

    // outputCst is no longer exposed/defined in the pubic API
    this.outputCst = (config as any).outputCst;

    this.nodeLocationTracking = Object.hasOwn(config, "nodeLocationTracking")
      ? (config.nodeLocationTracking as nodeLocationTrackingOptions) // assumes end user provides the correct config value/type
      : DEFAULT_PARSER_CONFIG.nodeLocationTracking;

    if (!this.outputCst) {
      this.cstInvocationStateUpdate = () => {};
      this.cstFinallyStateUpdate = () => {};
      this.cstPostTerminal = () => {};
      this.cstPostNonTerminal = () => {};
      this.cstPostRule = () => {};
      this.saveCheckpoint = () => null;
      this.restoreCheckpoint = () => {};
    } else {
      if (/full/i.test(this.nodeLocationTracking)) {
        if (this.recoveryEnabled) {
          this.setNodeLocationFromToken = setNodeLocationFull;
          this.setNodeLocationFromNode = setNodeLocationFull;
          this.cstPostRule = () => {};
          this.setInitialNodeLocation = this.setInitialNodeLocationFullRecovery;
        } else {
          this.setNodeLocationFromToken = () => {};
          this.setNodeLocationFromNode = () => {};
          this.cstPostRule = this.cstPostRuleFull;
          this.setInitialNodeLocation = this.setInitialNodeLocationFullRegular;
        }
      } else if (/onlyOffset/i.test(this.nodeLocationTracking)) {
        if (this.recoveryEnabled) {
          this.setNodeLocationFromToken = <any>setNodeLocationOnlyOffset;
          this.setNodeLocationFromNode = <any>setNodeLocationOnlyOffset;
          this.cstPostRule = () => {};
          this.setInitialNodeLocation =
            this.setInitialNodeLocationOnlyOffsetRecovery;
        } else {
          this.setNodeLocationFromToken = () => {};
          this.setNodeLocationFromNode = () => {};
          this.cstPostRule = this.cstPostRuleOnlyOffset;
          this.setInitialNodeLocation =
            this.setInitialNodeLocationOnlyOffsetRegular;
        }
      } else if (/none/i.test(this.nodeLocationTracking)) {
        this.setNodeLocationFromToken = () => {};
        this.setNodeLocationFromNode = () => {};
        this.cstPostRule = () => {};
        this.setInitialNodeLocation = () => {};
      } else {
        throw Error(
          `Invalid <nodeLocationTracking> config option: "${config.nodeLocationTracking}"`,
        );
      }
      // CST watermark helpers are class methods — no assignment needed.
    }
  }

  setInitialNodeLocationOnlyOffsetRecovery(
    this: MixedInParser,
    cstNode: any,
  ): void {
    cstNode.location = createCstLocationOnlyOffset();
  }

  setInitialNodeLocationOnlyOffsetRegular(
    this: MixedInParser,
    cstNode: any,
  ): void {
    // Without error recovery the starting Location of a new CstNode is guaranteed
    // to be the next Token's startOffset (for valid inputs).
    // For invalid inputs there won't be any CSTOutput so this potential
    // inaccuracy does not matter.
    const loc = createCstLocationOnlyOffset();
    loc.startOffset = this.LA_FAST(1).startOffset;
    cstNode.location = loc;
  }

  setInitialNodeLocationFullRecovery(this: MixedInParser, cstNode: any): void {
    cstNode.location = createCstLocationFull();
  }

  /** @see setInitialNodeLocationOnlyOffsetRegular for explanation why this works */
  setInitialNodeLocationFullRegular(this: MixedInParser, cstNode: any): void {
    const nextToken = this.LA_FAST(1);
    const loc = createCstLocationFull();
    loc.startOffset = nextToken.startOffset;
    loc.startLine = nextToken.startLine;
    loc.startColumn = nextToken.startColumn;
    cstNode.location = loc;
  }

  cstInvocationStateUpdate(this: MixedInParser, fullRuleName: string): void {
    const cstNode = createCstNode(fullRuleName);
    this.setInitialNodeLocation(cstNode);
    this.CST_STACK.push(cstNode);
  }

  cstFinallyStateUpdate(this: MixedInParser): void {
    this.CST_STACK.pop();
  }

  cstPostRuleFull(this: MixedInParser, ruleCstNode: CstNode): void {
    // casts to `required<CstNodeLocation>` are safe because `cstPostRuleFull` should only be invoked when full location is enabled
    // TODO(perf): can we replace this with LA_FAST?
    //       edge case is the empty CstNode on first rule invocation.
    //       perhaps create a test case to verify correctness of LA vs LA_FAST in this scenario?
    const prevToken = this.LA(0) as Required<CstNodeLocation>;
    const loc = ruleCstNode.location as Required<CstNodeLocation>;

    // If this condition is true it means we consumed at least one Token
    // In this CstNode.
    if (loc.startOffset <= prevToken.startOffset === true) {
      loc.endOffset = prevToken.endOffset;
      loc.endLine = prevToken.endLine;
      loc.endColumn = prevToken.endColumn;
    }
    // "empty" CstNode edge case
    else {
      loc.startOffset = NaN;
      loc.startLine = NaN;
      loc.startColumn = NaN;
    }
  }

  cstPostRuleOnlyOffset(this: MixedInParser, ruleCstNode: CstNode): void {
    // TODO: can we replace this with LA_FAST? see comment in `cstPostRuleFull()`
    const prevToken = this.LA(0);
    // `location' is not null because `cstPostRuleOnlyOffset` will only be invoked when location tracking is enabled.
    const loc = ruleCstNode.location!;

    // If this condition is true it means we consumed at least one Token
    // In this CstNode.
    if (loc.startOffset <= prevToken.startOffset === true) {
      loc.endOffset = prevToken.endOffset;
    }
    // "empty" CstNode edge case
    else {
      loc.startOffset = NaN;
    }
  }

  cstPostTerminal(
    this: MixedInParser,
    key: string,
    consumedToken: IToken,
  ): void {
    const rootCst = this.CST_STACK[this.CST_STACK.length - 1];
    addTerminalToCst(rootCst, consumedToken, key);
    // This is only used when **both** error recovery and CST Output are enabled.
    this.setNodeLocationFromToken(rootCst.location!, <any>consumedToken);
  }

  cstPostNonTerminal(
    this: MixedInParser,
    ruleCstResult: CstNode,
    ruleName: string,
  ): void {
    const preCstNode = this.CST_STACK[this.CST_STACK.length - 1];
    addNoneTerminalToCst(preCstNode, ruleName, ruleCstResult);
    // This is only used when **both** error recovery and CST Output are enabled.
    this.setNodeLocationFromNode(preCstNode.location!, ruleCstResult.location!);
  }

  /**
   * Real implementation of saveCheckpoint. Records the length of each child array
   * already on the top CST node — O(k) reads, zero allocations beyond the
   * small watermark object itself. No .slice() copies.
   *
   * Stage 3 guards skip all CST mutations while IS_SPECULATING=true, so
   * the top node is always unchanged during speculation — nothing to save.
   */
  saveCheckpointImpl(this: MixedInParser): CstTopSave | null {
    if (this.IS_SPECULATING) return null;
    const top = this.CST_STACK[this.CST_STACK.length - 1];
    if (top === undefined) return null;
    const src = top.children;
    const srcKeys = Object.keys(src);
    const keys: string[] = new Array(srcKeys.length);
    const lens: number[] = new Array(srcKeys.length);
    for (let i = 0; i < srcKeys.length; i++) {
      keys[i] = srcKeys[i];
      lens[i] = src[srcKeys[i]].length;
    }
    return {
      keys,
      lens,
      location:
        top.location !== undefined
          ? ({ ...top.location } as Record<string, number>)
          : undefined,
    };
  }

  /**
   * Real implementation of restoreCheckpoint. Truncates each child array back to
   * its pre-attempt length via .length = savedLen — no object replacement,
   * no hidden-class transitions. Keys added by the failed attempt remain as
   * empty arrays (semantically identical to absent for .length-checking consumers).
   */
  restoreCheckpointImpl(this: MixedInParser, save: CstTopSave | null): void {
    if (save === null) return;
    const top = this.CST_STACK[this.CST_STACK.length - 1];
    if (top === undefined) return;
    const { keys, lens } = save;
    const ch = top.children;
    for (let i = 0; i < keys.length; i++) {
      ch[keys[i]].length = lens[i];
    }
    if (save.location !== undefined) {
      (top as any).location = save.location;
    }
  }

  getBaseCstVisitorConstructor<IN = any, OUT = any>(
    this: MixedInParser,
  ): {
    new (...args: any[]): ICstVisitor<IN, OUT>;
  } {
    if (this.baseCstVisitorConstructor === undefined) {
      const newBaseCstVisitorConstructor = createBaseSemanticVisitorConstructor(
        this.className,
        this.definedRulesNames,
      );
      this.baseCstVisitorConstructor = newBaseCstVisitorConstructor;
      return newBaseCstVisitorConstructor;
    }

    return <any>this.baseCstVisitorConstructor;
  }

  getBaseCstVisitorConstructorWithDefaults<IN = any, OUT = any>(
    this: MixedInParser,
  ): {
    new (...args: any[]): ICstVisitor<IN, OUT>;
  } {
    if (this.baseCstVisitorWithDefaultsConstructor === undefined) {
      const newConstructor = createBaseVisitorConstructorWithDefaults(
        this.className,
        this.definedRulesNames,
        this.getBaseCstVisitorConstructor(),
      );
      this.baseCstVisitorWithDefaultsConstructor = newConstructor;
      return newConstructor;
    }

    return <any>this.baseCstVisitorWithDefaultsConstructor;
  }

  getPreviousExplicitRuleShortName(this: MixedInParser): number {
    return this.RULE_STACK[this.RULE_STACK_IDX - 1];
  }

  getLastExplicitRuleOccurrenceIndex(this: MixedInParser): number {
    return this.RULE_OCCURRENCE_STACK[this.RULE_STACK_IDX];
  }
}
