import { timer, toFastProperties } from "@chevrotain/utils";
import { computeAllProdsFollows } from "../grammar/follow.js";
import {
  addNoneTerminalToCst,
  addTerminalToCst,
  setNodeLocationFull,
  setNodeLocationOnlyOffset,
} from "../cst/cst.js";
import {
  createBaseSemanticVisitorConstructor,
  createBaseVisitorConstructorWithDefaults,
} from "../cst/cst_visitor.js";
import {
  createToken,
  createTokenInstance,
  EOF,
} from "../../scan/tokens_public.js";
import {
  defaultGrammarValidatorErrorProvider,
  defaultParserErrorProvider,
} from "../errors_public.js";
import {
  EarlyExitException,
  isRecognitionException,
  MismatchedTokenException,
  NoViableAltException,
  NotAllInputParsedException,
} from "../exceptions_public.js";
import {
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
  getLookaheadPathsForOptionalProd,
  getLookaheadPathsForOr,
  PROD_TYPE,
} from "../grammar/lookahead.js";
import {
  resolveGrammar,
  validateGrammar,
} from "../grammar/gast/gast_resolver_public.js";
import {
  AtLeastOneSepMethodOpts,
  ConsumeMethodOpts,
  CstNode,
  CstNodeLocation,
  DSLMethodOpts,
  DSLMethodOptsWithErr,
  GrammarAction,
  IOrAlt,
  IParserConfig,
  IParserErrorMessageProvider,
  IProduction,
  ICstVisitor,
  IRecognitionException,
  IRuleConfig,
  ISerializedGast,
  IToken,
  ITokenGrammarPath,
  ManySepMethodOpts,
  nodeLocationTrackingOptions,
  OrMethodOpts,
  ParserMethod,
  SubruleMethodOpts,
  TokenType,
  TokenTypeDictionary,
  TokenVocabulary,
} from "@chevrotain/types";
import {
  AbstractNextTerminalAfterProductionWalker,
  IFirstAfterRepetition,
  NextAfterTokenWalker,
  NextTerminalAfterAtLeastOneSepWalker,
  NextTerminalAfterAtLeastOneWalker,
  NextTerminalAfterManySepWalker,
  NextTerminalAfterManyWalker,
} from "../grammar/interpreter.js";
import { IN } from "../constants.js";
import { ILookaheadStrategy } from "@chevrotain/types";
import { LLkLookaheadStrategy } from "../grammar/llk_lookahead.js";
// TreeBuilder absorbed into Parser (Stage 7)
// LexerAdapter absorbed into Parser (Stage 7)
// RecognizerApi absorbed into Parser (Stage 7)
// RecognizerEngine absorbed into Parser (Stage 7)

// ErrorHandler absorbed into Parser (Stage 7)
// GastRecorder absorbed into Parser (Stage 7)
import { applyMixins } from "./utils/apply_mixins.js";
import { IParserDefinitionError } from "../grammar/types.js";
import {
  Alternation,
  Alternative,
  NonTerminal,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule,
  serializeGrammar,
  Terminal,
} from "@chevrotain/gast";
import { Lexer } from "../../scan/lexer_public.js";
import {
  augmentTokenTypes,
  hasShortKeyProperty,
  isTokenType,
  tokenStructuredMatcher,
  tokenStructuredMatcherNoCategories,
} from "../../scan/tokens.js";
import { IParserConfigInternal, ParserMethodInternal } from "./types.js";
import {
  gastAssertMethodIdxIsValid,
  gastGetIdxSuffix,
  gastRecordOrProd,
  gastRecordProd,
} from "./gast_recorder_utils.js";
import {
  addOrFastMapEntry,
  cloneSparseArray,
  cloneSparseNumberArrayTable,
  cloneSparseRecordTable,
  cloneSparseValueTable,
} from "./forgiving_parser_utils.js";
import { first as gastFirst } from "../grammar/first.js";
import {
  AT_LEAST_ONE_IDX,
  AT_LEAST_ONE_SEP_IDX,
  BITS_FOR_METHOD_TYPE,
  BITS_FOR_OCCURRENCE_IDX,
  getKeyForAutomaticLookahead,
  MANY_IDX,
  MANY_SEP_IDX,
  OPTION_IDX,
  OR_IDX,
} from "../grammar/keys.js";
import {
  validateLookahead,
  validateRuleIsOverridden,
} from "../grammar/checks.js";

// Hoist Array.isArray to a module-level variable so the JIT sees a
// stable reference rather than a property lookup on the Array global.
const { isArray } = Array;

export const END_OF_FILE = createTokenInstance(
  EOF,
  "",
  NaN,
  NaN,
  NaN,
  NaN,
  NaN,
  NaN,
);
Object.freeze(END_OF_FILE);

export type TokenMatcher = (token: IToken, tokType: TokenType) => boolean;

export const DEFAULT_PARSER_CONFIG: Required<
  Omit<IParserConfigInternal, "lookaheadStrategy">
> = Object.freeze({
  recoveryEnabled: false,
  maxLookahead: 3,
  dynamicTokensEnabled: false,
  outputCst: true,
  errorMessageProvider: defaultParserErrorProvider,
  nodeLocationTracking: "none",
  traceInitPerf: false,
  skipValidations: false,
});

export const DEFAULT_RULE_CONFIG: Required<IRuleConfig<any>> = Object.freeze({
  recoveryValueFunc: () => undefined,
  resyncEnabled: true,
});

export enum ParserDefinitionErrorType {
  INVALID_RULE_NAME = 0,
  DUPLICATE_RULE_NAME = 1,
  INVALID_RULE_OVERRIDE = 2,
  DUPLICATE_PRODUCTIONS = 3,
  UNRESOLVED_SUBRULE_REF = 4,
  LEFT_RECURSION = 5,
  NONE_LAST_EMPTY_ALT = 6,
  AMBIGUOUS_ALTS = 7,
  CONFLICT_TOKENS_RULES_NAMESPACE = 8,
  INVALID_TOKEN_NAME = 9,
  NO_NON_EMPTY_LOOKAHEAD = 10,
  AMBIGUOUS_PREFIX_ALTS = 11,
  TOO_MANY_ALTS = 12,
  CUSTOM_LOOKAHEAD_VALIDATION = 13,
}

export interface IParserDuplicatesDefinitionError extends IParserDefinitionError {
  dslName: string;
  occurrence: number;
  parameter?: string;
}

export interface IParserEmptyAlternativeDefinitionError extends IParserDefinitionError {
  occurrence: number;
  alternative: number;
}

export interface IParserAmbiguousAlternativesDefinitionError extends IParserDefinitionError {
  occurrence: number | string;
  alternatives: number[];
}

export interface IParserUnresolvedRefDefinitionError extends IParserDefinitionError {
  unresolvedRefName: string;
}

export interface IParserState {
  errors: IRecognitionException[];
  lexerState: any;
  RULE_STACK: number[];
  CST_STACK: CstNode[];
}

/**
 * Lightweight snapshot used by saveRecogState/reloadRecogState.
 * Three integers instead of array clones — V8 can scalar-replace this
 * entirely in a hot BACKTRACK() loop.
 */
export interface IParserSavepoint {
  pos: number;
  errorsLength: number;
  ruleStackDepth: number;
}

export type Predicate = () => boolean;

export function EMPTY_ALT(): () => undefined;
export function EMPTY_ALT<T>(value: T): () => T;
export function EMPTY_ALT(value: any = undefined) {
  return function () {
    return value;
  };
}

// --- Recoverable module-level constants (absorbed from trait) ---

export const EOF_FOLLOW_KEY: any = {};

export interface IFollowKey {
  ruleName: string;
  idxInCallingRule: number;
  inRule: string;
}

export const IN_RULE_RECOVERY_EXCEPTION = "InRuleRecoveryException";

export class InRuleRecoveryException extends Error {
  constructor(message: string) {
    super(message);
    this.name = IN_RULE_RECOVERY_EXCEPTION;
  }
}

export function attemptInRepetitionRecovery(
  prodFunc: Function,
  args: any[],
  lookaheadFunc: () => boolean,
  dslMethodIdx: number,
  prodOccurrence: number,
  nextToksWalker: typeof AbstractNextTerminalAfterProductionWalker,
  notStuck?: boolean,
): void {
  const key = getKeyForAutomaticLookahead(
    this.currRuleShortName,
    dslMethodIdx,
    prodOccurrence,
  );
  let firstAfterRepInfo = this.firstAfterRepMap[key];
  if (firstAfterRepInfo === undefined) {
    const currRuleName = this.getCurrRuleFullName();
    const ruleGrammar = this.getGAstProductions()[currRuleName];
    const walker: AbstractNextTerminalAfterProductionWalker =
      new nextToksWalker(ruleGrammar, prodOccurrence);
    firstAfterRepInfo = walker.startWalking();
    this.firstAfterRepMap[key] = firstAfterRepInfo;
  }

  let expectTokAfterLastMatch = firstAfterRepInfo.token;
  let nextTokIdx = firstAfterRepInfo.occurrence;
  const isEndOfRule = firstAfterRepInfo.isEndOfRule;

  // special edge case of a TOP most repetition after which the input should END.
  // this will force an attempt for inRule recovery in that scenario.
  if (
    this.RULE_STACK_IDX === 0 &&
    isEndOfRule &&
    expectTokAfterLastMatch === undefined
  ) {
    expectTokAfterLastMatch = EOF;
    nextTokIdx = 1;
  }

  // We don't have anything to re-sync to...
  // this condition was extracted from `shouldInRepetitionRecoveryBeTried` to act as a type-guard
  if (expectTokAfterLastMatch === undefined || nextTokIdx === undefined) {
    return;
  }

  if (
    this.shouldInRepetitionRecoveryBeTried(
      expectTokAfterLastMatch,
      nextTokIdx,
      notStuck,
    )
  ) {
    // TODO: performance optimization: instead of passing the original args here, we modify
    // the args param (or create a new one) and make sure the lookahead func is explicitly provided
    // to avoid searching the cache for it once more.
    this.tryInRepetitionRecovery(
      prodFunc,
      args,
      lookaheadFunc,
      expectTokAfterLastMatch,
    );
  }
}

// --- RecognizerEngine module-level constants (absorbed from trait) ---

/**
 * Thrown instead of MismatchedTokenException during speculative parsing
 * (IS_SPECULATING === true). A Symbol throw has zero allocation cost — V8
 * never calls Error.captureStackTrace for non-Error throws, so every failed
 * BACKTRACK() alternative costs nothing in GC pressure.
 */
export const SPEC_FAIL = Symbol("SPEC_FAIL");
/** Sentinel returned by OR dispatch closures when no alt matched. */
export const OR_NO_MATCH = Symbol("OR_NO_MATCH");

/**
 * For LL(1) no-predicate OR sites: builds a tokenTypeIdx→altIdx map so the
 * dispatch closure can do a single array lookup instead of an indirect
 * laFunc.call(). V8 cannot inline laFunc through Function.prototype.call, so
 * the indirect call shows up as a separate hot function in profiles. Inlining
 * the map lookup eliminates that call frame entirely.
 *
 * Returns null when any path has length > 1 (LL(k>1) grammar) — the caller
 * falls back to the laFunc approach.
 */
export function buildOrChoiceMap(
  paths: TokenType[][][],
): Record<number, number> | null {
  for (const altPaths of paths) {
    for (const path of altPaths) {
      if (path.length !== 1) return null;
    }
  }
  const map: Record<number, number> = Object.create(null);
  for (let altIdx = 0; altIdx < paths.length; altIdx++) {
    for (const path of paths[altIdx]) {
      const tok = path[0];
      const tidx = tok.tokenTypeIdx;
      if (tidx !== undefined && !(tidx in map)) {
        map[tidx] = altIdx;
      }
      if (tok.categoryMatches !== undefined) {
        for (const catIdx of tok.categoryMatches) {
          if (!Object.hasOwn(map, catIdx)) {
            map[catIdx] = altIdx;
          }
        }
      }
    }
  }
  return map;
}

// Entries >= GATED_OFFSET encode "altIdx + GATED_OFFSET" meaning the alt is
// correct but preceding gated alts must be checked first. Decoding is just
// `entry - GATED_OFFSET`. For gate-free grammars all entries are 0-255 so
// the check `>= GATED_OFFSET` is a single integer comparison — zero cost.
export const GATED_OFFSET = 256;

/**
 * Thrown by `consumeInternal` when `_earlyExitLookahead` is true and a token
 * successfully matches. This aborts the action immediately after the first
 * successful CONSUME, preventing embedded-action side effects from executing
 * inside `makeSpecLookahead`. The caller catches this and returns `true`.
 */
const FIRST_TOKEN_MATCH = Symbol("FIRST_TOKEN_MATCH");

// --- GastRecorder module-level constants (absorbed from trait) ---
type ProdWithDef = IProduction & { definition?: IProduction[] };
const RECORDING_NULL_OBJECT = {
  description: "This Object indicates the Parser is during Recording Phase",
};
Object.freeze(RECORDING_NULL_OBJECT);

