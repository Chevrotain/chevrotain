import {
  AtLeastOneSepMethodOpts,
  ConsumeMethodOpts,
  DSLMethodOpts,
  DSLMethodOptsWithErr,
  GrammarAction,
  IOrAlt,
  IParserConfig,
  IRuleConfig,
  IToken,
  ManySepMethodOpts,
  OrMethodOpts,
  ParserMethod,
  SubruleMethodOpts,
  TokenType,
  TokenTypeDictionary,
  TokenVocabulary,
} from "@chevrotain/types";

import {
  AT_LEAST_ONE_IDX,
  AT_LEAST_ONE_SEP_IDX,
  BITS_FOR_METHOD_TYPE,
  BITS_FOR_OCCURRENCE_IDX,
  MANY_IDX,
  MANY_SEP_IDX,
} from "../../grammar/keys.js";
import {
  isRecognitionException,
  MismatchedTokenException,
  NotAllInputParsedException,
} from "../../exceptions_public.js";
import { PROD_TYPE } from "../../grammar/lookahead.js";
import {
  AbstractNextTerminalAfterProductionWalker,
  NextTerminalAfterAtLeastOneSepWalker,
  NextTerminalAfterAtLeastOneWalker,
  NextTerminalAfterManySepWalker,
  NextTerminalAfterManyWalker,
} from "../../grammar/interpreter.js";
import {
  DEFAULT_RULE_CONFIG,
  END_OF_FILE,
  IN_RULE_RECOVERY_EXCEPTION,
  TokenMatcher,
} from "../parser.js";
import { EOF } from "../../../scan/tokens_public.js";
import { MixedInParser } from "./parser_traits.js";
import {
  augmentTokenTypes,
  isTokenType,
  tokenStructuredMatcher,
  tokenStructuredMatcherNoCategories,
} from "../../../scan/tokens.js";
import { Rule } from "@chevrotain/gast";
import { ParserMethodInternal } from "../types.js";

// SPEC_FAIL is now defined in parser.ts; re-export for backward compat.
export { SPEC_FAIL } from "../parser.js";
import { SPEC_FAIL } from "../parser.js";

// Entries >= GATED_OFFSET encode "altIdx + GATED_OFFSET" meaning the alt is
// correct but preceding gated alts must be checked first. Decoding is just
// `entry - GATED_OFFSET`. For gate-free grammars all entries are 0-255 so
// the check `>= GATED_OFFSET` is a single integer comparison — zero cost.
export const GATED_OFFSET = 256;

// These absorbed trait sources are retained for reference/type compatibility
// only; runtime behavior now lives in parser.ts. Use a widened `this` type for
// forgiving-only paths so strict parser state does not need to carry these
// fields just to satisfy legacy trait compilation.
type ForgivingMixedInParser = any;

/**
 * Records that `altIdx` matched when LA(1) had `tokenTypeIdx`. When a
 * preceding alt has a GATE, stores `altIdx + GATED_OFFSET` so the fast
 * path knows to check gates adaptively. True ambiguity (two non-gated
 * alts) is marked as -1.
 */
function addOrFastMapEntry(
  orFastMaps: Record<number, Record<number, number>>,
  mapKey: number,
  tokenTypeIdx: number,
  altIdx: number,
  alts: IOrAlt<any>[],
): void {
  let map = orFastMaps[mapKey];
  if (map === undefined) {
    map = Object.create(null);
    orFastMaps[mapKey] = map;
  }
  // Check if any preceding alt has a GATE.
  let hasGatedPredecessor = false;
  for (let g = 0; g < altIdx; g++) {
    if (alts[g].GATE !== undefined) {
      hasGatedPredecessor = true;
      break;
    }
  }
  const encodedAlt = hasGatedPredecessor ? altIdx + GATED_OFFSET : altIdx;
  const existing = map[tokenTypeIdx];
  if (existing === undefined) {
    map[tokenTypeIdx] = encodedAlt;
  } else if (existing >= 0) {
    const existingAlt =
      existing >= GATED_OFFSET ? existing - GATED_OFFSET : existing;
    if (existingAlt !== altIdx) {
      const existingGated = alts[existingAlt].GATE !== undefined;
      const newGated = alts[altIdx].GATE !== undefined;
      if (existingGated && !newGated) {
        map[tokenTypeIdx] = encodedAlt;
      } else if (!existingGated && newGated) {
        // keep existing non-gated, but mark gated if new has predecessor
        if (hasGatedPredecessor && existing < GATED_OFFSET) {
          map[tokenTypeIdx] = existing + GATED_OFFSET;
        }
      } else if (!existingGated && !newGated) {
        map[tokenTypeIdx] = -1; // true ambiguity
      }
    }
  }
}

/**
 * Thrown by `consumeInternal` when `_earlyExitLookahead` is true and a token
 * successfully matches. This aborts the action immediately after the first
 * successful CONSUME, preventing embedded-action side effects from executing
 * inside `makeSpecLookahead`. The caller catches this and returns `true`.
 */
const FIRST_TOKEN_MATCH = Symbol("FIRST_TOKEN_MATCH");

/**
 * This trait is responsible for the runtime parsing engine
 * Used by the official API (recognizer_api.ts)
 */
export class RecognizerEngine {
  /**
   * True while inside a speculative context (BACKTRACK, MANY iteration, OR
   * speculative attempt). When true, CONSUME throws the zero-cost SPEC_FAIL
   * symbol instead of allocating a MismatchedTokenException.
   */
  IS_SPECULATING: boolean;
  /**
   * True only inside an explicit BACKTRACK() call. Unlike IS_SPECULATING (which
   * is also set by MANY/AT_LEAST_ONE iterations and OR speculative attempts),
   * this flag signals that we must NOT commit to any OR alternative even if it
   * made progress — because we are in a pure trial that must be rolled back.
   */
  _isInTrueBacktrack: boolean;
  /** Set to true inside makeSpecLookahead to abort on the first successful CONSUME. */
  _earlyExitLookahead: boolean;
  className: string;
  RULE_STACK: number[];
  RULE_OCCURRENCE_STACK: number[];
  // Depth counters for the pre-allocated state stacks.
  // Using index-based access (arr[++idx] = val / idx--) instead of push/pop
  // avoids method-call overhead on every rule entry/exit.
  RULE_STACK_IDX: number;
  /**
   * Runtime OR call counter — auto-increments per OR call within a rule.
   * Saved/restored on rule entry/exit via _orCounterStack. Gives unique
   * mapKeys for _orFastMaps without requiring numbered variants (OR1, OR2).
   * A single integer is cheaper than array-indexed counters.
   */
  /**
   * Single auto-occurrence counter for ALL DSL methods. Every DSL call
   * (CONSUME, SUBRULE, OR, OPTION, MANY, etc.) increments this counter,
   * giving unique occurrence IDs per call site within a rule. Saved/restored
   * on rule entry/exit. One property access per DSL call — minimal overhead.
   */
  _dslCounter: number;
  _dslCounterStack: number[];
  definedRulesNames: string[];
  tokensMap: { [fqn: string]: TokenType };
  gastProductionsCache: Record<string, Rule>;
  shortRuleNameToFull: Record<string, string>;
  fullRuleNameToShort: Record<string, number>;
  // The shortName Index must be coded "after" the first 8bits to enable building unique lookahead keys
  ruleShortNameIdx: number;
  tokenMatcher: TokenMatcher;
  subruleIdx: number;
  // Cached value of the current rule's short name to avoid repeated RULE_STACK[length-1] lookups.
  // Updated on rule entry/exit and state reload.
  currRuleShortName: number;
  /**
   * Lazy LL(1) fast-dispatch map, keyed by `currRuleShortName | occurrence`.
   * Inner key is `tokenTypeIdx` of the LA(1) token → alt index that matched.
   * Built from observations in the slow path. Direct O(1) lookup, no
   * allocation on the hot path.
   *
   * A value of `-1` means ambiguous (multiple alts observed for this
   * tokenTypeIdx) — fall through to the slow path.
   */
  _orFastMaps: Record<number, Record<number, number>>;
  /**
   * Per-OR set of alt indices whose first-token set is gate-dependent
   * (they have a gated OPTION/MANY/AT_LEAST_ONE before their first CONSUME).
   * Keyed by the same mapKey as _orFastMaps. These alts must always be
   * speculated on the fast path — they cannot be cached by LA(1) alone.
   */
  _orGatedPrefixAlts: Record<number, number[]>;
  /**
   * Per-OR _dslCounter advance amount. When `_dslCounter` is shared across
   * all DSL methods, each OR alternative may contain a different number of
   * DSL calls. During recording ALL alternatives are walked sequentially, but
   * at runtime only ONE is chosen. To keep `_dslCounter` deterministic (same
   * value regardless of which alt is taken), we record the total counter delta
   * across all alternatives. At runtime, after executing the chosen alt,
   * `_dslCounter` is advanced to `savedCounter + totalDelta` so subsequent
   * DSL calls always receive the same occurrence index.
   * Keyed by the same mapKey (`currRuleShortName | orOccurrence`).
   */
  _orCounterDeltas: Record<number, number>;
  /**
   * Per-OR per-alt counter starting offsets. During recording, each alt
   * runs sequentially, so alt i starts at `savedCounter + sum(deltas[0..i-1])`.
   * At runtime, before executing alt i, `_dslCounter` is set to
   * `savedCounter + _orAltCounterStarts[mapKey][i]`.
   */
  _orAltCounterStarts: Record<number, number[]>;
  /**
   * Set during an OR alt's speculative execution. Records the lexer position
   * at the start of the alt so that gated productions (OPTION, MANY, etc.)
   * can detect whether they are executing before the first CONSUME.
   */
  _orAltStartLexPos: number;
  /**
   * Set to true when a gated production (OPTION/MANY/AT_LEAST_ONE with GATE)
   * is encountered before the first CONSUME in an OR alt. When true, the alt
   * must not be added to the fast-dispatch candidate list because its
   * first-token set depends on gate state.
   */
  _orAltHasGatedPrefix: boolean;

  initRecognizerEngine(
    tokenVocabulary: TokenVocabulary,
    config: IParserConfig,
  ) {
    this.className = this.constructor.name;
    // TODO: would using an ES6 Map or plain object be faster (CST building scenario)
    this.shortRuleNameToFull = {};
    this.fullRuleNameToShort = {};
    this.ruleShortNameIdx = 256;
    this.tokenMatcher = tokenStructuredMatcherNoCategories;
    this.subruleIdx = 0;
    this.currRuleShortName = 0;
    this.IS_SPECULATING = false;
    this._isInTrueBacktrack = false;
    this._earlyExitLookahead = false;
    this._orFastMaps = Object.create(null);
    this._orGatedPrefixAlts = Object.create(null);
    this._orCounterDeltas = Object.create(null);
    this._orAltCounterStarts = Object.create(null);
    this._orAltStartLexPos = 0;
    this._orAltHasGatedPrefix = false;

    this.definedRulesNames = [];
    this.tokensMap = {};
    this.RULE_STACK = [];
    this.RULE_STACK_IDX = -1;
    this.RULE_OCCURRENCE_STACK = [];
    this._dslCounter = 0;
    this._dslCounterStack = [];
    this.gastProductionsCache = {};

    if (Object.hasOwn(config, "serializedGrammar")) {
      throw Error(
        "The Parser's configuration can no longer contain a <serializedGrammar> property.\n" +
          "\tSee: https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_6-0-0\n" +
          "\tFor Further details.",
      );
    }

    if (Array.isArray(tokenVocabulary)) {
      // This only checks for Token vocabularies provided as arrays.
      // That is good enough because the main objective is to detect users of pre-V4.0 APIs
      // rather than all edge cases of empty Token vocabularies.
      if ((tokenVocabulary as any[]).length === 0) {
        throw Error(
          "A Token Vocabulary cannot be empty.\n" +
            "\tNote that the first argument for the parser constructor\n" +
            "\tis no longer a Token vector (since v4.0).",
        );
      }

      if (typeof (tokenVocabulary as any[])[0].startOffset === "number") {
        throw Error(
          "The Parser constructor no longer accepts a token vector as the first argument.\n" +
            "\tSee: https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_4-0-0\n" +
            "\tFor Further details.",
        );
      }
    }

    if (Array.isArray(tokenVocabulary)) {
      this.tokensMap = (tokenVocabulary as TokenType[]).reduce(
        (acc: { [tokenName: string]: TokenType }, tokType: TokenType) => {
          acc[tokType.name] = tokType;
          return acc;
        },
        {} as { [tokenName: string]: TokenType },
      );
    } else if (
      Object.hasOwn(tokenVocabulary, "modes") &&
      (Object.values((<any>tokenVocabulary).modes) as any[][])
        .flat()
        .every(isTokenType)
    ) {
      const allTokenTypes = (
        Object.values((<any>tokenVocabulary).modes) as any[][]
      ).flat();
      const uniqueTokens = [...new Set(allTokenTypes)];
      this.tokensMap = <any>uniqueTokens.reduce(
        (acc: { [tokenName: string]: TokenType }, tokType: TokenType) => {
          acc[tokType.name] = tokType;
          return acc;
        },
        {} as { [tokenName: string]: TokenType },
      );
    } else if (
      typeof tokenVocabulary === "object" &&
      tokenVocabulary !== null
    ) {
      this.tokensMap = { ...(tokenVocabulary as TokenTypeDictionary) };
    } else {
      throw new Error(
        "<tokensDictionary> argument must be An Array of Token constructors," +
          " A dictionary of Token constructors or an IMultiModeLexerDefinition",
      );
    }

    // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
    // parsed with a clear error message ("expecting EOF but found ...")
    this.tokensMap["EOF"] = EOF;

    const allTokenTypes = Object.hasOwn(tokenVocabulary, "modes")
      ? (Object.values((<any>tokenVocabulary).modes) as any[][]).flat()
      : Object.values(tokenVocabulary);
    const noTokenCategoriesUsed = allTokenTypes.every(
      // intentional "==" to also cover "undefined"
      (tokenConstructor: any) => tokenConstructor.categoryMatches?.length == 0,
    );

    this.tokenMatcher = noTokenCategoriesUsed
      ? tokenStructuredMatcherNoCategories
      : tokenStructuredMatcher;

    // Because ES2015+ syntax should be supported for creating Token classes
    // We cannot assume that the Token classes were created using the "extendToken" utilities
    // Therefore we must augment the Token classes both on Lexer initialization and on Parser initialization
    augmentTokenTypes(Object.values(this.tokensMap));
  }