const HANDLE_SEPARATOR = true;
// Hardcoded ceiling independent of BITS_FOR_OCCURRENCE_IDX — _dslCounter counts
// all DSL calls flat in a rule body, not just occurrence indices within one type.
const MAX_METHOD_IDX = 127;

const RFT = createToken({ name: "RECORDING_PHASE_TOKEN", pattern: Lexer.NA });
augmentTokenTypes([RFT]);
const RECORDING_PHASE_TOKEN = createTokenInstance(
  RFT,
  "This IToken indicates the Parser is in Recording Phase\n\t" +
    "See: https://chevrotain.io/docs/guide/internals.html#grammar-recording for details",
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
);
Object.freeze(RECORDING_PHASE_TOKEN);

const RECORDING_PHASE_CSTNODE: CstNode = {
  name:
    "This CSTNode indicates the Parser is in Recording Phase\n\t" +
    "See: https://chevrotain.io/docs/guide/internals.html#grammar-recording for details",
  children: {},
};

const RECORDING_API_METHOD_NAMES: readonly string[] = (() => {
  const names = [
    "consume",
    "subrule",
    "option",
    "or",
    "many",
    "manySep",
    "atLeastOne",
    "atLeastOneSep",
    "ACTION",
    "BACKTRACK",
    "LA",
  ];
  for (let i = 0; i < 10; i++) {
    const idx = i > 0 ? String(i) : "";
    names.push(
      `CONSUME${idx}`,
      `SUBRULE${idx}`,
      `OPTION${idx}`,
      `OR${idx}`,
      `MANY${idx}`,
      `MANY_SEP${idx}`,
      `AT_LEAST_ONE${idx}`,
      `AT_LEAST_ONE_SEP${idx}`,
    );
  }
  return names;
})();

// --- TreeBuilder module-level helpers (absorbed from trait) ---

/**
 * Fixed-shape CstNode factory. Pre-declaring all fields — including the
 * optional `recoveredNode` and `location` — ensures every CstNode object
 * shares a single V8 hidden class from birth, keeping call sites that read
 * these fields monomorphic.
 */
function createCstNode(name: string): CstNode {
  return {
    name,
    children: Object.create(null),
    location: undefined,
  } as unknown as CstNode;
}

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

/**
 * Watermark snapshot of a CST node's mutable state taken before a
 * non-speculative parse attempt that may fail (OPTION, AT_LEAST_ONE, OR
 * committed fast-path). Stores each existing child array's length so that
 * restoreCheckpoint() can truncate — no .slice() copies, no new objects.
 */
export interface CstTopSave {
  keys: string[];
  lens: number[];
  location: Record<string, number> | undefined;
}

export class ParserBase {
  // Set this flag to true if you don't want the Parser to throw error when problems in it's definition are detected.
  // (normally during the parser's constructor).
  // This is a design time flag, it will not affect the runtime error handling of the parser, just design time errors,
  // for example: duplicate rule names, referencing an unresolved subrule, etc...
  // This flag should not be enabled during normal usage, it is used in special situations, for example when
  // needing to display the parser definition errors in some GUI(online playground).
  static DEFER_DEFINITION_ERRORS_HANDLING: boolean = false;

  /**
   *  @deprecated use the **instance** method with the same name instead
   */
  static performSelfAnalysis(parserInstance: ParserBase): void {
    throw Error(
      "The **static** `performSelfAnalysis` method has been deprecated." +
        "\t\nUse the **instance** method with the same name instead.",
    );
  }

  public performSelfAnalysis(): void {
    this.TRACE_INIT("performSelfAnalysis", () => {
      let defErrorsMsgs;

      this.selfAnalysisDone = true;
      const className = this.className;

      this.TRACE_INIT("toFastProps", () => {
        // Without this voodoo magic the parser would be x3-x4 slower
        // It seems it is better to invoke `toFastProperties` **before**
        // Any manipulations of the `this` object done during the recording phase.
        toFastProperties(this);
      });

      this.TRACE_INIT("Grammar Recording", () => {
        try {
          this.enableRecording();
          // Building the GAST
          this.definedRulesNames.forEach((currRuleName: string) => {
            const wrappedRule = (this as any)[
              currRuleName
            ] as ParserMethodInternal<unknown[], unknown>;
            const originalGrammarAction = wrappedRule["originalGrammarAction"];
            let recordedRuleGast!: Rule;
            this.TRACE_INIT(`${currRuleName} Rule`, () => {
              recordedRuleGast = this.topLevelRuleRecord(
                currRuleName,
                originalGrammarAction,
              );
            });
            this.gastProductionsCache[currRuleName] = recordedRuleGast;
          });
        } finally {
          this.disableRecording();
        }
      });

      let resolverErrors: IParserDefinitionError[] = [];
      this.TRACE_INIT("Grammar Resolving", () => {
        resolverErrors = resolveGrammar({
          rules: Object.values(this.gastProductionsCache),
        });
        this.definitionErrors = this.definitionErrors.concat(resolverErrors);
      });

      this.TRACE_INIT("Grammar Validations", () => {
        // only perform additional grammar validations IFF no resolving errors have occurred.
        // as unresolved grammar may lead to unhandled runtime exceptions in the follow up validations.
        if (resolverErrors.length === 0 && this.skipValidations === false) {
          const validationErrors = validateGrammar({
            rules: Object.values(this.gastProductionsCache),
            tokenTypes: Object.values(this.tokensMap),
            errMsgProvider: defaultGrammarValidatorErrorProvider,
            grammarName: className,
          });
          this.definitionErrors =
            this.definitionErrors.concat(validationErrors);

          const lookaheadValidationErrors = validateLookahead({
            lookaheadStrategy: this.lookaheadStrategy,
            rules: Object.values(this.gastProductionsCache),
            tokenTypes: Object.values(this.tokensMap),
            grammarName: className,
          });
          this.definitionErrors = this.definitionErrors.concat(
            lookaheadValidationErrors,
          );
        }
      });

      // this analysis may fail if the grammar is not perfectly valid
      if (this.definitionErrors.length === 0) {
        // Follow sets are only needed for resync recovery.
        if (this.recoveryEnabled) {
          this.TRACE_INIT("computeAllProdsFollows", () => {
            const allFollows = computeAllProdsFollows(
              Object.values(this.gastProductionsCache),
            );
            this.resyncFollows = allFollows;
          });
        }

        this.TRACE_INIT("preComputeProdLookaheadCaches", () => {
          this.preComputeLookaheadCaches(false);
        });

        if (this.lookaheadStrategy instanceof LLkLookaheadStrategy) {
          // Pre-populate OR fast-dispatch maps from GAST first-token sets.
          // This gives committed dispatch (no try/catch) from the very
          // first parse — equivalent to upstream's preComputeLookaheadFunctions.
          this.TRACE_INIT("prePopulateOrFastMaps", () => {
            this.prePopulateOrFastMaps();
          });
        } else {
          this.TRACE_INIT("preComputeAlternationLookaheadCaches", () => {
            this.preComputeLookaheadCaches(true);
          });
        }
      }

      if (
        !(this.constructor as typeof ParserBase)
          .DEFER_DEFINITION_ERRORS_HANDLING &&
        this.definitionErrors.length !== 0
      ) {
        defErrorsMsgs = this.definitionErrors.map(
          (defError) => defError.message,
        );
        throw new Error(
          `Parser Definition Errors detected:\n ${defErrorsMsgs.join(
            "\n-------------------------------\n",
          )}`,
        );
      }
    });
  }

  /**
   * Pre-populate `_orFastMaps` and `_orCommittable` from GAST first-token
   * sets. This is the equivalent of upstream Chevrotain's
   * `preComputeLookaheadFunctions` — it gives committed dispatch (no
   * try/catch) from the very first parse call.
   *
   * For each OR (Alternation) in the grammar:
   * - Compute first-token set per alt using `gastFirst()`
   * - Map each `tokenTypeIdx` (including category matches) → alt index
   * - Mark ambiguous entries (-1) when multiple alts share a first token
   * - Mark entries as committable when the alt's first production is NOT
   *   optional (no OPTION/MANY prefix → first token uniquely determines path)
   */
  prePopulateOrFastMaps(): void {
    const rules = Object.values(this.gastProductionsCache);
    for (const rule of rules) {
      const ruleShortName = this.fullRuleNameToShort[rule.name];
      if (ruleShortName === undefined) continue;

      // Recursively find all production nodes in this rule's GAST.
      const alternations: InstanceType<typeof Alternation>[] = [];
      type RepInfo = {
        prod: IProduction & { idx: number; definition: IProduction[] };
        keyIdx: number; // for getKeyForAutomaticLookahead
        prodType: PROD_TYPE; // for getLookaheadPathsForOptionalProd
      };
      const repetitions: RepInfo[] = [];
      const findProductions = (prods: IProduction[]) => {
        for (const prod of prods) {
          if (prod instanceof NonTerminal) continue;
          if (prod instanceof Alternation) {
            alternations.push(prod);
          } else if (prod instanceof Repetition) {
            repetitions.push({
              prod,
              keyIdx: MANY_IDX,
              prodType: PROD_TYPE.REPETITION,
            });
          } else if (prod instanceof RepetitionMandatory) {
            repetitions.push({
              prod,
              keyIdx: AT_LEAST_ONE_IDX,
              prodType: PROD_TYPE.REPETITION_MANDATORY,
            });
          } else if (prod instanceof Option) {
            repetitions.push({
              prod,
              keyIdx: OPTION_IDX,
              prodType: PROD_TYPE.OPTION,
            });
          }
          if ("definition" in prod && isArray(prod.definition)) {
            findProductions(prod.definition);
          }
        }
      };
      findProductions(rule.definition);

      for (const node of alternations) {
        const mapKey = ruleShortName | node.idx;
        const alts = node.definition; // Alternative[]
        let map = this._orFastMaps[mapKey];
        if (map === undefined) {
          map = Object.create(null);
          this._orFastMaps[mapKey] = map;
        }
        let cm = this._orCommittable[mapKey];
        if (cm === undefined) {
          cm = Object.create(null);
          this._orCommittable[mapKey] = cm;
        }

        // If any alt has predicates (GATE), skip GAST pre-population
        // for this OR entirely — runtime gate evaluation must determine
        // dispatch, not static first-token sets.
        if (node.hasPredicates) continue;

        for (let altIdx = 0; altIdx < alts.length; altIdx++) {
          const alt = alts[altIdx];
          const firstTokens = gastFirst(alt);

          // Committable: the first production in the alt is NOT optional.
          // If it's Option/Repetition, the first token could match the
          // OPTION body OR skip it, so committed dispatch is unsafe.
          const firstProd = alt.definition[0];
          const isCommittable =
            firstProd !== undefined &&
            !(firstProd instanceof Option) &&
            !(firstProd instanceof Repetition) &&
            !(firstProd instanceof RepetitionWithSeparator);

          const hasGate = false; // No gates if we passed the check above

          for (const tokType of firstTokens) {
            const tidx = tokType.tokenTypeIdx;
            if (tidx === undefined) continue;
            this.populateFastMapEntry(
              map,
              cm,
              tidx,
              altIdx,
              isCommittable,
              hasGate,
            );

            // Token categories: each categoryMatch idx is also valid.
            if (tokType.categoryMatches) {
              for (const catIdx of tokType.categoryMatches) {
                this.populateFastMapEntry(
                  map,
                  cm,
                  catIdx,
                  altIdx,
                  isCommittable,
                  hasGate,
                );
              }
            }
          }
        }
      }

      // Build LL(k) lookahead functions for each OR.
      // These precomputed closures replace speculative backtracking entirely.
      // For LL(1) grammars: hash map lookup (same as fast-map, but as a closure).
      // For LL(k>1): nested token-matching loop up to maxLookahead tokens.
      for (const node of alternations) {
        const mapKey = ruleShortName | node.idx;
        const prodMaxLA = (node as any).maxLookahead ?? this.maxLookahead;
        try {
          const paths = getLookaheadPathsForOr(node.idx, rule, prodMaxLA);
          // Capture counter management as closure variables so the hot
          // path avoids _orAltCounterStarts[mapKey] and _orCounterDeltas[mapKey]
          // property lookups. These values are known statically from recording.
          const altStarts = this._orAltCounterStarts[mapKey];
          const counterDelta = this._orCounterDeltas[mapKey];
          // For LL(1) no-predicate grammars, inline the token→altIdx map
          // directly into the dispatch closure — eliminates the indirect
          // laFunc.call() overhead (V8 cannot inline through Function.prototype.call).
          const choiceToAlt =
            !node.hasPredicates && !this.dynamicTokensEnabled
              ? buildOrChoiceMap(paths)
              : null;
          const needsCounter = orNeedsCounterManagement(
            node,
            rule,
            this.recoveryEnabled,
          );
          if (choiceToAlt !== null) {
            // LL(1) inline dispatch: single map lookup, no function call.
            if (
              needsCounter &&
              altStarts !== undefined &&
              counterDelta !== undefined
            ) {
              this._orLookahead[mapKey] = function orDispatchLL1(
                this: ParserBase,
                alts: IOrAlt<any>[],
              ): any {
                const altIdx =
                  choiceToAlt[this.tokVector[this.currIdx + 1].tokenTypeIdx!];
                if (altIdx !== undefined) {
                  const saved = this._dslCounter;
                  this._dslCounter = saved + altStarts[altIdx];
                  const r = alts[altIdx].ALT.call(this);
                  this._dslCounter = saved + counterDelta;
                  return r;
                }
                return OR_NO_MATCH;
              };
            } else {
              // Tiny closure: only looks up altIdx — no alts arg, no ALT call.
              // OR() calls alts[altIdx].ALT.call(this) directly, making this
              // closure small enough for V8 to inline at the call site.
              this._orLookaheadLL1[mapKey] = function orDispatchLL1Simple(
                this: ParserBase,
              ): number | undefined {
                return choiceToAlt[
                  this.tokVector[this.currIdx + 1].tokenTypeIdx!
                ];
              };
            }
          } else {
            // LL(k>1) or has predicates: use laFunc via indirect call.
            const tmatcher = this.tokenMatcher;
            const laFunc = buildAlternativesLookAheadFunc(
              paths,
              node.hasPredicates,
              tmatcher,
              this.dynamicTokensEnabled,
            );
            if (
              needsCounter &&
              altStarts !== undefined &&
              counterDelta !== undefined
            ) {
              this._orLookahead[mapKey] = function orDispatch(
                this: ParserBase,
                alts: IOrAlt<any>[],
              ): any {
                const altIdx = laFunc.call(this, alts);
                if (altIdx !== undefined) {
                  const saved = this._dslCounter;
                  this._dslCounter = saved + altStarts[altIdx];
                  const r = alts[altIdx].ALT.call(this);
                  this._dslCounter = saved + counterDelta;
                  return r;
                }
                return OR_NO_MATCH;
              };
            } else {
              this._orLookahead[mapKey] = function orDispatchSimple(
                this: ParserBase,
                alts: IOrAlt<any>[],
              ): any {
                const altIdx = laFunc.call(this, alts);
                if (altIdx !== undefined) {
                  return alts[altIdx].ALT.call(this);
                }
                return OR_NO_MATCH;
              };
            }
          }
        } catch (_e) {
          // GAST walk failed — fall back to speculative dispatch.
        }
      }

      // Build discriminating lookahead sets for MANY/OPTION/AT_LEAST_ONE.
      // Uses getLookaheadPathsForOptionalProd which computes BOTH the
      // body's first tokens AND the REST tokens (what follows), then
      // finds discriminating sequences. For LL(1), this is the body's
      // first tokens MINUS any tokens shared with REST.
      for (const { prod, keyIdx, prodType } of repetitions) {
        const laKey = getKeyForAutomaticLookahead(
          ruleShortName,
          keyIdx,
          prod.idx,
        );
        let paths;
        try {
          // Use per-production maxLookahead if set (MAX_LOOKAHEAD option),
          // otherwise fall back to the parser-level maxLookahead.
          const prodMaxLA = (prod as any).maxLookahead ?? this.maxLookahead;
          paths = getLookaheadPathsForOptionalProd(
            prod.idx,
            rule,
            prodType,
            prodMaxLA,
          );
        } catch (_e) {
          // GAST walk failed (e.g., unresolved NonTerminal refs) — skip.
          // GAST walk failed — skip this production.
          continue;
        }
        // paths[0] = inside paths (enter body), paths[1] = after paths (skip)
        const insidePaths = paths[0];
        const afterPaths = paths[1];
        if (insidePaths === undefined || insidePaths.length === 0) continue;
        // Skip if inside and after paths overlap — committed dispatch would
        // enter the body when it should skip. This happens when the
        // production's maxLookahead is too low to disambiguate.
        if (afterPaths !== undefined && afterPaths.length > 0) {
          const insideFirst = new Set(
            insidePaths
              .filter((p) => p.length > 0)
              .map((p) => p[0]?.tokenTypeIdx),
          );
          const hasOverlap = afterPaths.some(
            (p) => p.length > 0 && insideFirst.has(p[0]?.tokenTypeIdx),
          );
          if (hasOverlap) continue;
        }
        // Build an LL(k) lookahead closure.
        const tmatcher = this.tokenMatcher;
        this._prodLookahead[laKey] = buildSingleAlternativeLookaheadFunction(
          insidePaths,
          tmatcher,
          this.dynamicTokensEnabled,
        );
      }
    }
  }