  defineRule<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleName: string,
    impl: (...args: ARGS) => R,
    config: IRuleConfig<R>,
  ): ParserMethodInternal<ARGS, R> {
    if (this.selfAnalysisDone) {
      throw Error(
        `Grammar rule <${ruleName}> may not be defined after the 'performSelfAnalysis' method has been called'\n` +
          `Make sure that all grammar rule definitions are done before 'performSelfAnalysis' is called.`,
      );
    }
    const resyncEnabled: boolean = Object.hasOwn(config, "resyncEnabled")
      ? (config.resyncEnabled as boolean) // assumes end user provides the correct config value/type
      : DEFAULT_RULE_CONFIG.resyncEnabled;
    const recoveryValueFunc = Object.hasOwn(config, "recoveryValueFunc")
      ? (config.recoveryValueFunc as () => R) // assumes end user provides the correct config value/type
      : DEFAULT_RULE_CONFIG.recoveryValueFunc;

    // performance optimization: Use small integers as keys for the longer human readable "full" rule names.
    // this greatly improves Map access time (as much as 8% for some performance benchmarks).
    const shortName =
      this.ruleShortNameIdx << (BITS_FOR_METHOD_TYPE + BITS_FOR_OCCURRENCE_IDX);

    this.ruleShortNameIdx++;
    this.shortRuleNameToFull[shortName] = ruleName;
    this.fullRuleNameToShort[ruleName] = shortName;

    let coreRuleFunction: ParserMethod<ARGS, R>;

    // Micro optimization, only check the condition **once** on rule definition
    // instead of **every single** rule invocation.
    if (this.outputCst === true) {
      coreRuleFunction = function invokeRuleWithTry(
        this: MixedInParser,
        ...args: ARGS
      ): R {
        try {
          this.ruleInvocationStateUpdate(shortName, ruleName, this.subruleIdx);
          impl.apply(this, args);
          const cst = this.CST_STACK[this.CST_STACK.length - 1];
          this.cstPostRule(cst);
          return cst as unknown as R;
        } catch (e) {
          return this.invokeRuleCatch(e, resyncEnabled, recoveryValueFunc) as R;
        } finally {
          this.ruleFinallyStateUpdate();
        }
      };
    } else {
      coreRuleFunction = function invokeRuleWithTryCst(
        this: MixedInParser,
        ...args: ARGS
      ): R {
        try {
          this.ruleInvocationStateUpdate(shortName, ruleName, this.subruleIdx);
          return impl.apply(this, args);
        } catch (e) {
          return this.invokeRuleCatch(e, resyncEnabled, recoveryValueFunc) as R;
        } finally {
          this.ruleFinallyStateUpdate();
        }
      };
    }

    // wrapper to allow before/after parsing hooks
    const rootRuleFunction: ParserMethod<ARGS, R> = function rootRule(
      this: MixedInParser,
      ...args: ARGS
    ): R {
      this.onBeforeParse(ruleName);
      try {
        return coreRuleFunction.apply(this, args);
      } finally {
        this.onAfterParse(ruleName);
      }
    };

    const wrappedGrammarRule: ParserMethodInternal<ARGS, R> = Object.assign(
      rootRuleFunction as any,
      { ruleName, originalGrammarAction: impl, coreRule: coreRuleFunction },
    );

    return wrappedGrammarRule;
  }

  /**
   * Catch handler for `invokeRuleWithTryCst`. Decides how to handle
   * exceptions thrown during rule execution:
   *
   * - **Recognition exception + reSync enabled**: attempt reSync recovery —
   *   skip tokens until a follow-set token is found, then return a partial
   *   CST node (if `outputCst`) or the recovery value.
   * - **Recognition exception + first invoked rule**: terminate the parse
   *   gracefully and return the recovery value (the parser should never
   *   throw its own errors to user code).
   * - **Recognition exception + nested rule**: re-throw so the parent rule
   *   can attempt reSync at a higher level.
   * - **Non-recognition exception** (e.g., JS runtime error): always re-throw.
   *
   * ReSync is disabled during backtracking (`IS_SPECULATING=true`) to
   * prevent recovery from accepting invalid syntax that a different
   * speculative path would parse correctly.
   */
  invokeRuleCatch(
    this: MixedInParser,
    e: Error,
    resyncEnabledConfig: boolean,
    recoveryValueFunc: Function,
  ): unknown {
    const isFirstInvokedRule = this.RULE_STACK_IDX === 0;
    // note the reSync is always enabled for the first rule invocation, because we must always be able to
    // reSync with EOF and just output some INVALID ParseTree
    // during backtracking reSync recovery is disabled, otherwise we can't be certain the backtracking
    // path is really the most valid one
    const reSyncEnabled =
      resyncEnabledConfig && !this.isBackTracking() && this.recoveryEnabled;

    if (isRecognitionException(e)) {
      const recogError: any = e;
      if (reSyncEnabled) {
        const reSyncTokType = this.findReSyncTokenType();
        if (this.isInCurrentRuleReSyncSet(reSyncTokType)) {
          recogError.resyncedTokens = this.reSyncTo(reSyncTokType);
          if (this.outputCst) {
            const partialCstResult: any =
              this.CST_STACK[this.CST_STACK.length - 1];
            partialCstResult.recoveredNode = true;
            return partialCstResult;
          } else {
            return recoveryValueFunc(e);
          }
        } else {
          if (this.outputCst) {
            const partialCstResult: any =
              this.CST_STACK[this.CST_STACK.length - 1];
            partialCstResult.recoveredNode = true;
            recogError.partialCstResult = partialCstResult;
          }
          // to be handled Further up the call stack
          throw recogError;
        }
      } else if (isFirstInvokedRule) {
        // otherwise a Redundant input error will be created as well and we cannot guarantee that this is indeed the case
        this.moveToTerminatedState();
        // the parser should never throw one of its own errors outside its flow.
        // even if error recovery is disabled
        return recoveryValueFunc(e);
      } else {
        // to be recovered Further up the call stack
        throw recogError;
      }
    } else {
      // some other Error type which we don't know how to handle (for example a built in JavaScript Error)
      throw e;
    }
  }

  // Implementation of parsing DSL
  optionInternal<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
    _occurrence: number,
  ): OUT | undefined {
    return this.optionInternalLogic(actionORMethodDef);
  }

  /**
   * Optionally executes the OPTION body, returning its result or undefined.
   *
   * Does NOT set IS_SPECULATING — the outer speculating state (if any, set by
   * OR) propagates naturally so CONSUME throws the cheapest failure path.
   *
   * If a GATE is present: gate-false → skip; gate-true → commit directly
   * (gate is a reliable lookahead, no speculation needed).
   *
   * Without a GATE: save state + CST watermark, run body, restore on failure.
   * Two additional abort conditions:
   *   1. Body did not advance the token position (stuck / epsilon body).
   *   2. Recovery mode added errors — the optional content wasn't really there.
   */
  optionInternalLogic<OUT>(
    this: ForgivingMixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    let action: GrammarAction<OUT>;
    let gate: (() => boolean) | undefined;
    if (typeof actionORMethodDef !== "function") {
      action = actionORMethodDef.DEF;
      gate = actionORMethodDef.GATE;
    } else {
      action = actionORMethodDef;
      gate = undefined;
    }

    // GATE as a filter: if it fails skip immediately; if it passes fall through
    // to the speculative save/restore path (gate is a necessary but not sufficient
    // condition — the body may still not match the current tokens).
    // Track gated prefix: if this gated production fires before the first
    // CONSUME in an OR alt, the alt's first-token set is gate-dependent.
    if (gate !== undefined && this.IS_SPECULATING) {
      if (this.exportLexerState() === this._orAltStartLexPos) {
        this._orAltHasGatedPrefix = true;
      }
    }
    if (gate !== undefined && !gate.call(this)) {
      return undefined;
    }

    const startLexPos = this.exportLexerState();
    const startErrors = this._errors.length;
    const cstSave = this.saveCheckpoint();
    try {
      const result = action.call(this);
      // Stuck guard: if body didn't advance pos, or recovery added
      // errors (meaning the optional content wasn't really present), undo.
      if (
        this.exportLexerState() === startLexPos ||
        this._errors.length > startErrors
      ) {
        this.restoreCheckpoint(cstSave);
        this.importLexerState(startLexPos);
        this._errors.length = startErrors;
        return undefined;
      }
      return result;
    } catch (e) {
      if (e === SPEC_FAIL || isRecognitionException(e)) {
        this.restoreCheckpoint(cstSave);
        this.importLexerState(startLexPos);
        this._errors.length = startErrors;
        return undefined;
      }
      throw e;
    }
  }

  atLeastOneInternal<OUT>(
    this: MixedInParser,
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    return this.atLeastOneInternalLogic(prodOccurrence, actionORMethodDef);
  }

  /**
   * One-or-more loop. The first iteration is mandatory: a speculative probe
   * checks whether the action can start at all, and if so the body runs
   * committed so that nested invokeRuleCatch performs normal error recovery.
   * Subsequent iterations use the same probe + commit pattern — the lookahead
   * guard prevents spurious in-repetition-recovery errors that would arise from
   * speculatively running the full body and exiting via SPEC_FAIL.
   */
  atLeastOneInternalLogic<OUT>(
    this: ForgivingMixedInParser,
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    let action: GrammarAction<OUT>;
    let gate: (() => boolean) | undefined;
    if (typeof actionORMethodDef !== "function") {
      action = actionORMethodDef.DEF;
      gate = actionORMethodDef.GATE;
    } else {
      action = actionORMethodDef;
      gate = undefined;
    }

    // Track gated prefix for OR fast-path cache.
    if (gate !== undefined && this.IS_SPECULATING) {
      if (this.exportLexerState() === this._orAltStartLexPos) {
        this._orAltHasGatedPrefix = true;
      }
    }
    if (gate !== undefined && !gate.call(this)) {
      throw this.raiseEarlyExitException(
        prodOccurrence,
        PROD_TYPE.REPETITION_MANDATORY,
        (actionORMethodDef as DSLMethodOptsWithErr<OUT>).ERR_MSG,
      );
    }

    // Save _dslCounter so each iteration starts from the same value.
    const savedRepDslCounter = this._dslCounter;

    // Speculative lookahead: check whether the action can start before running
    // it committed. This prevents invokeRuleCatch inside the action from silently
    // recovering (advancing to the follow token) and making AT_LEAST_ONE think
    // the first iteration succeeded when no matching tokens were consumed.
    if (!this.makeSpecLookahead(action)()) {
      throw this.raiseEarlyExitException(
        prodOccurrence,
        PROD_TYPE.REPETITION_MANDATORY,
        (actionORMethodDef as DSLMethodOptsWithErr<OUT>).ERR_MSG,
      );
    }

    // First iteration: mandatory — run committed.
    {
      this._dslCounter = savedRepDslCounter;
      const firstLexPos = this.exportLexerState();
      const firstErrors = this._errors.length;
      const firstCstSave = this.saveCheckpoint();
      try {
        action.call(this);
      } catch (e) {
        if (e === SPEC_FAIL || isRecognitionException(e)) {
          this.restoreCheckpoint(firstCstSave);
          this.importLexerState(firstLexPos);
          this._errors.length = firstErrors;
          throw this.raiseEarlyExitException(
            prodOccurrence,
            PROD_TYPE.REPETITION_MANDATORY,
            (actionORMethodDef as DSLMethodOptsWithErr<OUT>).ERR_MSG,
          );
        }
        throw e;
      }
    }

    // Subsequent iterations: probe with a quick speculative lookahead (exits
    // after the first successful CONSUME), then execute the body committed so
    // that nested invokeRuleCatch can perform normal error recovery. This
    // matches the original LL(k) engine's behaviour where each iteration was
    // fully committed once the lookahead said "yes".
    const lookaheadFunc = this.makeSpecLookahead(action);
    while (lookaheadFunc()) {
      if (gate !== undefined && !gate.call(this)) break;
      this._dslCounter = savedRepDslCounter;
      const iterLexPos = this.exportLexerState();
      const iterErrors = this._errors.length;
      const cstSave = this.saveCheckpoint();
      try {
        // Run committed — any recovery happens inside the subrule's invokeRuleCatch.
        action.call(this);
      } catch (e) {
        // The committed body failed (e.g. a CONSUME mismatch with no wrapping
        // SUBRULE to do resync recovery). Restore state and exit the loop so
        // the tokens can be consumed by whatever follows AT_LEAST_ONE.
        if (e === SPEC_FAIL || isRecognitionException(e)) {
          this.restoreCheckpoint(cstSave);
          this.importLexerState(iterLexPos);
          this._errors.length = iterErrors;
          break;
        }
        throw e;
      }
      // Stuck guard: body consumed no tokens → restore and stop.
      if (this.exportLexerState() <= iterLexPos) {
        this.restoreCheckpoint(cstSave);
        this.importLexerState(iterLexPos);
        this._errors.length = iterErrors;
        break;
      }
    }
    // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
    this.attemptInRepetitionRecovery(
      this.atLeastOneInternal,
      [prodOccurrence, actionORMethodDef],
      lookaheadFunc,
      AT_LEAST_ONE_IDX,
      prodOccurrence,
      NextTerminalAfterAtLeastOneWalker,
    );
  }

  atLeastOneSepFirstInternal<OUT>(
    this: MixedInParser,
    prodOccurrence: number,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    this.atLeastOneSepFirstInternalLogic(prodOccurrence, options);
  }

  /**
   * One-or-more separated list. The first iteration is mandatory (no
   * IS_SPECULATING set); subsequent iterations are separator-driven
   * (tokenMatcher check — reliable lookahead, no speculation needed).
   *
   * We do NOT set IS_SPECULATING for the first iteration for the same reason as
   * atLeastOneInternalLogic: nested OR last alts inside the body must retain their
   * "committed" semantics. The separator provides a deterministic guard for all
   * subsequent iterations, so those also need no speculation.
   */
  atLeastOneSepFirstInternalLogic<OUT>(
    this: MixedInParser,
    prodOccurrence: number,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const action = options.DEF;
    const separator = options.SEP;

    // Save _dslCounter so each iteration starts from the same value.
    const savedRepDslCounter = this._dslCounter;

    // First iteration: mandatory — no IS_SPECULATING, let it throw/recover normally.
    {
      this._dslCounter = savedRepDslCounter;
      const firstLexPos = this.exportLexerState();
      const firstErrors = this._errors.length;
      const firstCstSave = this.saveCheckpoint();
      try {
        (action as GrammarAction<OUT>).call(this);
      } catch (e) {
        if (e === SPEC_FAIL || isRecognitionException(e)) {
          this.restoreCheckpoint(firstCstSave);
          this.importLexerState(firstLexPos);
          this._errors.length = firstErrors;
          throw this.raiseEarlyExitException(
            prodOccurrence,
            PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
            options.ERR_MSG,
          );
        }
        throw e;
      }
    }

    // The separator token acts as a reliable lookahead for subsequent iterations.
    const separatorLookAheadFunc = () => {
      return this.tokenMatcher(this.LA_FAST(1), separator);
    };

    // 2nd..nth iterations
    while (this.tokenMatcher(this.LA_FAST(1), separator) === true) {
      this.CONSUME(separator);
      this._dslCounter = savedRepDslCounter;
      (action as GrammarAction<OUT>).call(this);
    }

    // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
    this.attemptInRepetitionRecovery(
      this.repetitionSepSecondInternal,
      [
        prodOccurrence,
        separator,
        separatorLookAheadFunc,
        action,
        NextTerminalAfterAtLeastOneSepWalker,
      ],
      separatorLookAheadFunc,
      AT_LEAST_ONE_SEP_IDX,
      prodOccurrence,
      NextTerminalAfterAtLeastOneSepWalker,
    );
  }

  manyInternal<OUT>(
    this: MixedInParser,
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    return this.manyInternalLogic(prodOccurrence, actionORMethodDef);
  }

  /**
   * Zero-or-more loop. Each iteration runs the body with IS_SPECULATING=true
   * inside a try/catch. On SPEC_FAIL the state is rolled back and the loop
   * exits cleanly. RecognitionExceptions from committed inner paths (e.g. OR's
   * committed re-run) propagate out as errors.
   *
   * Stuck guard: if the body consumed no tokens despite completing without
   * throwing, stop to prevent infinite loops on epsilon-like bodies.
   */
  /**
   * Core MANY loop: runs the body speculatively until it fails.
   * Modelled after @jesscss/parser's MANY with additional error handling.
   *
   * Each iteration: save state → `IS_SPECULATING=true` → try body →
   * on `SPEC_FAIL` → restore and break. On success → check stuck guard.
   *
   * ## Recognition exception handling (for error recovery)
   *
   * OR's committed re-run (see `orInternal`) temporarily clears
   * `IS_SPECULATING`, so `CONSUME` failures throw real
   * `MismatchedTokenException` instead of `SPEC_FAIL`. These propagate
   * as recognition exceptions rather than `SPEC_FAIL`:
   *
   * - **With progress** (lexer advanced past iteration start): the body
   *   partially matched → real error → re-throw for recovery in
   *   `invokeRuleCatch` or error reporting upstream.
   * - **No progress**: body couldn't start → stop iterating. Errors from
   *   the recognition exception (e.g., `NoViableAltException` from
   *   ambiguous OR) are preserved in `_errors` for diagnostics.
   */
  manyInternalLogic<OUT>(
    this: ForgivingMixedInParser,
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ) {
    let action: GrammarAction<OUT>;
    let gate: (() => boolean) | undefined;
    if (typeof actionORMethodDef !== "function") {
      action = actionORMethodDef.DEF;
      gate = actionORMethodDef.GATE;
    } else {
      action = actionORMethodDef;
      gate = undefined;
    }

    const wasSpeculating = this.IS_SPECULATING;
    let notStuck = true;
    let ranAtLeastOnce = false;
    // lookaheadFunc built lazily on first exit (for recovery pass below)
    let lookaheadFunc: (() => boolean) | undefined;

    // Save _dslCounter so each iteration of the repetition body starts from
    // the same counter value. The GAST records only one iteration's DSL calls,
    // so all runtime iterations must produce the same occurrence indices.
    const savedRepDslCounter = this._dslCounter;

    // Speculative body: IS_SPECULATING=true, catch SPEC_FAIL to stop.
    // Also catches recognition exceptions from OR's committed re-run
    // (which temporarily clears IS_SPECULATING for error recovery).
    // If a recognition exception arrives with no progress, the body
    // couldn't start → break. With progress, it's a real error → re-throw.
    while (notStuck) {
      // Track gated prefix for OR fast-path cache (first iteration only).
      if (gate !== undefined && this.IS_SPECULATING && !ranAtLeastOnce) {
        if (this.exportLexerState() === this._orAltStartLexPos) {
          this._orAltHasGatedPrefix = true;
        }
      }
      if (gate !== undefined && !gate.call(this)) break;
      // Reset counter for this iteration to match GAST recording.
      this._dslCounter = savedRepDslCounter;
      const iterLexPos = this.exportLexerState();
      const iterErrors = this._errors.length;
      const iterCstSave = this.saveCheckpoint();
      this.IS_SPECULATING = true;
      try {
        action.call(this);
        this.IS_SPECULATING = wasSpeculating;
      } catch (e) {
        this.IS_SPECULATING = wasSpeculating;
        if (e === SPEC_FAIL) {
          // Speculative failure: body can't match → stop iterating.
          this.importLexerState(iterLexPos);
          this.restoreCheckpoint(iterCstSave);
          this._errors.length = iterErrors;
          break;
        }
        if (isRecognitionException(e)) {
          // Real error from OR's committed re-run (IS_SPECULATING was
          // temporarily cleared). Check if the body made progress:
          if (this.exportLexerState() > iterLexPos) {
            // Body partially matched → real error → propagate for
            // recovery (invokeRuleCatch) or error reporting.
            throw e;
          }
          // No progress → body can't start → stop iterating.
          // Restore pos and CST, but NOT errors — the recognition
          // exception (e.g., NoViableAltException from ambiguous OR)
          // was intentionally added to _errors and should be kept.
          this.importLexerState(iterLexPos);
          this.restoreCheckpoint(iterCstSave);
          break;
        }
        throw e;
      }
      // Stuck guard: body consumed no tokens → stop to prevent infinite loops.
      if (this.exportLexerState() <= iterLexPos) {
        this.importLexerState(iterLexPos);
        notStuck = false;
        break;
      }
      ranAtLeastOnce = true;
    }

    // Only attempt in-repetition recovery if ≥1 iterations ran successfully.
    if (ranAtLeastOnce) {
      lookaheadFunc ??= this.makeSpecLookahead(action);
      // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
      this.attemptInRepetitionRecovery(
        this.manyInternal,
        [prodOccurrence, actionORMethodDef],
        lookaheadFunc,
        MANY_IDX,
        prodOccurrence,
        NextTerminalAfterManyWalker,
        notStuck,
      );
    }
  }

  manySepFirstInternal<OUT>(
    this: MixedInParser,
    prodOccurrence: number,
    options: ManySepMethodOpts<OUT>,
  ): void {
    this.manySepFirstInternalLogic(prodOccurrence, options);
  }

  /**
   * Zero-or-more separated list. The first iteration is optional but tried
   * directly (no IS_SPECULATING set); subsequent iterations are
   * separator-driven (reliable tokenMatcher guard).
   *
   * The first element uses the same try/catch + stuck guard as OPTION — no
   * IS_SPECULATING, so nested OR last alts retain committed semantics inside
   * the body. The separator makes subsequent iterations deterministic.
   */
  manySepFirstInternalLogic<OUT>(
    this: MixedInParser,
    prodOccurrence: number,
    options: ManySepMethodOpts<OUT>,
  ): void {
    const action = options.DEF;
    const separator = options.SEP;

    // Save _dslCounter so each iteration starts from the same value.
    const savedRepDslCounter = this._dslCounter;

    // Optional first iteration — try without IS_SPECULATING.
    const firstLexPos = this.exportLexerState();
    const firstErrors = this._errors.length;
    const firstCstSave = this.saveCheckpoint();
    try {
      action.call(this);
    } catch (e) {
      if (e === SPEC_FAIL || isRecognitionException(e)) {
        this.restoreCheckpoint(firstCstSave);
        this.importLexerState(firstLexPos);
        this._errors.length = firstErrors;
        return; // zero iterations — MANY_SEP is optional
      }
      throw e;
    }
    // Stuck guard: first element consumed no tokens → treat as zero iterations.
    if (this.exportLexerState() <= firstLexPos) {
      this.restoreCheckpoint(firstCstSave);
      this.importLexerState(firstLexPos);
      this._errors.length = firstErrors;
      return;
    }

    const separatorLookAheadFunc = () => {
      return this.tokenMatcher(this.LA_FAST(1), separator);
    };
    // 2nd..nth iterations
    while (this.tokenMatcher(this.LA_FAST(1), separator) === true) {
      this.CONSUME(separator);
      this._dslCounter = savedRepDslCounter;
      action.call(this);
    }

    // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
    this.attemptInRepetitionRecovery(
      this.repetitionSepSecondInternal,
      [
        prodOccurrence,
        separator,
        separatorLookAheadFunc,
        action,
        NextTerminalAfterManySepWalker,
      ],
      separatorLookAheadFunc,
      MANY_SEP_IDX,
      prodOccurrence,
      NextTerminalAfterManySepWalker,
    );
  }

  /**
   * Returns a speculative lookahead predicate for the given action, used
   * exclusively by attemptInRepetitionRecovery (which is a NOOP when recovery
   * is disabled). The predicate saves state, runs the action speculatively,
   * and always restores — returning true iff the action would succeed.
   */
  makeSpecLookahead(
    this: MixedInParser,
    action: GrammarAction<any>,
  ): () => boolean {
    // IS_SPECULATING=true means CST building and error building are both skipped
    // (Stage 3), so no CST save/restore or RULE_STACK_IDX save is needed —
    // only the lexer position requires rollback.
    return () => {
      const savedLexPos = this.exportLexerState();
      const savedCounter = this._dslCounter;
      const prev = this.IS_SPECULATING;
      this.IS_SPECULATING = true;
      // _earlyExitLookahead: abort the action after the first successful CONSUME,
      // preventing embedded-action side effects (e.g. array pushes) from running.
      this._earlyExitLookahead = true;
      try {
        action.call(this);
        return true;
      } catch (e) {
        if (e === SPEC_FAIL || isRecognitionException(e)) return false;
        if (e === FIRST_TOKEN_MATCH) return true;
        throw e;
      } finally {
        this._earlyExitLookahead = false;
        this.IS_SPECULATING = prev;
        this.importLexerState(savedLexPos);
        this._dslCounter = savedCounter;
      }
    };
  }

  repetitionSepSecondInternal<OUT>(
    this: MixedInParser,
    prodOccurrence: number,
    separator: TokenType,
    separatorLookAheadFunc: () => boolean,
    action: GrammarAction<OUT>,
    nextTerminalAfterWalker: typeof AbstractNextTerminalAfterProductionWalker,
  ): void {
    while (separatorLookAheadFunc()) {
      // note that this CONSUME will never enter recovery because
      // the separatorLookAheadFunc checks that the separator really does exist.
      this.CONSUME(separator);
      action.call(this);
    }

    // we can only arrive to this function after an error
    // has occurred (hence the name 'second') so the following
    // IF will always be entered, its possible to remove it...
    // however it is kept to avoid confusion and be consistent.
    // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
    /* istanbul ignore else */
    this.attemptInRepetitionRecovery(
      this.repetitionSepSecondInternal,
      [
        prodOccurrence,
        separator,
        separatorLookAheadFunc,
        action,
        nextTerminalAfterWalker,
      ],
      separatorLookAheadFunc,
      AT_LEAST_ONE_SEP_IDX,
      prodOccurrence,
      nextTerminalAfterWalker,
    );
  }

  doSingleRepetition(this: MixedInParser, action: Function): any {
    const beforeIteration = this.getLexerPosition();
    action.call(this);
    const afterIteration = this.getLexerPosition();

    // This boolean will indicate if this repetition progressed
    // or if we are "stuck" (potential infinite loop in the repetition).
    return afterIteration > beforeIteration;
  }

  /**
   * Iterates alternatives using zero-cost speculative backtracking.
   * Modelled after @jesscss/parser's OR().
   *
   * ## Three execution paths (tried in order):
   *
   * **1. Fast-dispatch path** — `_orFastMaps[mapKey][la1.tokenTypeIdx]` gives
   * the alt index observed to match this LA(1) token on a previous call.
   * One property lookup → speculative ALT call. Gated-prefix alts are
   * checked separately via `_orGatedPrefixAlts`.
   *
   * **2. Slow speculative path** — For each alt in declaration order:
   * GATE fails → skip; otherwise save state, set `IS_SPECULATING=true`,
   * try ALT. On success → return (first success wins). On SPEC_FAIL →
   * restore state (pos + CST + errors), try next. Failed alts with
   * progress populate the fast-dispatch map for future calls.
   *
   * **3. Committed re-run** — When all speculative alts fail but the
   * fast-dispatch map has an entry for the current token (populated during
   * step 2), re-run that alt with `IS_SPECULATING=false`. This lets
   * `consumeInternal` throw real `MismatchedTokenException`, enabling:
   *   - **Recovery** (if `recoveryEnabled`): single-token insertion/deletion
   *     in `consumeInternalRecovery`, or reSync in `invokeRuleCatch`.
   *   - **Error propagation** (if recovery disabled): exception bubbles to
   *     the enclosing rule's `invokeRuleCatch` for error reporting.
   * For ambiguous entries (-1), raises `NoViableAltException` directly.
   * MANY's catch handler uses progress to decide whether to stop iterating
   * (no progress) or re-throw (progress made).
   */
  orInternal<T>(
    this: ForgivingMixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
    occurrence: number,
  ): T {
    const alts = Array.isArray(altsOrOpts) ? altsOrOpts : altsOrOpts.DEF;
    const errMsg = Array.isArray(altsOrOpts)
      ? undefined
      : (altsOrOpts as OrMethodOpts<unknown>).ERR_MSG;
    const wasSpeculating = this.IS_SPECULATING;
    // Save outer OR's gated-prefix tracking state so nested ORs (via
    // SUBRULEs) don't corrupt it.
    const savedAltStartLexPos = this._orAltStartLexPos;
    const savedAltHasGatedPrefix = this._orAltHasGatedPrefix;

    const savedDslCounter = this._dslCounter;
    const mapKey = this.currRuleShortName | occurrence;
    const altStarts = this._orAltCounterStarts[mapKey];

    // -----------------------------------------------------------------------
    // Fast-dispatch path — direct tokenTypeIdx→altIdx map, zero allocation.
    //
    // `_orFastMaps[mapKey][la1.tokenTypeIdx]` gives the alt index observed to
    // match this LA(1) token. Built lazily from slow-path observations.
    // For gate-free, unambiguous LL(1) grammars (e.g. JSON) this is the
    // hottest path: one property lookup → committed ALT call.
    //
    // Gated-prefix alts (gate-dependent first-token set) are checked
    // separately via `_orGatedPrefixAlts` — they must always be speculated.
    // -----------------------------------------------------------------------
    const la1 = this.LA_FAST(1);
    const la1TypeIdx = la1.tokenTypeIdx;
    const fastMap = this._orFastMaps[mapKey];
    const gatedPrefixAlts = this._orGatedPrefixAlts[mapKey];
    if (fastMap !== undefined || gatedPrefixAlts !== undefined) {
      // Gated-prefix alts have higher priority than fast-map entries.
      // They must ALWAYS be tried first because their first-token set is
      // gate-dependent — the gate may open/close between calls.
      if (gatedPrefixAlts !== undefined) {
        for (let gIdx = 0; gIdx < gatedPrefixAlts.length; gIdx++) {
          const altIdx = gatedPrefixAlts[gIdx];
          const alt = alts[altIdx];
          if (alt.GATE !== undefined && !alt.GATE.call(this)) continue;
          const fastLexPos = this.currIdx;
          if (altStarts !== undefined)
            this._dslCounter = savedDslCounter + altStarts[altIdx];
          if (wasSpeculating) {
            try {
              const r = alt.ALT.call(this) as T;
              {
                const d = this._orCounterDeltas[mapKey];
                if (d !== undefined) this._dslCounter = savedDslCounter + d;
              }
              return r;
            } catch (_e) {
              this.currIdx = fastLexPos;
            }
          } else {
            const fastErrors = this._errors.length;
            const fastCstSave = this.saveCheckpoint();
            try {
              const r = alt.ALT.call(this) as T;
              {
                const d = this._orCounterDeltas[mapKey];
                if (d !== undefined) this._dslCounter = savedDslCounter + d;
              }
              return r;
            } catch (_e) {
              this.restoreCheckpoint(fastCstSave);
              this.currIdx = fastLexPos;
              this._errors.length = fastErrors;
            }
          }
        }
      }

      const fastAltIdx =
        fastMap !== undefined ? fastMap[la1TypeIdx] : undefined;

      // Direct dispatch: single candidate for this tokenTypeIdx.
      if (fastAltIdx !== undefined && fastAltIdx >= 0) {
        // Decode: entries >= GATED_OFFSET have preceding gated alts with
        // an explicit GATE property on the alt itself. Check those first.
        let realAltIdx = fastAltIdx;
        if (fastAltIdx >= GATED_OFFSET) {
          realAltIdx = fastAltIdx - GATED_OFFSET;
          for (let g = 0; g < realAltIdx; g++) {
            const galt = alts[g];
            if (galt.GATE !== undefined && galt.GATE.call(this)) {
              const gPos = this.currIdx;
              if (altStarts !== undefined)
                this._dslCounter = savedDslCounter + altStarts[g];
              if (wasSpeculating) {
                try {
                  const r = galt.ALT.call(this) as T;
                  {
                    const d = this._orCounterDeltas[mapKey];
                    if (d !== undefined) this._dslCounter = savedDslCounter + d;
                  }
                  return r;
                } catch (_e) {
                  this.currIdx = gPos;
                }
              } else {
                const gErr = this._errors.length;
                const gCst = this.saveCheckpoint();
                try {
                  const r = galt.ALT.call(this) as T;
                  {
                    const d = this._orCounterDeltas[mapKey];
                    if (d !== undefined) this._dslCounter = savedDslCounter + d;
                  }
                  return r;
                } catch (_e) {
                  this.restoreCheckpoint(gCst);
                  this.currIdx = gPos;
                  this._errors.length = gErr;
                }
              }
            }
          }
        }

        // Dispatch to the mapped fallback alt.
        const alt = alts[realAltIdx];
        if (alt.GATE === undefined || alt.GATE.call(this)) {
          const fastLexPos = this.currIdx;
          if (altStarts !== undefined)
            this._dslCounter = savedDslCounter + altStarts[realAltIdx];
          if (wasSpeculating) {
            try {
              const r = alt.ALT.call(this) as T;
              {
                const d = this._orCounterDeltas[mapKey];
                if (d !== undefined) this._dslCounter = savedDslCounter + d;
              }
              return r;
            } catch (_e) {
              this.currIdx = fastLexPos;
            }
          } else {
            const fastErrors = this._errors.length;
            const fastCstSave = this.saveCheckpoint();
            try {
              const r = alt.ALT.call(this) as T;
              {
                const d = this._orCounterDeltas[mapKey];
                if (d !== undefined) this._dslCounter = savedDslCounter + d;
              }
              return r;
            } catch (_e) {
              this.restoreCheckpoint(fastCstSave);
              this.currIdx = fastLexPos;
              this._errors.length = fastErrors;
            }
          }
        }
      }
      // Fast path exhausted — fall through to full speculative loop.
    }

    // -----------------------------------------------------------------------
    // Slow path: try each alt speculatively. First success wins.
    // No bestProgress tracking — first success is final.
    //
    // Committed re-run: when all speculative alts fail but the fast-dispatch
    // map identified which alt's first token matched (LL(1)), re-run that
    // alt with IS_SPECULATING=false. This lets CONSUME throw real
    // MismatchedTokenException for recovery (if enabled) or error
    // propagation (if disabled). MANY catches the exception and checks
    // progress to decide whether to stop or re-throw.
    // -----------------------------------------------------------------------
    const startLexPos = this.exportLexerState();
    // Save CST/errors for clean state restoration. During speculation,
    // successful CONSUMEs add CST nodes that aren't cleaned up on
    // SPEC_FAIL (only lexer pos is restored).
    const savedErrors = this._errors.length;
    const savedCst = this.saveCheckpoint();

    for (let i = 0; i < alts.length; i++) {
      const alt = alts[i];
      if (alt.GATE !== undefined && !alt.GATE.call(this)) continue;
      this.IS_SPECULATING = true;
      if (altStarts !== undefined)
        this._dslCounter = savedDslCounter + altStarts[i];
      this._orAltStartLexPos = startLexPos;
      this._orAltHasGatedPrefix = false;
      try {
        const result = alt.ALT.call(this) as T;
        this.IS_SPECULATING = wasSpeculating;
        // Record for fast-dispatch cache.
        if (this._orAltHasGatedPrefix) {
          let gpa = this._orGatedPrefixAlts[mapKey];
          if (gpa === undefined) {
            gpa = [];
            this._orGatedPrefixAlts[mapKey] = gpa;
          }
          if (!gpa.includes(i)) {
            gpa.push(i);
            if (gpa.length > 1) gpa.sort((a: number, b: number) => a - b);
          }
        } else {
          addOrFastMapEntry(this._orFastMaps, mapKey, la1TypeIdx, i, alts);
        }
        this._orAltStartLexPos = savedAltStartLexPos;
        this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
        {
          const d = this._orCounterDeltas[mapKey];
          if (d !== undefined) this._dslCounter = savedDslCounter + d;
        }
        return result;
      } catch (e) {
        this.IS_SPECULATING = wasSpeculating;
        if (e === SPEC_FAIL || isRecognitionException(e)) {
          // Record gated-prefix tracking for failed alts.
          if (this._orAltHasGatedPrefix) {
            let gpa = this._orGatedPrefixAlts[mapKey];
            if (gpa === undefined) {
              gpa = [];
              this._orGatedPrefixAlts[mapKey] = gpa;
            }
            if (!gpa.includes(i)) {
              gpa.push(i);
              if (gpa.length > 1) gpa.sort((a: number, b: number) => a - b);
            }
          }
          // Record failed alt with progress for fast-dispatch ambiguity
          // detection. If a different alt later succeeds for the same
          // tokenTypeIdx, the entry becomes -1 (ambiguous).
          const progress = this.exportLexerState() - startLexPos;
          if (!this._orAltHasGatedPrefix && progress > 0) {
            addOrFastMapEntry(this._orFastMaps, mapKey, la1TypeIdx, i, alts);
          }
          this.importLexerState(startLexPos);
          // Restore CST/errors so next alt starts with clean state.
          this._errors.length = savedErrors;
          this.restoreCheckpoint(savedCst);
          continue;
        }
        throw e;
      }
    }

    // -----------------------------------------------------------------
    // Committed re-run: all speculative alts failed, but the fast-dispatch
    // map identified which alt's first token matched (LL(1) lookahead).
    // Re-run that alt with IS_SPECULATING=false so CONSUME throws real
    // MismatchedTokenException. This enables:
    //   - Recovery (if recoveryEnabled): single-token insertion/deletion
    //   - Error propagation (if recovery disabled): exception bubbles to
    //     enclosing rule's invokeRuleCatch for error reporting
    // MANY catches the propagating exception and uses progress to decide
    // whether to stop iterating or re-throw for higher-level handling.
    // -----------------------------------------------------------------
    {
      const recoveryMap = this._orFastMaps[mapKey];
      if (recoveryMap !== undefined) {
        let recoveryAltIdx = recoveryMap[la1TypeIdx];
        if (recoveryAltIdx !== undefined && recoveryAltIdx >= 0) {
          if (recoveryAltIdx >= GATED_OFFSET) recoveryAltIdx -= GATED_OFFSET;
          // Restore clean state before committed re-run.
          this.restoreCheckpoint(savedCst);
          this._errors.length = savedErrors;
          if (altStarts !== undefined)
            this._dslCounter = savedDslCounter + altStarts[recoveryAltIdx];
          this._orAltStartLexPos = startLexPos;
          this._orAltHasGatedPrefix = false;
          // Clear IS_SPECULATING so CONSUME throws real errors.
          this.IS_SPECULATING = false;
          try {
            const result = alts[recoveryAltIdx].ALT.call(this) as T;
            this.IS_SPECULATING = wasSpeculating;
            this._orAltStartLexPos = savedAltStartLexPos;
            this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
            {
              const d = this._orCounterDeltas[mapKey];
              if (d !== undefined) this._dslCounter = savedDslCounter + d;
            }
            return result;
          } catch (e) {
            // Recovery in invokeRuleCatch may have handled it (subrule
            // returns normally). If the error propagates here, it means
            // recovery couldn't fix it — let it bubble up.
            this.IS_SPECULATING = wasSpeculating;
            this._orAltStartLexPos = savedAltStartLexPos;
            this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
            throw e;
          }
        }
      }
    }

    // All alts failed. Restore tracking state.
    this._orAltStartLexPos = savedAltStartLexPos;
    this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
    {
      const d = this._orCounterDeltas[mapKey];
      if (d !== undefined) this._dslCounter = savedDslCounter + d;
    }

    // If the fast map has ANY entry for this token (including ambiguous -1),
    // the token matched at least one alt's first CONSUME during speculation.
    // Raise a real NoViableAltException so the error propagates through MANY
    // for proper error reporting, rather than being silently swallowed as
    // SPEC_FAIL. MANY's catch handler uses progress to decide whether to
    // stop iterating (no progress) or re-throw (progress made).
    if (this.IS_SPECULATING) {
      const failMap = this._orFastMaps[mapKey];
      if (failMap !== undefined && failMap[la1TypeIdx] !== undefined) {
        this.IS_SPECULATING = false;
        this.restoreCheckpoint(savedCst);
        this._errors.length = savedErrors;
        this.raiseNoAltException(occurrence, errMsg);
        // raiseNoAltException throws — unreachable.
      }
      throw SPEC_FAIL;
    }
    this.raiseNoAltException(occurrence, errMsg);
    throw SPEC_FAIL;
  }

  ruleFinallyStateUpdate(this: MixedInParser): void {
    // Restore the single DSL counter from the parent rule scope.
    this._dslCounter = this._dslCounterStack[this.RULE_STACK_IDX];
    this.RULE_STACK_IDX--;

    // Restore the cached short name to the parent rule.
    // When the stack is empty (top-level rule exiting), the stale value
    // is harmless — no DSL methods will be called before the next ruleInvocationStateUpdate.
    if (this.RULE_STACK_IDX >= 0) {
      this.currRuleShortName = this.RULE_STACK[this.RULE_STACK_IDX];
    }

    // NOOP when cst is disabled
    this.cstFinallyStateUpdate();
  }

  subruleInternal<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    idx: number,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    let ruleResult;
    try {
      const args = options !== undefined ? options.ARGS : undefined;
      this.subruleIdx = idx;
      // Use coreRule to bypass root-level hooks (onBeforeParse/onAfterParse)
      ruleResult = ruleToCall.coreRule.apply(this, args);
      this.cstPostNonTerminal(
        ruleResult,
        options !== undefined && options.LABEL !== undefined
          ? options.LABEL
          : ruleToCall.ruleName,
      );
      return ruleResult;
    } catch (e) {
      throw this.subruleInternalError(e, options, ruleToCall.ruleName);
    }
  }

  subruleInternalError(
    this: MixedInParser,
    e: any,
    options: SubruleMethodOpts<unknown[]> | undefined,
    ruleName: string,
  ): void {
    if (isRecognitionException(e) && e.partialCstResult !== undefined) {
      this.cstPostNonTerminal(
        e.partialCstResult,
        options !== undefined && options.LABEL !== undefined
          ? options.LABEL
          : ruleName,
      );

      e.partialCstResult = undefined;
    }
    throw e;
  }

  /**
   * Matches the next token against `tokType`. Three outcomes:
   *
   * 1. **Match**: advance position, add to CST, return the token.
   *    If `_earlyExitLookahead` is set, throws `FIRST_TOKEN_MATCH`
   *    immediately (used by `makeSpecLookahead` for LL(1) peek).
   *
   * 2. **Mismatch + speculating** (`IS_SPECULATING=true`): throws the
   *    `SPEC_FAIL` Symbol — zero allocation cost, no stack trace.
   *    Caught by OR/MANY/OPTION for backtracking.
   *
   * 3. **Mismatch + committed** (`IS_SPECULATING=false`): delegates to
   *    `consumeInternalError` → `consumeInternalRecovery` for
   *    single-token insertion/deletion (if `recoveryEnabled`), or
   *    throws `MismatchedTokenException` for upstream handling.
   */
  consumeInternal(
    this: MixedInParser,
    tokType: TokenType,
    idx: number,
    options: ConsumeMethodOpts | undefined,
  ): IToken {
    const nextToken = this.LA_FAST(1);
    const label =
      options !== undefined && options.LABEL !== undefined
        ? options.LABEL
        : tokType.name;

    if (this.tokenMatcher(nextToken, tokType) === true) {
      this.consumeToken();
      if (this._earlyExitLookahead) throw FIRST_TOKEN_MATCH;
      this.cstPostTerminal(label, nextToken);
      return nextToken;
    }

    // Mismatch: speculative fast path — skip try/catch and recovery entirely.
    if (this.IS_SPECULATING) throw SPEC_FAIL;

    // Non-speculative: in-rule single-token recovery.
    let consumedToken!: IToken;
    try {
      this.consumeInternalError(tokType, nextToken, options);
    } catch (eFromConsumption) {
      consumedToken = this.consumeInternalRecovery(
        tokType,
        idx,
        eFromConsumption,
      );
    }
    this.cstPostTerminal(label, consumedToken);
    return consumedToken;
  }

  /**
   * Called when a CONSUME fails to match. During speculation (IS_SPECULATING)
   * throws SPEC_FAIL — a Symbol with zero allocation cost — instead of
   * allocating a MismatchedTokenException (which triggers captureStackTrace).
   */
  consumeInternalError(
    this: MixedInParser,
    tokType: TokenType,
    nextToken: IToken,
    options: ConsumeMethodOpts | undefined,
  ): void {
    if (this.IS_SPECULATING) {
      throw SPEC_FAIL;
    }
    let msg;
    const previousToken = this.LA(0);
    if (options !== undefined && options.ERR_MSG) {
      msg = options.ERR_MSG;
    } else {
      msg = this.errorMessageProvider.buildMismatchTokenMessage({
        expected: tokType,
        actual: nextToken,
        previous: previousToken,
        ruleName: this.getCurrRuleFullName(),
      });
    }
    throw this.SAVE_ERROR(
      new MismatchedTokenException(msg, nextToken, previousToken),
    );
  }

  /**
   * Attempts single-token insertion or deletion recovery for a failed
   * CONSUME. Only runs when `recoveryEnabled=true` AND not backtracking
   * (`IS_SPECULATING=false`). If recovery fails, re-throws the original
   * `MismatchedTokenException` for reSync handling in `invokeRuleCatch`.
   *
   * This is the entry point for Chevrotain's per-token error recovery.
   * OR's committed re-run temporarily clears `IS_SPECULATING` specifically
   * so this method can fire.
   */
  consumeInternalRecovery(
    this: MixedInParser,
    tokType: TokenType,
    idx: number,
    eFromConsumption: Error,
  ): IToken {
    if (
      this.recoveryEnabled &&
      // TODO: more robust checking of the exception type. Perhaps Typescript extending expressions?
      eFromConsumption.name === "MismatchedTokenException" &&
      !this.isBackTracking()
    ) {
      const follows = this.getFollowsForInRuleRecovery(<any>tokType, idx);
      try {
        return this.tryInRuleRecovery(<any>tokType, follows);
      } catch (eFromInRuleRecovery) {
        if (eFromInRuleRecovery.name === IN_RULE_RECOVERY_EXCEPTION) {
          // failed in RuleRecovery.
          // throw the original error in order to trigger reSync error recovery
          throw eFromConsumption;
        } else {
          throw eFromInRuleRecovery;
        }
      }
    } else {
      throw eFromConsumption;
    }
  }

  ruleInvocationStateUpdate(
    this: MixedInParser,
    shortName: number,
    fullName: string,
    idxInCallingRule: number,
  ): void {
    const depth = ++this.RULE_STACK_IDX;
    this.RULE_OCCURRENCE_STACK[depth] = idxInCallingRule;
    this.RULE_STACK[depth] = shortName;
    this.currRuleShortName = shortName;
    // Save and reset the single DSL auto-occurrence counter.
    this._dslCounterStack[depth] = this._dslCounter;
    this._dslCounter = 0;
    // NOOP when cst is disabled
    this.cstInvocationStateUpdate(fullName);
  }

  /**
   * Returns true while inside a BACKTRACK() trial. Reads the boolean flag
   * directly — O(1) with no array length check.
   */
  isBackTracking(this: MixedInParser): boolean {
    return this.IS_SPECULATING;
  }

  getCurrRuleFullName(this: MixedInParser): string {
    const shortName = this.currRuleShortName;
    return this.shortRuleNameToFull[shortName];
  }

  shortRuleNameToFullName(this: MixedInParser, shortName: number) {
    return this.shortRuleNameToFull[shortName];
  }

  public isAtEndOfInput(this: MixedInParser): boolean {
    return this.tokenMatcher(this.LA(1), EOF);
  }

  public reset(this: MixedInParser): void {
    this.resetLexerState();
    this.subruleIdx = 0;
    this.currRuleShortName = 0;
    this.IS_SPECULATING = false;
    this.errors = [];
    // Reset depth counters but keep arrays allocated to avoid re-allocation.
    // Stale number values in unused slots are harmless.
    this.RULE_STACK_IDX = -1;
    // TODO: extract a specific reset for TreeBuilder trait
    this.CST_STACK = [];
  }

  /**
   * Hook called before the root-level parsing rule is invoked.
   * This is only called when a rule is invoked directly by the consumer
   * (e.g., `parser.json()`), not when invoked as a sub-rule via SUBRULE.
   *
   * Override this method to perform actions before parsing begins.
   * The default implementation is a no-op.
   *
   * @param ruleName - The name of the root rule being invoked.
   */
  onBeforeParse(this: MixedInParser, _ruleName: string): void {
    // Pad with sentinels for bounds-free forward LA()
    for (let i = 0; i < this.maxLookahead + 1; i++) {
      this.tokVector.push(END_OF_FILE);
    }
  }

  /**
   * Hook called after the root-level parsing rule has completed (or thrown).
   * This is only called when a rule is invoked directly by the consumer
   * (e.g., `parser.json()`), not when invoked as a sub-rule via SUBRULE.
   *
   * This hook is called in a `finally` block, so it executes regardless of
   * whether parsing succeeded or threw an error.
   *
   * Override this method to perform actions after parsing completes.
   * The default implementation is a no-op.
   *
   * @param ruleName - The name of the root rule that was invoked.
   */
  onAfterParse(this: MixedInParser, _ruleName: string): void {
    if (this.isAtEndOfInput() === false) {
      const firstRedundantTok = this.LA(1);
      const errMsg = this.errorMessageProvider.buildNotAllInputParsedMessage({
        firstRedundant: firstRedundantTok,
        ruleName: this.getCurrRuleFullName(),
      });
      this.SAVE_ERROR(
        new NotAllInputParsedException(errMsg, firstRedundantTok),
      );
    }

    // undo the padding of sentinels for bounds-free forward LA() in onBeforeParse
    while (this.tokVector.at(-1) === END_OF_FILE) {
      this.tokVector.pop();
    }
  }
}