  preComputeLookaheadCaches(includeAlternations: boolean): void {
    const rules = Object.values(this.gastProductionsCache);
    for (const rule of rules) {
      const ruleShortName = this.fullRuleNameToShort[rule.name];
      if (ruleShortName === undefined) continue;

      const alternations: InstanceType<typeof Alternation>[] = [];
      type RepInfo = {
        prod: IProduction & { idx: number };
        keyIdx: number;
        prodType:
          | "Option"
          | "RepetitionMandatory"
          | "RepetitionMandatoryWithSeparator"
          | "Repetition"
          | "RepetitionWithSeparator";
      };
      const repetitions: RepInfo[] = [];
      const findProductions = (prods: IProduction[]) => {
        for (const prod of prods) {
          if (prod instanceof NonTerminal) continue;
          if (prod instanceof Alternation) {
            alternations.push(prod);
          } else if (prod instanceof Repetition) {
            repetitions.push({
              prod,
              keyIdx: MANY_IDX,
              prodType: "Repetition",
            });
          } else if (prod instanceof RepetitionMandatory) {
            repetitions.push({
              prod,
              keyIdx: AT_LEAST_ONE_IDX,
              prodType: "RepetitionMandatory",
            });
          } else if (prod instanceof RepetitionWithSeparator) {
            repetitions.push({
              prod,
              keyIdx: MANY_SEP_IDX,
              prodType: "RepetitionWithSeparator",
            });
          } else if (prod instanceof RepetitionMandatoryWithSeparator) {
            repetitions.push({
              prod,
              keyIdx: AT_LEAST_ONE_SEP_IDX,
              prodType: "RepetitionMandatoryWithSeparator",
            });
          } else if (prod instanceof Option) {
            repetitions.push({
              prod,
              keyIdx: OPTION_IDX,
              prodType: "Option",
            });
          }
          if ("definition" in prod && isArray(prod.definition)) {
            findProductions(prod.definition);
          }
        }
      };
      findProductions(rule.definition);

      if (includeAlternations) {
        for (const node of alternations) {
          const mapKey = ruleShortName | node.idx;
          const laFunc = this.lookaheadStrategy.buildLookaheadForAlternation({
            prodOccurrence: node.idx,
            rule,
            maxLookahead: (node as any).maxLookahead ?? this.maxLookahead,
            hasPredicates: node.hasPredicates,
            dynamicTokensEnabled: this.dynamicTokensEnabled,
          });
          this._orLookahead[mapKey] = function orDispatchStrategy(
            this: ParserBase,
            orAlts: IOrAlt<any>[],
          ): any {
            const altIdx = laFunc.call(this, orAlts);
            if (altIdx !== undefined) {
              return orAlts[altIdx].ALT.call(this);
            }
            return OR_NO_MATCH;
          };
        }
      }

      for (const { prod, keyIdx, prodType } of repetitions) {
        const laKey = getKeyForAutomaticLookahead(
          ruleShortName,
          keyIdx,
          prod.idx,
        );
        this._prodLookahead[laKey] =
          this.lookaheadStrategy.buildLookaheadForOptional({
            prodOccurrence: prod.idx,
            rule,
            maxLookahead: (prod as any).maxLookahead ?? this.maxLookahead,
            dynamicTokensEnabled: this.dynamicTokensEnabled,
            prodType,
          }) as () => boolean;
      }
    }
  }

  /** Helper for prePopulateOrFastMaps — adds one tokenTypeIdx entry. */
  private populateFastMapEntry(
    map: Record<number, number>,
    cm: Record<number, boolean>,
    tidx: number,
    altIdx: number,
    isCommittable: boolean,
    hasGate: boolean,
  ): void {
    const existing = map[tidx];
    if (existing === undefined) {
      map[tidx] = hasGate ? altIdx + GATED_OFFSET : altIdx;
      if (isCommittable && !hasGate) {
        cm[tidx] = true;
      }
    } else if (existing >= 0) {
      const existingAlt =
        existing >= GATED_OFFSET ? existing - GATED_OFFSET : existing;
      if (existingAlt !== altIdx) {
        map[tidx] = -1; // ambiguous
        cm[tidx] = false;
      }
    }
  }

  ensureGastProductionsCachePopulated(): void {
    if (!this.selfAnalysisDone) {
      throw Error(
        `Missing <performSelfAnalysis> invocation at the end of the Parser's constructor.`,
      );
    }
  }

  definitionErrors: IParserDefinitionError[] = [];
  selfAnalysisDone = false;
  protected skipValidations: boolean;

  // --- RecognizerEngine (absorbed from trait) ---
  /**
   * True while inside a speculative context (BACKTRACK, MANY iteration, OR
   * speculative attempt). When true, CONSUME throws the zero-cost SPEC_FAIL
   * symbol instead of allocating a MismatchedTokenException.
   */
  IS_SPECULATING!: boolean;
  /**
   * True only inside an explicit BACKTRACK() call. Unlike IS_SPECULATING (which
   * is also set by MANY/AT_LEAST_ONE iterations and OR speculative attempts),
   * this flag signals that we must NOT commit to any OR alternative even if it
   * made progress — because we are in a pure trial that must be rolled back.
   */
  _isInTrueBacktrack!: boolean;
  /** Set to true inside makeSpecLookahead to abort on the first successful CONSUME. */
  _earlyExitLookahead!: boolean;
  className!: string;
  RULE_STACK!: number[];
  RULE_OCCURRENCE_STACK!: number[];
  // Depth counters for the pre-allocated state stacks.
  // Using index-based access (arr[++idx] = val / idx--) instead of push/pop
  // avoids method-call overhead on every rule entry/exit.
  RULE_STACK_IDX!: number;
  // RULE_OCCURRENCE_STACK_IDX removed: always equals RULE_STACK_IDX since
  // both are incremented/decremented in lockstep in ruleInvocationStateUpdate
  // and ruleFinallyStateUpdate. All reads replaced with RULE_STACK_IDX.
  /**
   * Single auto-occurrence counter for ALL DSL methods. Every DSL call
   * (CONSUME, SUBRULE, OR, OPTION, MANY, etc.) increments this counter,
   * giving unique occurrence IDs per call site within a rule. Saved/restored
   * on rule entry/exit. One property access per DSL call — minimal overhead.
   */
  _dslCounter!: number;
  _dslCounterStack!: number[];
  definedRulesNames!: string[];
  tokensMap!: { [fqn: string]: TokenType };
  gastProductionsCache!: Record<string, Rule>;
  shortRuleNameToFull!: Record<string, string>;
  fullRuleNameToShort!: Record<string, number>;
  // The shortName Index must be coded "after" the first 8bits to enable building unique lookahead keys
  ruleShortNameIdx!: number;
  tokenMatcher!: TokenMatcher;
  subruleIdx!: number;
  // Cached value of the current rule's short name to avoid repeated RULE_STACK[length-1] lookups.
  // Updated on rule entry/exit and state reload.
  currRuleShortName!: number;
  /**
   * Lazy LL(1) fast-dispatch map, keyed by `currRuleShortName | occurrence`.
   * Inner key is `tokenTypeIdx` of the LA(1) token → alt index that matched.
   * Built from observations in the slow path. Direct O(1) lookup, no
   * allocation on the hot path.
   *
   * A value of `-1` means ambiguous (multiple alts observed for this
   * tokenTypeIdx) — fall through to the slow path.
   */
  _orFastMaps!: Record<number, Record<number, number>>;
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
  _orCounterDeltas!: Record<number, number>;
  /**
   * Per-OR per-alt counter starting offsets. During recording, each alt
   * runs sequentially, so alt i starts at `savedCounter + sum(deltas[0..i-1])`.
   * At runtime, before executing alt i, `_dslCounter` is set to
   * `savedCounter + _orAltCounterStarts[mapKey][i]`.
   */
  _orAltCounterStarts!: Record<number, number[]>;
  /**
   * Per-OR, per-tokenTypeIdx committability. `true` = the alt that matched
   * this token had no OPTION/MANY prefix, so committed dispatch is safe.
   * `false` = the alt has a prefix, needs speculation.
   */
  _orCommittable!: Record<number, Record<number, boolean>>;
  /**
   * Precomputed LL(k) lookahead functions for OR alternatives, built from
   * GAST during performSelfAnalysis. Each function takes the parser as
   * `this` and returns the alt index to take (or undefined if none match).
   * Replaces both the fast-map dispatch AND speculative backtracking.
   */
  _orLookahead!: Record<number, (orAlts: IOrAlt<any>[]) => number | undefined>;
  /**
   * LL(1) no-counter OR dispatch closures. Stored separately so the closure is
   * tiny (returns altIdx only, no ALT call) and V8 can inline it. OR() calls
   * alts[altIdx].ALT.call(this) directly after getting the index.
   */
  _orLookaheadLL1!: ((this: ParserBase) => number | undefined)[];
  /**
   * Precomputed first-token sets for MANY/OPTION/AT_LEAST_ONE bodies.
   * Keyed by `getKeyForAutomaticLookahead(ruleShortName, prodTypeIdx, occurrence)`.
   * Values: `Record<tokenTypeIdx, true>` — a hash set. When present,
   * the production uses `set[LA(1).tokenTypeIdx]` instead of speculative
   * try/catch — matching upstream's precomputed lookahead behavior.
   */
  /**
   * Precomputed LL(k) lookahead closures for MANY/OPTION/AT_LEAST_ONE.
   * Built by buildSingleAlternativeLookaheadFunction during performSelfAnalysis.
   * For LL(1): single token check. For LL(k>1): multi-token path matching.
   * Returns true if the body should be entered, false to skip.
   */
  _prodLookahead!: Record<number, () => boolean>;
  initRecognizerEngine(
    tokenVocabulary: TokenVocabulary,
    config: IParserConfig,
  ) {
    this.className = this.constructor.name;
    // TODO: would using an ES6 Map or plain object be faster (CST building scenario)
    this.shortRuleNameToFull = {};
    this.fullRuleNameToShort = {};
    this.ruleShortNameIdx = 0;
    this.tokenMatcher = tokenStructuredMatcherNoCategories;
    this.subruleIdx = 0;
    this.currRuleShortName = 0;
    this.IS_SPECULATING = false;
    this._isInTrueBacktrack = false;
    this._earlyExitLookahead = false;
    this._orFastMaps = [];
    this._orCounterDeltas = [];
    this._orAltCounterStarts = [];
    this._orCommittable = [];
    this._orLookahead = [];
    this._orLookaheadLL1 = [];
    this._prodLookahead = [];
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

    if (isArray(tokenVocabulary)) {
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

    if (isArray(tokenVocabulary)) {
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

    // Because ES2015+ syntax should be supported for creating Token classes
    // We cannot assume that the Token classes were created using the "extendToken" utilities
    // Therefore we must augment the Token classes both on Lexer initialization and on Parser initialization
    augmentTokenTypes(Object.values(this.tokensMap));

    // IMPORTANT: tokenMatcher selection must happen AFTER augmentTokenTypes()
    // which populates categoryMatches and MATCH_SET. Before augmentation,
    // categoryMatches is empty/undefined on all tokens, so the check would
    // always pick the no-categories matcher — breaking any grammar that
    // uses token categories (e.g. FunctionStart as parent of UrlStart).
    const allTokenTypes = Object.hasOwn(tokenVocabulary, "modes")
      ? (Object.values((<any>tokenVocabulary).modes) as any[][]).flat()
      : Object.values(tokenVocabulary);
    const noTokenCategoriesUsed = allTokenTypes.every(
      (tokenConstructor: any) => tokenConstructor.categoryMatches?.length == 0,
    );

    this.tokenMatcher = noTokenCategoriesUsed
      ? tokenStructuredMatcherNoCategories
      : tokenStructuredMatcher;
  }

  defineRule<ARGS extends unknown[], R>(
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
      coreRuleFunction = function invokeRuleWithTry(...args: ARGS): R {
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
      coreRuleFunction = function invokeRuleWithTryCst(...args: ARGS): R {
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
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
    occurrence: number,
  ): OUT | undefined {
    return this.optionInternalLogic(actionORMethodDef, occurrence);
  }

  optionInternalLogic<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
    occurrence?: number,
  ): OUT | undefined {
    const lookAheadFunc =
      occurrence !== undefined
        ? this.getStrictProdLookahead(occurrence, OPTION_IDX, "Option")
        : undefined;
    let action: GrammarAction<OUT>;
    if (typeof actionORMethodDef !== "function") {
      action = actionORMethodDef.DEF;
      const predicate = actionORMethodDef.GATE;
      if (predicate !== undefined && lookAheadFunc !== undefined) {
        const orgLookaheadFunction = lookAheadFunc;
        return (() => {
          if (!predicate.call(this)) return undefined;
          if (orgLookaheadFunction.call(this) !== true) return undefined;
          return action.call(this);
        })();
      }
    } else {
      action = actionORMethodDef;
    }

    if (lookAheadFunc?.call(this) === true) {
      return action.call(this);
    }
    return undefined;
  }

  atLeastOneInternal<OUT>(
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    return this.atLeastOneInternalLogic(prodOccurrence, actionORMethodDef);
  }

  atLeastOneInternalLogic<OUT>(
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const lookAheadFunc = this.getStrictProdLookahead(
      prodOccurrence,
      AT_LEAST_ONE_IDX,
      "RepetitionMandatory",
    );
    let action;
    if (typeof actionORMethodDef !== "function") {
      action = actionORMethodDef.DEF;
      const predicate = actionORMethodDef.GATE;
      if (predicate !== undefined && lookAheadFunc !== undefined) {
        const orgLookaheadFunction = lookAheadFunc;
        if (
          (() => predicate.call(this) && orgLookaheadFunction.call(this))() ===
          true
        ) {
          let notStuck = this.doSingleRepetition(action);
          while (
            (() =>
              predicate.call(this) && orgLookaheadFunction.call(this))() ===
              true &&
            notStuck
          ) {
            notStuck = this.doSingleRepetition(action);
          }
          this.attemptInRepetitionRecovery(
            this.atLeastOneInternal,
            [prodOccurrence, actionORMethodDef],
            (() =>
              predicate.call(this) && orgLookaheadFunction.call(this)) as any,
            AT_LEAST_ONE_IDX,
            prodOccurrence,
            NextTerminalAfterAtLeastOneWalker,
          );
          return;
        }
        throw this.raiseEarlyExitException(
          prodOccurrence,
          PROD_TYPE.REPETITION_MANDATORY,
          actionORMethodDef.ERR_MSG,
        );
      }
    } else {
      action = actionORMethodDef;
    }

    if (lookAheadFunc?.call(this) === true) {
      let notStuck = this.doSingleRepetition(action);
      while (lookAheadFunc.call(this) === true && notStuck) {
        notStuck = this.doSingleRepetition(action);
      }
    } else {
      throw this.raiseEarlyExitException(
        prodOccurrence,
        PROD_TYPE.REPETITION_MANDATORY,
        (actionORMethodDef as DSLMethodOptsWithErr<OUT>).ERR_MSG,
      );
    }

    this.attemptInRepetitionRecovery(
      this.atLeastOneInternal,
      [prodOccurrence, actionORMethodDef],
      lookAheadFunc as any,
      AT_LEAST_ONE_IDX,
      prodOccurrence,
      NextTerminalAfterAtLeastOneWalker,
    );
  }

  atLeastOneSepFirstInternal<OUT>(
    prodOccurrence: number,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    this.atLeastOneSepFirstInternalLogic(prodOccurrence, options);
  }

  atLeastOneSepFirstInternalLogic<OUT>(
    prodOccurrence: number,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const action = options.DEF;
    const separator = options.SEP;
    const firstIterationLookaheadFunc = this.getStrictProdLookahead(
      prodOccurrence,
      AT_LEAST_ONE_SEP_IDX,
      "RepetitionMandatoryWithSeparator",
    );

    if (firstIterationLookaheadFunc?.call(this) === true) {
      (action as GrammarAction<OUT>).call(this);

      const separatorLookAheadFunc = () => {
        return this.tokenMatcher(this.LA_FAST(1), separator);
      };

      while (this.tokenMatcher(this.LA_FAST(1), separator) === true) {
        this.CONSUME(separator);
        (action as GrammarAction<OUT>).call(this);
      }

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
    } else {
      throw this.raiseEarlyExitException(
        prodOccurrence,
        PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
        options.ERR_MSG,
      );
    }
  }

  manyInternal<OUT>(
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    return this.manyInternalLogic(prodOccurrence, actionORMethodDef);
  }

  manyInternalLogic<OUT>(
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const lookaheadFunction = this.getStrictProdLookahead(
      prodOccurrence,
      MANY_IDX,
      "Repetition",
    );
    let action;
    if (typeof actionORMethodDef !== "function") {
      action = actionORMethodDef.DEF;
      const predicate = actionORMethodDef.GATE;
      if (predicate !== undefined && lookaheadFunction !== undefined) {
        const orgLookaheadFunction = lookaheadFunction;
        let notStuck = true;
        const wrappedLookahead = () =>
          predicate.call(this) && orgLookaheadFunction.call(this);
        while (wrappedLookahead() === true && notStuck === true) {
          notStuck = this.doSingleRepetition(action);
        }
        this.attemptInRepetitionRecovery(
          this.manyInternal,
          [prodOccurrence, actionORMethodDef],
          wrappedLookahead as any,
          MANY_IDX,
          prodOccurrence,
          NextTerminalAfterManyWalker,
          notStuck,
        );
        return;
      }
    } else {
      action = actionORMethodDef;
    }

    let notStuck = true;
    while (lookaheadFunction?.call(this) === true && notStuck === true) {
      notStuck = this.doSingleRepetition(action);
    }

    this.attemptInRepetitionRecovery(
      this.manyInternal,
      [prodOccurrence, actionORMethodDef],
      lookaheadFunction as any,
      MANY_IDX,
      prodOccurrence,
      NextTerminalAfterManyWalker,
      notStuck,
    );
  }

  manySepFirstInternal<OUT>(
    prodOccurrence: number,
    options: ManySepMethodOpts<OUT>,
  ): void {
    this.manySepFirstInternalLogic(prodOccurrence, options);
  }

  manySepFirstInternalLogic<OUT>(
    prodOccurrence: number,
    options: ManySepMethodOpts<OUT>,
  ): void {
    const action = options.DEF;
    const separator = options.SEP;
    const firstIterationLaFunc = this.getStrictProdLookahead(
      prodOccurrence,
      MANY_SEP_IDX,
      "RepetitionWithSeparator",
    );

    if (firstIterationLaFunc?.call(this) === true) {
      action.call(this);

      const separatorLookAheadFunc = () => {
        return this.tokenMatcher(this.LA_FAST(1), separator);
      };
      while (this.tokenMatcher(this.LA_FAST(1), separator) === true) {
        this.CONSUME(separator);
        action.call(this);
      }

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
  }

  /**
   * Returns a speculative lookahead predicate for the given action, used
   * exclusively by attemptInRepetitionRecovery (which is a NOOP when recovery
   * is disabled). The predicate saves state, runs the action speculatively,
   * and always restores — returning true iff the action would succeed.
   */
  makeSpecLookahead(action: GrammarAction<any>): () => boolean {
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
        if (e === FIRST_TOKEN_MATCH) return true;
        if (e === SPEC_FAIL || isRecognitionException(e)) return false;
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

  doSingleRepetition(action: Function): any {
    const beforeIteration = this.getLexerPosition();
    action.call(this);
    const afterIteration = this.getLexerPosition();

    // This boolean will indicate if this repetition progressed
    // or if we are "stuck" (potential infinite loop in the repetition).
    return afterIteration > beforeIteration;
  }

  protected strictOrInternal<T>(
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
    occurrence: number,
  ): T {
    const mapKey = this.currRuleShortName | occurrence;
    const alts = isArray(altsOrOpts)
      ? (altsOrOpts as IOrAlt<any>[])
      : (altsOrOpts as OrMethodOpts<unknown>).DEF;
    const ll1Dispatch = this._orLookaheadLL1[mapKey];

    if (ll1Dispatch !== undefined) {
      const altIdx = ll1Dispatch.call(this);
      if (altIdx !== undefined) {
        return alts[altIdx].ALT.call(this) as T;
      }
    } else {
      const orDispatch = this._orLookahead[mapKey];
      if (orDispatch !== undefined) {
        const result = orDispatch.call(this, alts);
        if (result !== OR_NO_MATCH) {
          return result as T;
        }
      }
    }

    const em = isArray(altsOrOpts)
      ? undefined
      : (altsOrOpts as OrMethodOpts<unknown>).ERR_MSG;
    this.raiseNoAltException(occurrence, em);
  }

  protected getStrictProdLookahead(
    prodOccurrence: number,
    keyIdx: number,
    prodType:
      | "Option"
      | "RepetitionMandatory"
      | "RepetitionMandatoryWithSeparator"
      | "Repetition"
      | "RepetitionWithSeparator",
  ): (() => boolean) | undefined {
    const laKey = getKeyForAutomaticLookahead(
      this.currRuleShortName,
      keyIdx,
      prodOccurrence,
    );
    return this._prodLookahead[laKey];
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
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
    occurrence: number,
  ): T {
    return this.strictOrInternal(altsOrOpts, occurrence);
  }

  ruleFinallyStateUpdate(): void {
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
    tokType: TokenType,
    idx: number,
    options: ConsumeMethodOpts | undefined,
  ): IToken {
    // Inline LA_FAST(1) for minimal overhead.
    const nextToken = this.tokVector[this.currIdx + 1];
    const label =
      options !== undefined && options.LABEL !== undefined
        ? options.LABEL
        : tokType.name;

    // Inline token match: exact type check + MATCH_SET bitset for categories.
    // Eliminates this.tokenMatcher property lookup + function call dispatch.
    const instanceType = nextToken.tokenTypeIdx;
    if (
      instanceType === tokType.tokenTypeIdx ||
      (tokType.MATCH_SET != null &&
        (tokType.MATCH_SET[instanceType >> 5] & (1 << (instanceType & 31))) !==
          0)
    ) {
      this.currIdx++;
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
    shortName: number,
    fullName: string,
    idxInCallingRule: number,
  ): void {
    const depth = ++this.RULE_STACK_IDX;
    this.RULE_OCCURRENCE_STACK[depth] = idxInCallingRule;
    this.RULE_STACK[depth] = shortName;
    this.currRuleShortName = shortName;
    // NOOP when cst is disabled
    this.cstInvocationStateUpdate(fullName);
  }

  /**
   * Returns true while inside a BACKTRACK() trial. Reads the boolean flag
   * directly — O(1) with no array length check.
   */
  isBackTracking(): boolean {
    return this.IS_SPECULATING;
  }

  getCurrRuleFullName(): string {
    const shortName = this.currRuleShortName;
    return this.shortRuleNameToFull[shortName];
  }

  shortRuleNameToFullName(shortName: number) {
    return this.shortRuleNameToFull[shortName];
  }

  public isAtEndOfInput(): boolean {
    return this.tokenMatcher(this.LA(1), EOF);
  }

  public reset(): void {
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
  onBeforeParse(_ruleName: string): void {
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
  onAfterParse(_ruleName: string): void {
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

  // --- PerformanceTracer (absorbed from trait) ---
  traceInitPerf!: boolean | number;
  traceInitMaxIdent!: number;
  traceInitIndent!: number;

  initPerformanceTracer(config: IParserConfig) {
    if (Object.hasOwn(config, "traceInitPerf")) {
      const userTraceInitPerf = config.traceInitPerf;
      const traceIsNumber = typeof userTraceInitPerf === "number";
      this.traceInitMaxIdent = traceIsNumber
        ? <number>userTraceInitPerf
        : Infinity;
      this.traceInitPerf = traceIsNumber
        ? userTraceInitPerf > 0
        : (userTraceInitPerf as boolean);
    } else {
      this.traceInitMaxIdent = 0;
      this.traceInitPerf = DEFAULT_PARSER_CONFIG.traceInitPerf;
    }
    this.traceInitIndent = -1;
  }

  // --- Recoverable (absorbed from trait) ---
  recoveryEnabled!: boolean;
  firstAfterRepMap!: Record<string, IFirstAfterRepetition>;
  resyncFollows!: Record<string, TokenType[]>;

  initRecoverable(config: IParserConfig) {
    this.firstAfterRepMap = {};
    this.resyncFollows = {};

    this.recoveryEnabled = Object.hasOwn(config, "recoveryEnabled")
      ? (config.recoveryEnabled as boolean) // assumes end user provides the correct config value/type
      : DEFAULT_PARSER_CONFIG.recoveryEnabled;

    // performance optimization, NOOP will be inlined which
    // effectively means that this optional feature does not exist
    // when not used.
    if (this.recoveryEnabled) {
      this.attemptInRepetitionRecovery = attemptInRepetitionRecovery;
    }
  }

  public getTokenToInsert(tokType: TokenType): IToken {
    const tokToInsert = createTokenInstance(
      tokType,
      "",
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
      NaN,
    );
    tokToInsert.isInsertedInRecovery = true;
    return tokToInsert;
  }

  public canTokenTypeBeInsertedInRecovery(tokType: TokenType): boolean {
    return true;
  }

  public canTokenTypeBeDeletedInRecovery(tokType: TokenType): boolean {
    return true;
  }

  tryInRepetitionRecovery(
    grammarRule: Function,
    grammarRuleArgs: any[],
    lookAheadFunc: () => boolean,
    expectedTokType: TokenType,
  ): void {
    // TODO: can the resyncTokenType be cached?
    const reSyncTokType = this.findReSyncTokenType();
    const savedLexerState = this.exportLexerState();
    const resyncedTokens: IToken[] = [];
    let passedResyncPoint = false;

    const nextTokenWithoutResync = this.LA_FAST(1);
    let currToken = this.LA_FAST(1);

    const generateErrorMessage = () => {
      const previousToken = this.LA(0);
      // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
      // the error that would have been thrown
      const msg = this.errorMessageProvider.buildMismatchTokenMessage({
        expected: expectedTokType,
        actual: nextTokenWithoutResync,
        previous: previousToken,
        ruleName: this.getCurrRuleFullName(),
      });
      const error = new MismatchedTokenException(
        msg,
        nextTokenWithoutResync,
        this.LA(0),
      );
      // the first token here will be the original cause of the error, this is not part of the resyncedTokens property.
      error.resyncedTokens = resyncedTokens.slice(0, -1);
      this.SAVE_ERROR(error);
    };

    while (!passedResyncPoint) {
      // re-synced to a point where we can safely exit the repetition/
      if (this.tokenMatcher(currToken, expectedTokType)) {
        generateErrorMessage();
        return; // must return here to avoid reverting the inputIdx
      } else if (lookAheadFunc.call(this)) {
        // we skipped enough tokens so we can resync right back into another iteration of the repetition grammar rule
        generateErrorMessage();
        // recursive invocation in other to support multiple re-syncs in the same top level repetition grammar rule
        grammarRule.apply(this, grammarRuleArgs);
        return; // must return here to avoid reverting the inputIdx
      } else if (this.tokenMatcher(currToken, reSyncTokType)) {
        passedResyncPoint = true;
      } else {
        currToken = this.SKIP_TOKEN();
        this.addToResyncTokens(currToken, resyncedTokens);
      }
    }

    // we were unable to find a CLOSER point to resync inside the Repetition, reset the state.
    // The parsing exception we were trying to prevent will happen in the NEXT parsing step. it may be handled by
    // "between rules" resync recovery later in the flow.
    this.importLexerState(savedLexerState);
  }

  shouldInRepetitionRecoveryBeTried(
    expectTokAfterLastMatch: TokenType,
    nextTokIdx: number,
    notStuck: boolean | undefined,
  ): boolean {
    // Edge case of arriving from a MANY repetition which is stuck
    // Attempting recovery in this case could cause an infinite loop
    if (notStuck === false) {
      return false;
    }

    // no need to recover, next token is what we expect...
    if (this.tokenMatcher(this.LA_FAST(1), expectTokAfterLastMatch)) {
      return false;
    }

    // error recovery is disabled during backtracking as it can make the parser ignore a valid grammar path
    // and prefer some backtracking path that includes recovered errors.
    if (this.isBackTracking()) {
      return false;
    }

    // if we can perform inRule recovery (single token insertion or deletion) we always prefer that recovery algorithm
    // because if it works, it makes the least amount of changes to the input stream (greedy algorithm)
    //noinspection RedundantIfStatementJS
    if (
      this.canPerformInRuleRecovery(
        expectTokAfterLastMatch,
        this.getFollowsForInRuleRecovery(expectTokAfterLastMatch, nextTokIdx),
      )
    ) {
      return false;
    }

    return true;
  }

  // TODO: should this be a member method or a utility? it does not have any state or usage of 'this'...
  // TODO: should this be more explicitly part of the public API?
  getNextPossibleTokenTypes(grammarPath: ITokenGrammarPath): TokenType[] {
    const topRuleName = grammarPath.ruleStack[0]!;
    const gastProductions = this.getGAstProductions();
    const topProduction = gastProductions[topRuleName];
    const nextPossibleTokenTypes = new NextAfterTokenWalker(
      topProduction,
      grammarPath,
    ).startWalking();
    return nextPossibleTokenTypes;
  }

  // Error Recovery functionality
  getFollowsForInRuleRecovery(
    tokType: TokenType,
    tokIdxInRule: number,
  ): TokenType[] {
    const grammarPath = this.getCurrentGrammarPath(tokType, tokIdxInRule);
    const follows = this.getNextPossibleTokenTypes(grammarPath);
    return follows;
  }

  tryInRuleRecovery(expectedTokType: TokenType, follows: TokenType[]): IToken {
    if (this.canRecoverWithSingleTokenInsertion(expectedTokType, follows)) {
      const tokToInsert = this.getTokenToInsert(expectedTokType);
      return tokToInsert;
    }

    if (this.canRecoverWithSingleTokenDeletion(expectedTokType)) {
      const nextTok = this.SKIP_TOKEN();
      this.consumeToken();
      return nextTok;
    }

    throw new InRuleRecoveryException("sad sad panda");
  }

  canPerformInRuleRecovery(
    expectedToken: TokenType,
    follows: TokenType[],
  ): boolean {
    return (
      this.canRecoverWithSingleTokenInsertion(expectedToken, follows) ||
      this.canRecoverWithSingleTokenDeletion(expectedToken)
    );
  }

  canRecoverWithSingleTokenInsertion(
    expectedTokType: TokenType,
    follows: TokenType[],
  ): boolean {
    if (!this.canTokenTypeBeInsertedInRecovery(expectedTokType)) {
      return false;
    }

    // must know the possible following tokens to perform single token insertion
    if (follows.length === 0) {
      return false;
    }

    const mismatchedTok = this.LA_FAST(1);
    const isMisMatchedTokInFollows =
      follows.find((possibleFollowsTokType: TokenType) => {
        return this.tokenMatcher(mismatchedTok, possibleFollowsTokType);
      }) !== undefined;

    return isMisMatchedTokInFollows;
  }

  canRecoverWithSingleTokenDeletion(expectedTokType: TokenType): boolean {
    if (!this.canTokenTypeBeDeletedInRecovery(expectedTokType)) {
      return false;
    }

    const isNextTokenWhatIsExpected = this.tokenMatcher(
      // not using LA_FAST because LA(2) might be un-safe with maxLookahead=1
      // in some edge cases (?)
      this.LA(2),
      expectedTokType,
    );
    return isNextTokenWhatIsExpected;
  }

  isInCurrentRuleReSyncSet(tokenTypeIdx: TokenType): boolean {
    const followKey = this.getCurrFollowKey();
    const currentRuleReSyncSet = this.getFollowSetFromFollowKey(followKey);
    return currentRuleReSyncSet.includes(tokenTypeIdx);
  }

  /**
   * Scans forward until finding a token whose type is in the follow set,
   * signalling where the parser can safely resume. Uses a Set built once by
   * flattenFollowSet() so each token is an O(1) lookup instead of O(n) scan.
   * LA_FAST is safe here because sentinel EOF tokens pad the end of tokVector.
   */
  findReSyncTokenType(): TokenType {
    const reSyncSet = this.flattenFollowSet();
    // always terminates: EOF is always in the follow set and always in the input
    let nextToken = this.LA_FAST(1);
    let k = 2;
    while (true) {
      const match = reSyncSet.get(nextToken.tokenTypeIdx);
      if (match !== undefined) {
        return match;
      }
      nextToken = this.LA_FAST(k++);
    }
  }

  getCurrFollowKey(): IFollowKey {
    // the length is at least one as we always add the ruleName to the stack before invoking the rule.
    if (this.RULE_STACK_IDX === 0) {
      return EOF_FOLLOW_KEY;
    }
    const currRuleShortName = this.currRuleShortName;
    const currRuleIdx = this.getLastExplicitRuleOccurrenceIndex();
    const prevRuleShortName = this.getPreviousExplicitRuleShortName();

    return {
      ruleName: this.shortRuleNameToFullName(currRuleShortName),
      idxInCallingRule: currRuleIdx,
      inRule: this.shortRuleNameToFullName(prevRuleShortName),
    };
  }

  buildFullFollowKeyStack(): IFollowKey[] {
    const explicitRuleStack = this.RULE_STACK;
    const explicitOccurrenceStack = this.RULE_OCCURRENCE_STACK;
    const len = this.RULE_STACK_IDX + 1;

    const result: IFollowKey[] = new Array(len);
    for (let idx = 0; idx < len; idx++) {
      if (idx === 0) {
        result[idx] = EOF_FOLLOW_KEY;
      } else {
        result[idx] = {
          ruleName: this.shortRuleNameToFullName(explicitRuleStack[idx]),
          idxInCallingRule: explicitOccurrenceStack[idx],
          inRule: this.shortRuleNameToFullName(explicitRuleStack[idx - 1]),
        };
      }
    }
    return result;
  }

  /**
   * Builds a Map from concrete tokenTypeIdx → follow-set TokenType for the
   * current rule stack. Keying by index instead of object reference gives O(1)
   * lookup in findReSyncTokenType without a linear scan per token. Category
   * types are expanded so every concrete member maps to its category — the
   * category object is returned by findReSyncTokenType so callers that check
   * isInCurrentRuleReSyncSet still get the right follow-set entry.
   */
  flattenFollowSet(): Map<number, TokenType> {
    const result = new Map<number, TokenType>();
    for (const key of this.buildFullFollowKeyStack()) {
      for (const tokType of this.getFollowSetFromFollowKey(key)) {
        if (tokType.isParent) {
          for (const idx of tokType.categoryMatches!) {
            if (!result.has(idx)) result.set(idx, tokType);
          }
        } else {
          if (!result.has(tokType.tokenTypeIdx!))
            result.set(tokType.tokenTypeIdx!, tokType);
        }
      }
    }
    return result;
  }

  getFollowSetFromFollowKey(followKey: IFollowKey): TokenType[] {
    if (followKey === EOF_FOLLOW_KEY) {
      return [EOF];
    }

    const followName =
      followKey.ruleName + followKey.idxInCallingRule + IN + followKey.inRule;

    return this.resyncFollows[followName];
  }

  // It does not make any sense to include a virtual EOF token in the list of resynced tokens
  // as EOF does not really exist and thus does not contain any useful information (line/column numbers)
  addToResyncTokens(token: IToken, resyncTokens: IToken[]): IToken[] {
    if (!this.tokenMatcher(token, EOF)) {
      resyncTokens.push(token);
    }
    return resyncTokens;
  }

  reSyncTo(tokType: TokenType): IToken[] {
    const resyncedTokens: IToken[] = [];
    let nextTok = this.LA_FAST(1);
    while (this.tokenMatcher(nextTok, tokType) === false) {
      nextTok = this.SKIP_TOKEN();
      this.addToResyncTokens(nextTok, resyncedTokens);
    }
    // the last token is not part of the error.
    return resyncedTokens.slice(0, -1);
  }

  attemptInRepetitionRecovery(
    prodFunc: Function,
    args: any[],
    lookaheadFunc: () => boolean,
    dslMethodIdx: number,
    prodOccurrence: number,
    nextToksWalker: typeof AbstractNextTerminalAfterProductionWalker,
    notStuck?: boolean,
  ): void {
    // by default this is a NO-OP
    // The actual implementation is with the function(not method) below
  }

  getCurrentGrammarPath(
    tokType: TokenType,
    tokIdxInRule: number,
  ): ITokenGrammarPath {
    const pathRuleStack: string[] = this.getHumanReadableRuleStack();
    const pathOccurrenceStack: number[] = this.RULE_OCCURRENCE_STACK.slice(
      0,
      this.RULE_STACK_IDX + 1,
    );
    const grammarPath: any = {
      ruleStack: pathRuleStack,
      occurrenceStack: pathOccurrenceStack,
      lastTok: tokType,
      lastTokOccurrence: tokIdxInRule,
    };

    return grammarPath;
  }

  getHumanReadableRuleStack(): string[] {
    const len = this.RULE_STACK_IDX + 1;
    const result: string[] = new Array(len);
    for (let i = 0; i < len; i++) {
      result[i] = this.shortRuleNameToFullName(this.RULE_STACK[i]);
    }
    return result;
  }

  // --- RecognizerApi (absorbed from trait) ---
  ACTION<T>(impl: () => T): T {
    return impl.call(this);
  }

  consume(
    idx: number,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    return this.consumeInternal(tokType, idx, options);
  }

  subrule<ARGS extends unknown[], R>(
    idx: number,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, idx, options);
  }

  option<OUT>(
    idx: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, idx);
  }

  or<T = unknown>(idx: number, altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, idx);
  }

  many(
    idx: number,
    actionORMethodDef: GrammarAction<any> | DSLMethodOpts<any>,
  ): void {
    this.manyInternal(idx, actionORMethodDef);
  }

  protected manySep(idx: number, options: ManySepMethodOpts<any>): void {
    this.manySepFirstInternal(idx, options);
  }

  atLeastOne(
    idx: number,
    actionORMethodDef: GrammarAction<any> | DSLMethodOptsWithErr<any>,
  ): void {
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  protected atLeastOneSep(
    idx: number,
    options: AtLeastOneSepMethodOpts<any>,
  ): void {
    this.atLeastOneSepFirstInternal(idx, options);
  }

  CONSUME(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 0, options);
  }

  CONSUME1(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 1, options);
  }

  CONSUME2(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 2, options);
  }

  CONSUME3(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 3, options);
  }

  CONSUME4(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 4, options);
  }

  CONSUME5(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 5, options);
  }

  CONSUME6(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 6, options);
  }

  CONSUME7(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 7, options);
  }

  CONSUME8(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 8, options);
  }

  CONSUME9(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consumeInternal(tokType, 9, options);
  }

  SUBRULE<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 0, options);
  }

  SUBRULE1<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE1<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 1, options);
  }

  SUBRULE2<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE2<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 2, options);
  }

  SUBRULE3<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE3<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 3, options);
  }

  SUBRULE4<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE4<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 4, options);
  }

  SUBRULE5<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE5<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 5, options);
  }

  SUBRULE6<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE6<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 6, options);
  }

  SUBRULE7<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE7<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 7, options);
  }

  SUBRULE8<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE8<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 8, options);
  }

  SUBRULE9<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  SUBRULE9<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subruleInternal(ruleToCall, 9, options);
  }

  OPTION<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 0);
  }

  OPTION1<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 1);
  }

  OPTION2<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 2);
  }

  OPTION3<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 3);
  }

  OPTION4<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 4);
  }

  OPTION5<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 5);
  }

  OPTION6<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 6);
  }

  OPTION7<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 7);
  }

  OPTION8<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 8);
  }

  OPTION9<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.optionInternal(actionORMethodDef, 9);
  }

  OR<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 0);
  }

  OR1<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 1);
  }

  OR2<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 2);
  }

  OR3<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 3);
  }

  OR4<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 4);
  }

  OR5<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 5);
  }

  OR6<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 6);
  }

  OR7<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 7);
  }

  OR8<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 8);
  }

  OR9<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.strictOrInternal(altsOrOpts, 9);
  }

  MANY<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(0, actionORMethodDef);
  }

  MANY1<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(1, actionORMethodDef);
  }

  MANY2<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(2, actionORMethodDef);
  }

  MANY3<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(3, actionORMethodDef);
  }

  MANY4<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(4, actionORMethodDef);
  }

  MANY5<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(5, actionORMethodDef);
  }

  MANY6<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(6, actionORMethodDef);
  }

  MANY7<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(7, actionORMethodDef);
  }

  MANY8<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(8, actionORMethodDef);
  }

  MANY9<OUT>(actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void {
    this.manyInternal(9, actionORMethodDef);
  }

  MANY_SEP<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(0, options);
  }

  MANY_SEP1<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(1, options);
  }

  MANY_SEP2<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(2, options);
  }

  MANY_SEP3<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(3, options);
  }

  MANY_SEP4<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(4, options);
  }

  MANY_SEP5<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(5, options);
  }

  MANY_SEP6<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(6, options);
  }

  MANY_SEP7<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(7, options);
  }

  MANY_SEP8<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(8, options);
  }

  MANY_SEP9<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySepFirstInternal(9, options);
  }

  AT_LEAST_ONE<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(0, actionORMethodDef);
  }

  AT_LEAST_ONE1<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(1, actionORMethodDef);
  }

  AT_LEAST_ONE2<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(2, actionORMethodDef);
  }

  AT_LEAST_ONE3<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(3, actionORMethodDef);
  }

  AT_LEAST_ONE4<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(4, actionORMethodDef);
  }

  AT_LEAST_ONE5<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(5, actionORMethodDef);
  }

  AT_LEAST_ONE6<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(6, actionORMethodDef);
  }

  AT_LEAST_ONE7<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(7, actionORMethodDef);
  }

  AT_LEAST_ONE8<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(8, actionORMethodDef);
  }

  AT_LEAST_ONE9<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOneInternal(9, actionORMethodDef);
  }

  AT_LEAST_ONE_SEP<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(0, options);
  }

  AT_LEAST_ONE_SEP1<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(1, options);
  }

  AT_LEAST_ONE_SEP2<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(2, options);
  }

  AT_LEAST_ONE_SEP3<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(3, options);
  }

  AT_LEAST_ONE_SEP4<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(4, options);
  }

  AT_LEAST_ONE_SEP5<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(5, options);
  }

  AT_LEAST_ONE_SEP6<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(6, options);
  }

  AT_LEAST_ONE_SEP7<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(7, options);
  }

  AT_LEAST_ONE_SEP8<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(8, options);
  }

  AT_LEAST_ONE_SEP9<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSepFirstInternal(9, options);
  }

  RULE<T>(
    name: string,
    implementation: (...implArgs: any[]) => T,
    config: IRuleConfig<T> = DEFAULT_RULE_CONFIG,
  ): (idxInCallingRule?: number, ...args: any[]) => T | any {
    if (this.definedRulesNames.includes(name)) {
      const errMsg =
        defaultGrammarValidatorErrorProvider.buildDuplicateRuleNameError({
          topLevelRule: name,
          grammarName: this.className,
        });

      const error = {
        message: errMsg,
        type: ParserDefinitionErrorType.DUPLICATE_RULE_NAME,
        ruleName: name,
      };
      this.definitionErrors.push(error);
    }

    this.definedRulesNames.push(name);

    const ruleImplementation = this.defineRule(name, implementation, config);
    (this as any)[name] = ruleImplementation;
    return ruleImplementation;
  }

  OVERRIDE_RULE<T>(
    name: string,
    impl: (...implArgs: any[]) => T,
    config: IRuleConfig<T> = DEFAULT_RULE_CONFIG,
  ): (idxInCallingRule?: number, ...args: any[]) => T {
    const ruleErrors: IParserDefinitionError[] = validateRuleIsOverridden(
      name,
      this.definedRulesNames,
      this.className,
    );
    this.definitionErrors = this.definitionErrors.concat(ruleErrors);

    const ruleImplementation = this.defineRule(name, impl, config);
    (this as any)[name] = ruleImplementation;
    return ruleImplementation;
  }

  /**
   * Returns a zero-argument predicate that speculatively runs `grammarRule`
   * and returns true if it succeeds. On failure, state is restored via three
   * integer assignments (no array copies). Uses SPEC_FAIL (a Symbol) as the
   * failure signal so V8 never allocates an Error during failed alternatives.
   */
  BACKTRACK<T>(
    grammarRule: (...args: any[]) => T,
    args?: any[],
  ): () => boolean {
    // Use coreRule to bypass root-level hooks (onBeforeParse/onAfterParse).
    // Backtracking is speculative and should not trigger parse lifecycle hooks.
    const ruleToCall = (grammarRule as any).coreRule ?? grammarRule;
    return function () {
      const prevIsSpeculating = this.IS_SPECULATING;
      const prevIsInTrueBacktrack = this._isInTrueBacktrack;
      this.IS_SPECULATING = true;
      this._isInTrueBacktrack = true;
      const savedPos = this.currIdx;
      const savedErrors = this._errors.length;
      const savedRuleStack = this.RULE_STACK_IDX;
      try {
        ruleToCall.apply(this, args);
        return true;
      } catch (e) {
        if (e === SPEC_FAIL || isRecognitionException(e)) {
          return false;
        } else {
          throw e;
        }
      } finally {
        this.currIdx = savedPos;
        this._errors.length = savedErrors;
        this.RULE_STACK_IDX = savedRuleStack;
        this.IS_SPECULATING = prevIsSpeculating;
        this._isInTrueBacktrack = prevIsInTrueBacktrack;
      }
    };
  }

  // GAST export APIs
  public getGAstProductions(): Record<string, Rule> {
    return this.gastProductionsCache;
  }

  public getSerializedGastProductions(): ISerializedGast[] {
    return serializeGrammar(Object.values(this.gastProductionsCache));
  }

  // --- TreeBuilder (absorbed from trait) ---
  outputCst!: boolean;
  CST_STACK!: CstNode[];
  baseCstVisitorConstructor!: Function;
  baseCstVisitorWithDefaultsConstructor!: Function;

  // dynamically assigned Methods
  setNodeLocationFromNode!: (
    nodeLocation: CstNodeLocation,
    locationInformation: CstNodeLocation,
  ) => void;
  setNodeLocationFromToken!: (
    nodeLocation: CstNodeLocation,
    locationInformation: CstNodeLocation,
  ) => void;
  cstPostRule!: (ruleCstNode: CstNode) => void;

  setInitialNodeLocation!: (cstNode: CstNode) => void;
  nodeLocationTracking!: nodeLocationTrackingOptions;

  initTreeBuilder(config: IParserConfig) {
    this.CST_STACK = [];

    // outputCst is no longer exposed/defined in the pubic API
    this.outputCst = (config as any).outputCst;

    this.nodeLocationTracking = Object.hasOwn(config, "nodeLocationTracking")
      ? (config.nodeLocationTracking as nodeLocationTrackingOptions)
      : DEFAULT_PARSER_CONFIG.nodeLocationTracking;

    if (!this.outputCst) {
      this.cstInvocationStateUpdate = () => {};
      this.cstFinallyStateUpdate = () => {};
      this.cstPostTerminal = () => {};
      this.cstPostNonTerminal = () => {};
      this.cstPostRule = () => {};
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

  setInitialNodeLocationOnlyOffsetRecovery(cstNode: any): void {
    cstNode.location = createCstLocationOnlyOffset();
  }

  setInitialNodeLocationOnlyOffsetRegular(cstNode: any): void {
    const loc = createCstLocationOnlyOffset();
    loc.startOffset = this.LA_FAST(1).startOffset;
    cstNode.location = loc;
  }

  setInitialNodeLocationFullRecovery(cstNode: any): void {
    cstNode.location = createCstLocationFull();
  }

  setInitialNodeLocationFullRegular(cstNode: any): void {
    const nextToken = this.LA_FAST(1);
    const loc = createCstLocationFull();
    loc.startOffset = nextToken.startOffset;
    loc.startLine = nextToken.startLine;
    loc.startColumn = nextToken.startColumn;
    cstNode.location = loc;
  }

  cstInvocationStateUpdate(fullRuleName: string): void {
    // Skip CST building during speculation — nodes would be discarded
    // on SPEC_FAIL anyway. Avoids allocation of CstNode objects,
    // children arrays, and location objects.
    if (this.IS_SPECULATING) return;
    const cstNode = createCstNode(fullRuleName);
    this.setInitialNodeLocation(cstNode);
    this.CST_STACK.push(cstNode);
  }

  cstFinallyStateUpdate(): void {
    if (this.IS_SPECULATING) return;
    this.CST_STACK.pop();
  }

  cstPostRuleFull(ruleCstNode: CstNode): void {
    if (this.IS_SPECULATING) return;
    const prevToken = this.LA(0) as Required<CstNodeLocation>;
    const loc = ruleCstNode.location as Required<CstNodeLocation>;

    if (loc.startOffset <= prevToken.startOffset === true) {
      loc.endOffset = prevToken.endOffset;
      loc.endLine = prevToken.endLine;
      loc.endColumn = prevToken.endColumn;
    } else {
      loc.startOffset = NaN;
      loc.startLine = NaN;
      loc.startColumn = NaN;
    }
  }

  cstPostRuleOnlyOffset(ruleCstNode: CstNode): void {
    if (this.IS_SPECULATING) return;
    const prevToken = this.LA(0);
    const loc = ruleCstNode.location!;

    if (loc.startOffset <= prevToken.startOffset === true) {
      loc.endOffset = prevToken.endOffset;
    } else {
      loc.startOffset = NaN;
    }
  }

  cstPostTerminal(key: string, consumedToken: IToken): void {
    if (this.IS_SPECULATING) return;
    const rootCst = this.CST_STACK[this.CST_STACK.length - 1];
    addTerminalToCst(rootCst, consumedToken, key);
    this.setNodeLocationFromToken(rootCst.location!, <any>consumedToken);
  }

  cstPostNonTerminal(ruleCstResult: CstNode, ruleName: string): void {
    if (this.IS_SPECULATING) return;
    const preCstNode = this.CST_STACK[this.CST_STACK.length - 1];
    addNoneTerminalToCst(preCstNode, ruleName, ruleCstResult);
    this.setNodeLocationFromNode(preCstNode.location!, ruleCstResult.location!);
  }

  /**
   * Snapshot the CST watermark (child-array lengths + location) before a
   * speculative parse attempt. Returns `null` when CST is disabled or when
   * already speculating (CST is not written during speculation).
   *
   * **Override hook:** subclasses that maintain extra parser state can override
   * this method and call `super.saveCheckpoint()` to include that state in the
   * save object returned. The saved value is passed back verbatim to
   * `restoreCheckpoint` when the speculation fails, so any shape is fine.
   *
   * ```ts
   * protected override saveCheckpoint(): any {
   *   return { cst: super.saveCheckpoint(), myStack: this.myStack.length };
   * }
   * protected override restoreCheckpoint(save: ReturnType<typeof this.saveCheckpoint>): void {
   *   super.restoreCheckpoint(save.cst);
   *   this.myStack.length = save.myStack;
   * }
   * ```
   */
  protected saveCheckpoint(): any {
    if (!this.outputCst || this.IS_SPECULATING) return null;
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

  /** @see saveCheckpoint */
  protected restoreCheckpoint(save: any): void {
    if (!this.outputCst || save === null || save === undefined) return;
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

  getBaseCstVisitorConstructor<IN = any, OUT = any>(): {
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

  getBaseCstVisitorConstructorWithDefaults<IN = any, OUT = any>(): {
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

  getPreviousExplicitRuleShortName(): number {
    return this.RULE_STACK[this.RULE_STACK_IDX - 1];
  }

  getLastExplicitRuleOccurrenceIndex(): number {
    return this.RULE_OCCURRENCE_STACK[this.RULE_STACK_IDX];
  }

  // --- GastRecorder (absorbed from trait) ---
  recordingProdStack!: ProdWithDef[];
  RECORDING_PHASE!: boolean;
  protected _recordingApiBackup?: Record<string, unknown> | undefined;

  initGastRecorder(config: IParserConfig): void {
    this.recordingProdStack = [];
    this.RECORDING_PHASE = false;
    this._recordingApiBackup = undefined;
  }

  protected captureRecordingApiBackup(): void {
    const backup: Record<string, unknown> = {};
    for (const methodName of RECORDING_API_METHOD_NAMES) {
      backup[methodName] = (this as any)[methodName];
    }
    this._recordingApiBackup = backup;
  }

  protected restoreRecordingApiBackup(): void {
    const backup = this._recordingApiBackup;
    if (backup === undefined) return;
    for (const methodName of RECORDING_API_METHOD_NAMES) {
      (this as any)[methodName] = backup[methodName];
    }
    this._recordingApiBackup = undefined;
  }

  enableRecording(): void {
    this.RECORDING_PHASE = true;
    this.TRACE_INIT("Enable Recording", () => {
      this.captureRecordingApiBackup();
      const that: any = this;
      for (let i = 0; i < 10; i++) {
        const idx = i > 0 ? i : "";
        that[`CONSUME${idx}`] = function (
          arg1: TokenType,
          arg2?: ConsumeMethodOpts,
        ) {
          return this.consumeInternalRecord(arg1, i, arg2);
        };
        that[`SUBRULE${idx}`] = function (
          arg1: ParserMethodInternal<unknown[], unknown>,
          arg2?: SubruleMethodOpts<unknown[]>,
        ) {
          return this.subruleInternalRecord(arg1, i, arg2);
        };
        that[`OPTION${idx}`] = function (
          arg1: GrammarAction<unknown> | DSLMethodOpts<unknown>,
        ) {
          return this.optionInternalRecord(arg1, i);
        };
        that[`OR${idx}`] = function (
          arg1: IOrAlt<unknown>[] | OrMethodOpts<unknown>,
        ) {
          return this.orInternalRecord(arg1, i);
        };
        that[`MANY${idx}`] = function (
          arg1: GrammarAction<unknown> | DSLMethodOpts<unknown>,
        ) {
          this.manyInternalRecord(i, arg1);
        };
        that[`MANY_SEP${idx}`] = function (arg1: ManySepMethodOpts<unknown>) {
          this.manySepFirstInternalRecord(i, arg1);
        };
        that[`AT_LEAST_ONE${idx}`] = function (
          arg1: GrammarAction<unknown> | DSLMethodOptsWithErr<unknown>,
        ) {
          this.atLeastOneInternalRecord(i, arg1);
        };
        that[`AT_LEAST_ONE_SEP${idx}`] = function (
          arg1: AtLeastOneSepMethodOpts<unknown>,
        ) {
          this.atLeastOneSepFirstInternalRecord(i, arg1);
        };
      }
      that.consume = function (
        idx: number,
        arg1: TokenType,
        arg2?: ConsumeMethodOpts,
      ) {
        return this.consumeInternalRecord(arg1, idx, arg2);
      };
      that.subrule = function (
        idx: number,
        arg1: ParserMethodInternal<unknown[], unknown>,
        arg2?: SubruleMethodOpts<unknown[]>,
      ) {
        return this.subruleInternalRecord(arg1, idx, arg2);
      };
      that.option = function (
        idx: number,
        arg1: GrammarAction<unknown> | DSLMethodOpts<unknown>,
      ) {
        return this.optionInternalRecord(arg1, idx);
      };
      that.or = function (
        idx: number,
        arg1: IOrAlt<unknown>[] | OrMethodOpts<unknown>,
      ) {
        return this.orInternalRecord(arg1, idx);
      };
      that.many = function (
        idx: number,
        arg1: GrammarAction<unknown> | DSLMethodOpts<unknown>,
      ) {
        this.manyInternalRecord(idx, arg1);
      };
      that.manySep = function (idx: number, arg1: ManySepMethodOpts<unknown>) {
        this.manySepFirstInternalRecord(idx, arg1);
      };
      that.atLeastOne = function (
        idx: number,
        arg1: GrammarAction<unknown> | DSLMethodOptsWithErr<unknown>,
      ) {
        this.atLeastOneInternalRecord(idx, arg1);
      };
      that.atLeastOneSep = function (
        idx: number,
        arg1: AtLeastOneSepMethodOpts<unknown>,
      ) {
        this.atLeastOneSepFirstInternalRecord(idx, arg1);
      };
      that.ACTION = this.ACTION_RECORD;
      that.BACKTRACK = this.BACKTRACK_RECORD;
      that.LA = this.LA_RECORD;
    });
  }

  disableRecording() {
    this.RECORDING_PHASE = false;
    this.TRACE_INIT("Restore Recording methods", () => {
      this.restoreRecordingApiBackup();
    });
  }

  // @ts-expect-error -- noop place holder
  ACTION_RECORD<T>(impl: () => T): T {
    // NO-OP during recording
  }

  BACKTRACK_RECORD<T>(
    grammarRule: (...args: any[]) => T,
    args?: any[],
  ): () => boolean {
    return () => true;
  }

  LA_RECORD(howMuch: number): IToken {
    return END_OF_FILE;
  }

  topLevelRuleRecord(name: string, def: Function): Rule {
    try {
      const newTopLevelRule = new Rule({ definition: [], name: name });
      newTopLevelRule.name = name;
      this.recordingProdStack.push(newTopLevelRule);
      const depth = ++this.RULE_STACK_IDX;
      const shortName = this.fullRuleNameToShort[name] ?? 0;
      this.RULE_STACK[depth] = shortName;
      this.currRuleShortName = shortName;
      this._dslCounterStack[depth] = this._dslCounter;
      this._dslCounter = 0;
      def.call(this);
      this._dslCounter = this._dslCounterStack[depth];
      this.RULE_STACK_IDX--;
      if (this.RULE_STACK_IDX >= 0) {
        this.currRuleShortName = this.RULE_STACK[this.RULE_STACK_IDX];
      }
      this.recordingProdStack.pop();
      return newTopLevelRule;
    } catch (originalError) {
      if (originalError.KNOWN_RECORDER_ERROR !== true) {
        try {
          originalError.message =
            originalError.message +
            '\n\t This error was thrown during the "grammar recording phase" For more info see:\n\t' +
            "https://chevrotain.io/docs/guide/internals.html#grammar-recording";
        } catch (mutabilityError) {
          throw originalError;
        }
      }
      throw originalError;
    }
  }

  optionInternalRecord<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
    occurrence: number,
  ): OUT {
    return gastRecordProd.call(
      this,
      Option,
      actionORMethodDef,
      occurrence,
      RECORDING_NULL_OBJECT,
      MAX_METHOD_IDX,
    );
  }

  atLeastOneInternalRecord<OUT>(
    occurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    gastRecordProd.call(
      this,
      RepetitionMandatory,
      actionORMethodDef,
      occurrence,
      RECORDING_NULL_OBJECT,
      MAX_METHOD_IDX,
    );
  }

  atLeastOneSepFirstInternalRecord<OUT>(
    occurrence: number,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    gastRecordProd.call(
      this,
      RepetitionMandatoryWithSeparator,
      options,
      occurrence,
      RECORDING_NULL_OBJECT,
      MAX_METHOD_IDX,
      HANDLE_SEPARATOR,
    );
  }

  manyInternalRecord<OUT>(
    occurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    gastRecordProd.call(
      this,
      Repetition,
      actionORMethodDef,
      occurrence,
      RECORDING_NULL_OBJECT,
      MAX_METHOD_IDX,
    );
  }

  manySepFirstInternalRecord<OUT>(
    occurrence: number,
    options: ManySepMethodOpts<OUT>,
  ): void {
    gastRecordProd.call(
      this,
      RepetitionWithSeparator,
      options,
      occurrence,
      RECORDING_NULL_OBJECT,
      MAX_METHOD_IDX,
      HANDLE_SEPARATOR,
    );
  }

  orInternalRecord<T>(
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
    occurrence: number,
  ): T {
    return gastRecordOrProd.call(
      this,
      altsOrOpts,
      occurrence,
      RECORDING_NULL_OBJECT,
      MAX_METHOD_IDX,
    );
  }

  subruleInternalRecord<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R>,
    occurrence: number,
    options?: SubruleMethodOpts<ARGS>,
  ): R | CstNode {
    gastAssertMethodIdxIsValid(occurrence, MAX_METHOD_IDX);
    if (!ruleToCall || !Object.hasOwn(ruleToCall, "ruleName")) {
      const error: any = new Error(
        `<SUBRULE${gastGetIdxSuffix(occurrence)}> argument is invalid` +
          ` expecting a Parser method reference but got: <${JSON.stringify(
            ruleToCall,
          )}>` +
          `\n inside top level rule: <${
            (<Rule>this.recordingProdStack[0]).name
          }>`,
      );
      error.KNOWN_RECORDER_ERROR = true;
      throw error;
    }

    const prevProd: any = this.recordingProdStack.at(-1);
    const ruleName = ruleToCall.ruleName;
    const newNoneTerminal = new NonTerminal({
      idx: occurrence,
      nonTerminalName: ruleName,
      label: options?.LABEL,
      referencedRule: undefined,
    });
    prevProd.definition.push(newNoneTerminal);

    return this.outputCst
      ? RECORDING_PHASE_CSTNODE
      : <any>RECORDING_NULL_OBJECT;
  }

  consumeInternalRecord(
    tokType: TokenType,
    occurrence: number,
    options?: ConsumeMethodOpts,
  ): IToken {
    gastAssertMethodIdxIsValid(occurrence, MAX_METHOD_IDX);
    if (!hasShortKeyProperty(tokType)) {
      const error: any = new Error(
        `<CONSUME${gastGetIdxSuffix(occurrence)}> argument is invalid` +
          ` expecting a TokenType reference but got: <${JSON.stringify(
            tokType,
          )}>` +
          `\n inside top level rule: <${
            (<Rule>this.recordingProdStack[0]).name
          }>`,
      );
      error.KNOWN_RECORDER_ERROR = true;
      throw error;
    }
    const prevProd: any = this.recordingProdStack.at(-1);
    const newNoneTerminal = new Terminal({
      idx: occurrence,
      terminalType: tokType,
      label: options?.LABEL,
    });
    prevProd.definition.push(newNoneTerminal);

    return RECORDING_PHASE_TOKEN;
  }

  // --- LooksAhead (absorbed from trait) ---
  maxLookahead!: number;
  dynamicTokensEnabled!: boolean;
  lookaheadStrategy!: ILookaheadStrategy;

  initLooksAhead(config: IParserConfig) {
    this.dynamicTokensEnabled = Object.hasOwn(config, "dynamicTokensEnabled")
      ? (config.dynamicTokensEnabled as boolean)
      : DEFAULT_PARSER_CONFIG.dynamicTokensEnabled;

    this.maxLookahead = Object.hasOwn(config, "maxLookahead")
      ? (config.maxLookahead as number)
      : DEFAULT_PARSER_CONFIG.maxLookahead;

    this.lookaheadStrategy = Object.hasOwn(config, "lookaheadStrategy")
      ? (config.lookaheadStrategy as ILookaheadStrategy)
      : new LLkLookaheadStrategy({ maxLookahead: this.maxLookahead });
  }

  // --- ErrorHandler (absorbed from trait) ---
  _errors!: IRecognitionException[];
  errorMessageProvider!: IParserErrorMessageProvider;

  initErrorHandler(config: IParserConfig) {
    this._errors = [];
    this.errorMessageProvider = Object.hasOwn(config, "errorMessageProvider")
      ? (config.errorMessageProvider as IParserErrorMessageProvider)
      : DEFAULT_PARSER_CONFIG.errorMessageProvider;
  }

  SAVE_ERROR(error: IRecognitionException): IRecognitionException {
    if (isRecognitionException(error)) {
      error.context = {
        ruleStack: this.getHumanReadableRuleStack(),
        ruleOccurrenceStack: this.RULE_OCCURRENCE_STACK.slice(
          0,
          this.RULE_STACK_IDX + 1,
        ),
      };
      this._errors.push(error);
      return error;
    } else {
      throw Error(
        "Trying to save an Error which is not a RecognitionException",
      );
    }
  }

  get errors(): IRecognitionException[] {
    return [...this._errors];
  }

  set errors(newErrors: IRecognitionException[]) {
    this._errors = newErrors;
  }

  raiseEarlyExitException(
    occurrence: number,
    prodType: PROD_TYPE,
    userDefinedErrMsg: string | undefined,
  ): never {
    if (this.IS_SPECULATING) throw SPEC_FAIL;
    const ruleName = this.getCurrRuleFullName();
    const ruleGrammar = this.getGAstProductions()[ruleName];

    let insideProdPaths: TokenType[][] | undefined;
    if (ruleGrammar !== undefined) {
      const lookAheadPathsPerAlternative = getLookaheadPathsForOptionalProd(
        occurrence,
        ruleGrammar,
        prodType,
        this.maxLookahead,
      );
      insideProdPaths = lookAheadPathsPerAlternative[0];
    }
    const actualTokens = [];
    for (let i = 1; i <= this.maxLookahead; i++) {
      actualTokens.push(this.LA(i));
    }
    const msg = this.errorMessageProvider.buildEarlyExitMessage({
      expectedIterationPaths: insideProdPaths ?? [],
      actual: actualTokens,
      previous: this.LA(0),
      customUserDescription: userDefinedErrMsg,
      ruleName: ruleName,
    });

    throw this.SAVE_ERROR(new EarlyExitException(msg, this.LA(1), this.LA(0)));
  }

  raiseNoAltException(
    occurrence: number,
    errMsgTypes: string | undefined,
  ): never {
    if (this.IS_SPECULATING) throw SPEC_FAIL;
    const ruleName = this.getCurrRuleFullName();
    const ruleGrammar = this.getGAstProductions()[ruleName];
    const lookAheadPathsPerAlternative = getLookaheadPathsForOr(
      occurrence,
      ruleGrammar,
      this.maxLookahead,
    );

    const actualTokens = [];
    for (let i = 1; i <= this.maxLookahead; i++) {
      actualTokens.push(this.LA(i));
    }
    const previousToken = this.LA(0);

    const errMsg = this.errorMessageProvider.buildNoViableAltMessage({
      expectedPathsPerAlt: lookAheadPathsPerAlternative,
      actual: actualTokens,
      previous: previousToken,
      customUserDescription: errMsgTypes,
      ruleName: this.getCurrRuleFullName(),
    });

    throw this.SAVE_ERROR(
      new NoViableAltException(errMsg, this.LA(1), previousToken),
    );
  }

  // --- LexerAdapter (absorbed from trait) ---
  tokVector!: IToken[];
  tokVectorLength!: number;
  currIdx!: number;

  initLexerAdapter() {
    this.tokVector = [];
    this.tokVectorLength = 0;
    this.currIdx = -1;
  }

  set input(newInput: IToken[]) {
    // @ts-ignore - `this parameter` not supported in setters/getters
    const parser = this as any;
    if (!parser.selfAnalysisDone) {
      throw Error(
        `Missing <performSelfAnalysis> invocation at the end of the Parser's constructor.`,
      );
    }
    parser.reset();
    parser.tokVector = newInput;
    parser.tokVectorLength = newInput.length;
  }

  get input(): IToken[] {
    return this.tokVector;
  }

  SKIP_TOKEN(): IToken {
    if (this.currIdx <= this.tokVectorLength - 2) {
      this.consumeToken();
      return this.LA_FAST(1);
    } else {
      return END_OF_FILE;
    }
  }

  LA_FAST(howMuch: number): IToken {
    const soughtIdx = this.currIdx + howMuch;
    return this.tokVector[soughtIdx];
  }

  LA(howMuch: number): IToken {
    const soughtIdx = this.currIdx + howMuch;
    if (soughtIdx < 0 || this.tokVectorLength <= soughtIdx) {
      return END_OF_FILE;
    } else {
      return this.tokVector[soughtIdx];
    }
  }

  consumeToken() {
    this.currIdx++;
  }

  exportLexerState(): number {
    return this.currIdx;
  }

  importLexerState(newState: number) {
    this.currIdx = newState;
  }

  resetLexerState(): void {
    this.currIdx = -1;
  }

  moveToTerminatedState(): void {
    this.currIdx = this.tokVectorLength - 1;
  }

  getLexerPosition(): number {
    return this.exportLexerState();
  }

  TRACE_INIT<T>(phaseDesc: string, phaseImpl: () => T): T {
    if (this.traceInitPerf === true) {
      this.traceInitIndent++;
      const indent = new Array(this.traceInitIndent + 1).join("\t");
      if (this.traceInitIndent < this.traceInitMaxIdent) {
        console.log(`${indent}--> <${phaseDesc}>`);
      }
      const { time, value } = timer(phaseImpl);
      /* istanbul ignore next - Difficult to reproduce specific performance behavior (>10ms) in tests */
      const traceMethod = time > 10 ? console.warn : console.log;
      if (this.traceInitIndent < this.traceInitMaxIdent) {
        traceMethod(`${indent}<-- <${phaseDesc}> time: ${time}ms`);
      }
      this.traceInitIndent--;
      return value;
    } else {
      return phaseImpl();
    }
  }

  constructor(tokenVocabulary: TokenVocabulary, config: IParserConfig) {
    const that: any = this;
    that.initErrorHandler(config);
    that.initLexerAdapter();
    that.initLooksAhead(config);
    that.initRecognizerEngine(tokenVocabulary, config);
    that.initRecoverable(config);
    that.initTreeBuilder(config);
    that.initGastRecorder(config);
    that.initPerformanceTracer(config);

    if (Object.hasOwn(config, "ignoredIssues")) {
      throw new Error(
        "The <ignoredIssues> IParserConfig property has been deprecated.\n\t" +
          "Please use the <IGNORE_AMBIGUITIES> flag on the relevant DSL method instead.\n\t" +
          "See: https://chevrotain.io/docs/guide/resolving_grammar_errors.html#IGNORING_AMBIGUITIES\n\t" +
          "For further details.",
      );
    }

    this.skipValidations = Object.hasOwn(config, "skipValidations")
      ? (config.skipValidations as boolean) // casting assumes the end user passing the correct type
      : DEFAULT_PARSER_CONFIG.skipValidations;
  }
}

/**
 * Returns true when the production is "dispatch-sensitive": its mapKey lookup
 * depends on a stable _dslCounter value (Alternation/Repetition/Option).
 * Terminal and NonTerminal use _dslCounter only for error recovery — not the
 * hot success path — so they are NOT dispatch-sensitive.
 */
function isDispatchNode(prod: IProduction): boolean {
  return (
    prod instanceof Alternation ||
    prod instanceof Repetition ||
    prod instanceof RepetitionMandatory ||
    prod instanceof RepetitionWithSeparator ||
    prod instanceof RepetitionMandatoryWithSeparator ||
    prod instanceof Option
  );
}

/**
 * Find the immediate parent definition array that contains `target`.
 * Returns null if target is not found (shouldn't happen for valid GAST).
 */
function findParentDef(
  defs: IProduction[],
  target: IProduction,
): IProduction[] | null {
  for (const node of defs) {
    if (node === target) return defs;
    const subDef = (node as any).definition;
    if (isArray(subDef)) {
      const found = findParentDef(subDef as IProduction[], target);
      if (found !== null) return found;
    }
  }
  return null;
}

/**
 * Returns true when counter management must be preserved in the OR dispatch
 * closure. When false, orDispatchLL1Simple (no counter management) is safe.
 *
 * Counter management is required when:
 * - Recovery is enabled: _dslCounter must be correct for follow-set lookups in
 *   consumeInternalRecovery (CONSUME idx) and RULE_OCCURRENCE_STACK (subruleIdx).
 * - An alt body contains a dispatch-sensitive node (Alternation/Repetition/Option)
 *   whose mapKey lookup depends on a deterministic _dslCounter.
 * - A dispatch-sensitive sibling follows this alternation in its parent production
 *   (so _dslCounter after the OR must be normalized for subsequent dispatch).
 */
export function orNeedsCounterManagement(
  node: InstanceType<typeof Alternation>,
  rule: InstanceType<typeof Rule>,
  recoveryEnabled: boolean,
): boolean {
  if (recoveryEnabled) return true;
  for (const alt of node.definition) {
    for (const child of (alt as Alternative).definition) {
      if (isDispatchNode(child)) return true;
    }
  }
  const parentDef = findParentDef(rule.definition as IProduction[], node);
  if (parentDef !== null) {
    let passed = false;
    for (const sibling of parentDef) {
      if (passed) {
        if (isDispatchNode(sibling)) return true;
      } else if (sibling === node) {
        passed = true;
      }
    }
  }
  return false;
}

applyMixins(ParserBase, []);
