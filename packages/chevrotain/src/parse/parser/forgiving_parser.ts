import { toFastProperties } from "@chevrotain/utils";
import { computeAllProdsFollows } from "../grammar/follow.js";
import { defaultGrammarValidatorErrorProvider } from "../errors_public.js";
import { isRecognitionException } from "../exceptions_public.js";
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
  DSLMethodOpts,
  DSLMethodOptsWithErr,
  GrammarAction,
  IOrAlt,
  IParserConfig,
  ISerializedGast,
  IToken,
  ManySepMethodOpts,
  OrMethodOpts,
  ParserMethod,
  SubruleMethodOpts,
  TokenType,
  TokenVocabulary,
  IProduction,
} from "@chevrotain/types";
import {
  NextTerminalAfterAtLeastOneSepWalker,
  NextTerminalAfterAtLeastOneWalker,
  NextTerminalAfterManySepWalker,
  NextTerminalAfterManyWalker,
} from "../grammar/interpreter.js";
import { LLkLookaheadStrategy } from "../grammar/llk_lookahead.js";
import { IParserDefinitionError } from "../grammar/types.js";
import {
  Alternation,
  NonTerminal,
  Rule,
  serializeGrammar,
} from "@chevrotain/gast";
import { IParserConfigInternal, ParserMethodInternal } from "./types.js";
import {
  addOrFastMapEntry,
  cloneSparseArray,
  cloneSparseNumberArrayTable,
  cloneSparseRecordTable,
  cloneSparseValueTable,
} from "./forgiving_parser_utils.js";
import {
  AT_LEAST_ONE_IDX,
  AT_LEAST_ONE_SEP_IDX,
  BITS_FOR_METHOD_TYPE,
  BITS_FOR_OCCURRENCE_IDX,
  getKeyForAutomaticLookahead,
  MANY_IDX,
  MANY_SEP_IDX,
  OPTION_IDX,
} from "../grammar/keys.js";
import { validateLookahead } from "../grammar/checks.js";
import {
  buildOrChoiceMap,
  DEFAULT_PARSER_CONFIG,
  GATED_OFFSET,
  OR_NO_MATCH,
  orNeedsCounterManagement,
  ParserBase,
  ParserDefinitionErrorType,
  SPEC_FAIL,
} from "./parser_core.js";

const { isArray } = Array;

// --- ForgivingParser helpers ---

function forgivingOrInternal<T>(
  this: any,
  altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  occurrence: number,
): T {
  const isAltsArray = isArray(altsOrOpts);
  const alts = isAltsArray
    ? (altsOrOpts as IOrAlt<any>[])
    : (altsOrOpts as OrMethodOpts<unknown>).DEF;
  const wasSpeculating = this.IS_SPECULATING;
  const mapKey = this.currRuleShortName | occurrence;

  const orDispatch = this._orLookahead[mapKey];
  if (orDispatch !== undefined && !wasSpeculating) {
    const result = orDispatch.call(this, alts);
    if (result !== OR_NO_MATCH) {
      return result as T;
    }
  }

  const la1 = this.LA_FAST(1);
  const la1TypeIdx = la1.tokenTypeIdx;

  const savedAltStartLexPos = this._orAltStartLexPos;
  const savedAltHasGatedPrefix = this._orAltHasGatedPrefix;
  const savedAltHasAnyPrefix = this._orAltHasAnyPrefix;

  const savedDslCounter = this._dslCounter;
  const altStarts = this._orAltCounterStarts[mapKey];

  const fastMap = this._orFastMaps[mapKey];
  const gatedPrefixAlts = this._orGatedPrefixAlts[mapKey];
  const cachedAltsRef = this._orFastMapAltsRef[mapKey];
  if (
    (fastMap !== undefined || gatedPrefixAlts !== undefined) &&
    (cachedAltsRef === undefined || cachedAltsRef === alts)
  ) {
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

    const fastAltIdx = fastMap !== undefined ? fastMap[la1TypeIdx] : undefined;

    if (fastAltIdx !== undefined && fastAltIdx >= 0) {
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

      const alt = alts[realAltIdx];
      if (alt.GATE === undefined || alt.GATE.call(this)) {
        if (altStarts !== undefined)
          this._dslCounter = savedDslCounter + altStarts[realAltIdx];

        const cm = this._orCommittable[mapKey];
        if (
          !wasSpeculating &&
          !this.dynamicTokensEnabled &&
          cm !== undefined &&
          cm[la1TypeIdx] === true &&
          (cachedAltsRef === undefined || cachedAltsRef === alts)
        ) {
          const r = alt.ALT.call(this) as T;
          {
            const d = this._orCounterDeltas[mapKey];
            if (d !== undefined) this._dslCounter = savedDslCounter + d;
          }
          this._orAltStartLexPos = savedAltStartLexPos;
          this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
          this._orAltHasAnyPrefix = savedAltHasAnyPrefix;
          return r;
        }

        const fastLexPos = this.currIdx;
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
  }

  const startLexPos = this.exportLexerState();
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
    this._orAltHasAnyPrefix = false;
    try {
      const result = alt.ALT.call(this) as T;
      this.IS_SPECULATING = wasSpeculating;
      if (this._orAltHasGatedPrefix) {
        let gpa = this._orGatedPrefixAlts[mapKey];
        if (gpa === undefined) {
          gpa = [];
          this._orGatedPrefixAlts[mapKey] = gpa;
          this.markRuntimeLookaheadCachesDirty();
        }
        if (!gpa.includes(i)) {
          gpa.push(i);
          if (gpa.length > 1) gpa.sort((a: number, b: number) => a - b);
          this.markRuntimeLookaheadCachesDirty();
        }
      } else {
        this.markRuntimeLookaheadCachesDirty();
        addOrFastMapEntry(
          this._orFastMaps,
          this._orFastMapAltsRef,
          mapKey,
          la1TypeIdx,
          i,
          alts,
          GATED_OFFSET,
        );
        if (!this._orAltHasAnyPrefix) {
          let cm = this._orCommittable[mapKey];
          if (cm === undefined) {
            cm = Object.create(null);
            this._orCommittable[mapKey] = cm;
            this.markRuntimeLookaheadCachesDirty();
          }
          cm[la1TypeIdx] = true;
          this.markRuntimeLookaheadCachesDirty();
        }
      }
      this._orAltStartLexPos = savedAltStartLexPos;
      this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
      this._orAltHasAnyPrefix = savedAltHasAnyPrefix;
      {
        const d = this._orCounterDeltas[mapKey];
        if (d !== undefined) this._dslCounter = savedDslCounter + d;
      }
      if (
        this._orLookahead[mapKey] === undefined &&
        this._orLookaheadLL1[mapKey] === undefined
      ) {
        this.lazyBuildOrClosure(mapKey);
      }
      return result;
    } catch (e) {
      this.IS_SPECULATING = wasSpeculating;
      if (e === SPEC_FAIL || isRecognitionException(e)) {
        if (this._orAltHasGatedPrefix) {
          let gpa = this._orGatedPrefixAlts[mapKey];
          if (gpa === undefined) {
            gpa = [];
            this._orGatedPrefixAlts[mapKey] = gpa;
            this.markRuntimeLookaheadCachesDirty();
          }
          if (!gpa.includes(i)) {
            gpa.push(i);
            if (gpa.length > 1) gpa.sort((a: number, b: number) => a - b);
            this.markRuntimeLookaheadCachesDirty();
          }
        }
        const progress = this.exportLexerState() - startLexPos;
        if (!this._orAltHasGatedPrefix && progress > 0) {
          this.markRuntimeLookaheadCachesDirty();
          addOrFastMapEntry(
            this._orFastMaps,
            this._orFastMapAltsRef,
            mapKey,
            la1TypeIdx,
            i,
            alts,
            GATED_OFFSET,
          );
        }
        this.importLexerState(startLexPos);
        this._errors.length = savedErrors;
        this.restoreCheckpoint(savedCst);
        continue;
      }
      throw e;
    }
  }

  {
    const recoveryMap = this._orFastMaps[mapKey];
    if (recoveryMap !== undefined) {
      let recoveryAltIdx = recoveryMap[la1TypeIdx];
      if (recoveryAltIdx !== undefined && recoveryAltIdx >= 0) {
        if (recoveryAltIdx >= GATED_OFFSET) recoveryAltIdx -= GATED_OFFSET;
        this.restoreCheckpoint(savedCst);
        this._errors.length = savedErrors;
        if (altStarts !== undefined)
          this._dslCounter = savedDslCounter + altStarts[recoveryAltIdx];
        this._orAltStartLexPos = startLexPos;
        this._orAltHasGatedPrefix = false;
        this.IS_SPECULATING = false;
        try {
          const result = alts[recoveryAltIdx].ALT.call(this) as T;
          this.IS_SPECULATING = wasSpeculating;
          this._orAltStartLexPos = savedAltStartLexPos;
          this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
          this._orAltHasAnyPrefix = savedAltHasAnyPrefix;
          {
            const d = this._orCounterDeltas[mapKey];
            if (d !== undefined) this._dslCounter = savedDslCounter + d;
          }
          return result;
        } catch (e) {
          this.IS_SPECULATING = wasSpeculating;
          this._orAltStartLexPos = savedAltStartLexPos;
          this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
          this._orAltHasAnyPrefix = savedAltHasAnyPrefix;
          throw e;
        }
      }
    }
  }

  this._orAltStartLexPos = savedAltStartLexPos;
  this._orAltHasGatedPrefix = savedAltHasGatedPrefix;
  {
    const d = this._orCounterDeltas[mapKey];
    if (d !== undefined) this._dslCounter = savedDslCounter + d;
  }

  if (this.IS_SPECULATING) {
    const failMap = this._orFastMaps[mapKey];
    if (failMap !== undefined && failMap[la1TypeIdx] !== undefined) {
      this.IS_SPECULATING = false;
      this.restoreCheckpoint(savedCst);
      this._errors.length = savedErrors;
      const em = isAltsArray
        ? undefined
        : (altsOrOpts as OrMethodOpts<unknown>).ERR_MSG;
      this.raiseNoAltException(occurrence, em);
      throw new Error("unreachable");
    }
    throw SPEC_FAIL;
  }
  const em = isAltsArray
    ? undefined
    : (altsOrOpts as OrMethodOpts<unknown>).ERR_MSG;
  this.raiseNoAltException(occurrence, em);
  throw new Error("unreachable");
}

export class ForgivingParser extends ParserBase {
  _lookaheadCacheBaselineCaptured!: boolean;
  _runtimeLookaheadCachesDirty!: boolean;
  _baselineOrFastMaps!: Record<number, Record<number, number>>;
  _baselineOrFastMapAltsRef!: Record<number, IOrAlt<any>[]>;
  _baselineOrGatedPrefixAlts!: Record<number, number[]>;
  _baselineOrCommittable!: Record<number, Record<number, boolean>>;
  _baselineOrLookahead!: Record<
    number,
    (orAlts: IOrAlt<any>[]) => number | undefined
  >;
  _baselineOrLookaheadLL1!: ((this: ParserBase) => number | undefined)[];
  _baselineProdLookahead!: Record<number, () => boolean>;
  /**
   * The alts array reference that was used to populate each OR site's fast
   * map. When a caller passes a different alts array (dynamic alternatives,
   * e.g., CSS `main` called from different contexts), the cached altIdx
   * may point to wrong/nonexistent alts. We detect this by identity check
   * and skip the fast path.
   */
  _orFastMapAltsRef!: Record<number, IOrAlt<any>[]>;
  /**
   * Per-OR set of alt indices whose first-token set is gate-dependent
   * (they have a gated OPTION/MANY/AT_LEAST_ONE before their first CONSUME).
   * Keyed by the same mapKey as _orFastMaps. These alts must always be
   * speculated on the fast path — they cannot be cached by LA(1) alone.
   */
  _orGatedPrefixAlts!: Record<number, number[]>;
  /**
   * Set during an OR alt's speculative execution. Records the lexer position
   * at the start of the alt so that gated productions (OPTION, MANY, etc.)
   * can detect whether they are executing before the first CONSUME.
   */
  _orAltStartLexPos!: number;
  /**
   * Set to true when a gated production (OPTION/MANY/AT_LEAST_ONE with GATE)
   * is encountered before the first CONSUME in an OR alt. When true, the alt
   * must not be added to the fast-dispatch candidate list because its
   * first-token set depends on gate state.
   */
  _orAltHasGatedPrefix!: boolean;
  /**
   * Set to true when ANY OPTION/MANY/AT_LEAST_ONE (gated or not) is
   * encountered before the first CONSUME in an OR alt. When true, the
   * alt's first-token match is not sufficient for committed dispatch —
   * the alt could fail partway through depending on the OPTION path.
   */
  _orAltHasAnyPrefix!: boolean;

  constructor(
    tokenVocabulary: TokenVocabulary,
    config: IParserConfig = DEFAULT_PARSER_CONFIG,
  ) {
    const configClone = { ...config } as IParserConfigInternal;
    configClone.outputCst = false;
    super(tokenVocabulary, configClone);
    this._lookaheadCacheBaselineCaptured = false;
    this._runtimeLookaheadCachesDirty = false;
    this._orFastMapAltsRef = [];
    this._orGatedPrefixAlts = [];
    this._orAltStartLexPos = 0;
    this._orAltHasGatedPrefix = false;
    this._orAltHasAnyPrefix = false;
    this._baselineOrFastMaps = [];
    this._baselineOrFastMapAltsRef = [];
    this._baselineOrGatedPrefixAlts = [];
    this._baselineOrCommittable = [];
    this._baselineOrLookahead = [];
    this._baselineOrLookaheadLL1 = [];
    this._baselineProdLookahead = [];
  }

  protected captureLookaheadCacheBaseline(): void {
    this._baselineOrFastMaps = cloneSparseRecordTable(this._orFastMaps);
    this._baselineOrFastMapAltsRef = cloneSparseValueTable(
      this._orFastMapAltsRef,
    );
    this._baselineOrGatedPrefixAlts = cloneSparseNumberArrayTable(
      this._orGatedPrefixAlts,
    );
    this._baselineOrCommittable = cloneSparseRecordTable(this._orCommittable);
    this._baselineOrLookahead = cloneSparseValueTable(this._orLookahead);
    this._baselineOrLookaheadLL1 = cloneSparseArray(this._orLookaheadLL1);
    this._baselineProdLookahead = cloneSparseValueTable(this._prodLookahead);
    this._lookaheadCacheBaselineCaptured = true;
    this._runtimeLookaheadCachesDirty = false;
  }

  protected restoreLookaheadCacheBaseline(): void {
    if (!this._lookaheadCacheBaselineCaptured) return;
    this._orFastMaps = cloneSparseRecordTable(this._baselineOrFastMaps);
    this._orFastMapAltsRef = cloneSparseValueTable(
      this._baselineOrFastMapAltsRef,
    );
    this._orGatedPrefixAlts = cloneSparseNumberArrayTable(
      this._baselineOrGatedPrefixAlts,
    );
    this._orCommittable = cloneSparseRecordTable(this._baselineOrCommittable);
    this._orLookahead = cloneSparseValueTable(this._baselineOrLookahead);
    this._orLookaheadLL1 = cloneSparseArray(this._baselineOrLookaheadLL1);
    this._prodLookahead = cloneSparseValueTable(this._baselineProdLookahead);
    this._runtimeLookaheadCachesDirty = false;
  }

  protected markRuntimeLookaheadCachesDirty(): void {
    this._runtimeLookaheadCachesDirty = true;
  }

  protected lazyBuildOrClosure(mapKey: number): void {
    try {
      this.ensureGastProductionsCachePopulated();
      const ruleName = this.shortRuleNameToFull[this.currRuleShortName];
      const rule = this.gastProductionsCache[ruleName];
      if (rule === undefined) return;

      const occurrence =
        mapKey & ((1 << (BITS_FOR_METHOD_TYPE + BITS_FOR_OCCURRENCE_IDX)) - 1);
      let targetNode: InstanceType<typeof Alternation> | undefined;
      const findAlt = (prods: IProduction[]) => {
        for (const prod of prods) {
          if (prod instanceof NonTerminal) continue;
          if (prod instanceof Alternation && prod.idx === occurrence) {
            targetNode = prod;
            return;
          }
          if ("definition" in prod && isArray(prod.definition)) {
            findAlt(prod.definition);
            if (targetNode) return;
          }
        }
      };
      findAlt(rule.definition);
      if (targetNode === undefined) return;

      const prodMaxLA = (targetNode as any).maxLookahead ?? this.maxLookahead;
      const paths = getLookaheadPathsForOr(occurrence, rule, prodMaxLA);

      const altStarts = this._orAltCounterStarts[mapKey];
      const counterDelta = this._orCounterDeltas[mapKey];
      const needsCounter = orNeedsCounterManagement(
        targetNode,
        rule,
        this.recoveryEnabled,
      );
      const choiceToAlt =
        !targetNode.hasPredicates && !this.dynamicTokensEnabled
          ? buildOrChoiceMap(paths)
          : null;
      if (choiceToAlt !== null) {
        if (
          needsCounter &&
          altStarts !== undefined &&
          counterDelta !== undefined
        ) {
          this._orLookahead[mapKey] = function orDispatchLL1(
            this: ParserBase,
            orAlts: IOrAlt<any>[],
          ): any {
            const altIdx =
              choiceToAlt[this.tokVector[this.currIdx + 1].tokenTypeIdx!];
            if (altIdx !== undefined) {
              const saved = this._dslCounter;
              this._dslCounter = saved + altStarts[altIdx];
              const r = orAlts[altIdx].ALT.call(this);
              this._dslCounter = saved + counterDelta;
              return r;
            }
            return OR_NO_MATCH;
          };
          this.markRuntimeLookaheadCachesDirty();
        } else {
          this._orLookaheadLL1[mapKey] = function orDispatchLL1Simple(
            this: ParserBase,
          ): number | undefined {
            return choiceToAlt[this.tokVector[this.currIdx + 1].tokenTypeIdx!];
          };
          this.markRuntimeLookaheadCachesDirty();
        }
      } else {
        const tmatcher = this.tokenMatcher;
        const laFunc = buildAlternativesLookAheadFunc(
          paths,
          targetNode.hasPredicates,
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
            orAlts: IOrAlt<any>[],
          ): any {
            const altIdx = laFunc.call(this, orAlts);
            if (altIdx !== undefined) {
              const saved = this._dslCounter;
              this._dslCounter = saved + altStarts[altIdx];
              const r = orAlts[altIdx].ALT.call(this);
              this._dslCounter = saved + counterDelta;
              return r;
            }
            return OR_NO_MATCH;
          };
          this.markRuntimeLookaheadCachesDirty();
        } else {
          this._orLookahead[mapKey] = function orDispatchSimple(
            this: ParserBase,
            orAlts: IOrAlt<any>[],
          ): any {
            const altIdx = laFunc.call(this, orAlts);
            if (altIdx !== undefined) {
              return orAlts[altIdx].ALT.call(this);
            }
            return OR_NO_MATCH;
          };
          this.markRuntimeLookaheadCachesDirty();
        }
      }
    } catch (_e) {
      // GAST walk failed — stay on speculative path.
    }
  }

  protected lazyBuildProdClosure(
    laKey: number,
    occurrence: number,
    _keyIdx: number,
    prodType: PROD_TYPE,
  ): void {
    try {
      this.ensureGastProductionsCachePopulated();
      const ruleName = this.shortRuleNameToFull[this.currRuleShortName];
      const rule = this.gastProductionsCache[ruleName];
      if (rule === undefined) return;

      const prodMaxLA = this.maxLookahead;
      const paths = getLookaheadPathsForOptionalProd(
        occurrence,
        rule,
        prodType,
        prodMaxLA,
      );
      const insidePaths = paths[0];
      const afterPaths = paths[1];
      if (insidePaths === undefined || insidePaths.length === 0) return;
      if (afterPaths !== undefined && afterPaths.length > 0) {
        const insideFirst = new Set(
          insidePaths
            .filter((p) => p.length > 0)
            .map((p) => p[0]?.tokenTypeIdx),
        );
        const hasOverlap = afterPaths.some(
          (p) => p.length > 0 && insideFirst.has(p[0]?.tokenTypeIdx),
        );
        if (hasOverlap) return;
      }
      const tmatcher = this.tokenMatcher;
      this._prodLookahead[laKey] = buildSingleAlternativeLookaheadFunction(
        insidePaths,
        tmatcher,
        this.dynamicTokensEnabled,
      );
      this.markRuntimeLookaheadCachesDirty();
    } catch (_e) {
      // GAST walk failed — stay on speculative path.
    }
  }

  public override reset(): void {
    if (this._runtimeLookaheadCachesDirty) {
      this.restoreLookaheadCacheBaseline();
    }
    super.reset();
  }

  override CONSUME(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(0, tokType, options);
  }

  override CONSUME1(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(1, tokType, options);
  }

  override CONSUME2(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(2, tokType, options);
  }

  override CONSUME3(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(3, tokType, options);
  }

  override CONSUME4(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(4, tokType, options);
  }

  override CONSUME5(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(5, tokType, options);
  }

  override CONSUME6(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(6, tokType, options);
  }

  override CONSUME7(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(7, tokType, options);
  }

  override CONSUME8(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(8, tokType, options);
  }

  override CONSUME9(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
    return this.consume(9, tokType, options);
  }

  override SUBRULE<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      0,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE1<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE1<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      1,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE2<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE2<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      2,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE3<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE3<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      3,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE4<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE4<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      4,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE5<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE5<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      5,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE6<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE6<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      6,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE7<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE7<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      7,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE8<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE8<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      8,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override SUBRULE9<ARGS extends unknown[], R>(
    ruleToCall: ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R;
  override SUBRULE9<ARGS extends unknown[], R>(
    ruleToCall: ParserMethodInternal<ARGS, R> | ParserMethod<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    return this.subrule(
      9,
      ruleToCall as ParserMethodInternal<ARGS, R>,
      options,
    );
  }

  override OPTION<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(0, actionORMethodDef);
  }

  override OPTION1<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(1, actionORMethodDef);
  }

  override OPTION2<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(2, actionORMethodDef);
  }

  override OPTION3<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(3, actionORMethodDef);
  }

  override OPTION4<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(4, actionORMethodDef);
  }

  override OPTION5<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(5, actionORMethodDef);
  }

  override OPTION6<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(6, actionORMethodDef);
  }

  override OPTION7<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(7, actionORMethodDef);
  }

  override OPTION8<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(8, actionORMethodDef);
  }

  override OPTION9<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    return this.option(9, actionORMethodDef);
  }

  override OR<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(0, altsOrOpts);
  }

  override OR1<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(1, altsOrOpts);
  }

  override OR2<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(2, altsOrOpts);
  }

  override OR3<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(3, altsOrOpts);
  }

  override OR4<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(4, altsOrOpts);
  }

  override OR5<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(5, altsOrOpts);
  }

  override OR6<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(6, altsOrOpts);
  }

  override OR7<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(7, altsOrOpts);
  }

  override OR8<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(8, altsOrOpts);
  }

  override OR9<T>(altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>): T {
    return this.or(9, altsOrOpts);
  }

  override MANY<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(0, actionORMethodDef);
  }

  override MANY1<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(1, actionORMethodDef);
  }

  override MANY2<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(2, actionORMethodDef);
  }

  override MANY3<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(3, actionORMethodDef);
  }

  override MANY4<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(4, actionORMethodDef);
  }

  override MANY5<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(5, actionORMethodDef);
  }

  override MANY6<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(6, actionORMethodDef);
  }

  override MANY7<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(7, actionORMethodDef);
  }

  override MANY8<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(8, actionORMethodDef);
  }

  override MANY9<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    this.many(9, actionORMethodDef);
  }

  override MANY_SEP<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(0, options);
  }

  override MANY_SEP1<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(1, options);
  }

  override MANY_SEP2<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(2, options);
  }

  override MANY_SEP3<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(3, options);
  }

  override MANY_SEP4<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(4, options);
  }

  override MANY_SEP5<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(5, options);
  }

  override MANY_SEP6<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(6, options);
  }

  override MANY_SEP7<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(7, options);
  }

  override MANY_SEP8<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(8, options);
  }

  override MANY_SEP9<OUT>(options: ManySepMethodOpts<OUT>): void {
    this.manySep(9, options);
  }

  override AT_LEAST_ONE<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(0, actionORMethodDef);
  }

  override AT_LEAST_ONE1<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(1, actionORMethodDef);
  }

  override AT_LEAST_ONE2<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(2, actionORMethodDef);
  }

  override AT_LEAST_ONE3<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(3, actionORMethodDef);
  }

  override AT_LEAST_ONE4<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(4, actionORMethodDef);
  }

  override AT_LEAST_ONE5<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(5, actionORMethodDef);
  }

  override AT_LEAST_ONE6<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(6, actionORMethodDef);
  }

  override AT_LEAST_ONE7<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(7, actionORMethodDef);
  }

  override AT_LEAST_ONE8<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(8, actionORMethodDef);
  }

  override AT_LEAST_ONE9<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    this.atLeastOne(9, actionORMethodDef);
  }

  override AT_LEAST_ONE_SEP<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(0, options);
  }

  override AT_LEAST_ONE_SEP1<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(1, options);
  }

  override AT_LEAST_ONE_SEP2<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(2, options);
  }

  override AT_LEAST_ONE_SEP3<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(3, options);
  }

  override AT_LEAST_ONE_SEP4<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(4, options);
  }

  override AT_LEAST_ONE_SEP5<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(5, options);
  }

  override AT_LEAST_ONE_SEP6<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(6, options);
  }

  override AT_LEAST_ONE_SEP7<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(7, options);
  }

  override AT_LEAST_ONE_SEP8<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(8, options);
  }

  override AT_LEAST_ONE_SEP9<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
    this.atLeastOneSep(9, options);
  }

  public override performSelfAnalysis(): void {
    this.TRACE_INIT("performSelfAnalysis", () => {
      let defErrorsMsgs;

      this.selfAnalysisDone = true;
      const className = this.className;

      this.TRACE_INIT("toFastProps", () => {
        toFastProperties(this);
      });

      this.TRACE_INIT("Grammar Recording", () => {
        try {
          this.enableRecording();
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

      if (this.definitionErrors.length === 0) {
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
        const fatalErrors = this.definitionErrors.filter(
          (e) =>
            e.type !== ParserDefinitionErrorType.AMBIGUOUS_ALTS &&
            e.type !== ParserDefinitionErrorType.AMBIGUOUS_PREFIX_ALTS,
        );
        if (fatalErrors.length !== 0) {
          defErrorsMsgs = fatalErrors.map((defError) => defError.message);
          throw new Error(
            `Parser Definition Errors detected:\n ${defErrorsMsgs.join(
              "\n-------------------------------\n",
            )}`,
          );
        }
      }
      this.captureLookaheadCacheBaseline();
    });
  }

  public override getGAstProductions(): Record<string, Rule> {
    this.ensureGastProductionsCachePopulated();
    return this.gastProductionsCache;
  }

  public override getSerializedGastProductions(): ISerializedGast[] {
    this.ensureGastProductionsCachePopulated();
    return serializeGrammar(Object.values(this.gastProductionsCache));
  }

  override enableRecording(): void {
    this.RECORDING_PHASE = true;
    this.TRACE_INIT("Enable Recording", () => {
      this.captureRecordingApiBackup();
      const that: any = this;
      that.consume = function (
        _idx: number,
        arg1: TokenType,
        arg2?: ConsumeMethodOpts,
      ) {
        const idx = this._dslCounter++;
        return this.consumeInternalRecord(arg1, idx, arg2);
      };
      that.subrule = function (
        _idx: number,
        arg1: ParserMethodInternal<unknown[], unknown>,
        arg2?: SubruleMethodOpts<unknown[]>,
      ) {
        const idx = this._dslCounter++;
        return this.subruleInternalRecord(arg1, idx, arg2);
      };
      that.option = function (
        _idx: number,
        arg1: GrammarAction<unknown> | DSLMethodOpts<unknown>,
      ) {
        const idx = this._dslCounter++;
        return this.optionInternalRecord(arg1, idx);
      };
      that.or = function (
        _idx: number,
        arg1: IOrAlt<unknown>[] | OrMethodOpts<unknown>,
      ) {
        const idx = this._dslCounter++;
        return this.orInternalRecord(arg1, idx);
      };
      that.many = function (
        _idx: number,
        arg1: GrammarAction<unknown> | DSLMethodOpts<unknown>,
      ) {
        const idx = this._dslCounter++;
        this.manyInternalRecord(idx, arg1);
      };
      that.manySep = function (_idx: number, arg1: ManySepMethodOpts<unknown>) {
        const idx = this._dslCounter++;
        this.manySepFirstInternalRecord(idx, arg1);
      };
      that.atLeastOne = function (
        _idx: number,
        arg1: GrammarAction<unknown> | DSLMethodOptsWithErr<unknown>,
      ) {
        const idx = this._dslCounter++;
        this.atLeastOneInternalRecord(idx, arg1);
      };
      that.atLeastOneSep = function (
        _idx: number,
        arg1: AtLeastOneSepMethodOpts<unknown>,
      ) {
        const idx = this._dslCounter++;
        this.atLeastOneSepFirstInternalRecord(idx, arg1);
      };
      that.ACTION = this.ACTION_RECORD;
      that.BACKTRACK = this.BACKTRACK_RECORD;
      that.LA = this.LA_RECORD;
    });
  }

  override disableRecording() {
    this.RECORDING_PHASE = false;
    this.TRACE_INIT("Restore Recording methods", () => {
      this.restoreRecordingApiBackup();
    });
  }

  override ensureGastProductionsCachePopulated(): void {
    if (Object.keys(this.gastProductionsCache).length > 0) {
      return;
    }
    toFastProperties(this);
    try {
      this.enableRecording();
      this.definedRulesNames.forEach((currRuleName: string) => {
        const wrappedRule = (this as any)[currRuleName] as ParserMethodInternal<
          unknown[],
          unknown
        >;
        const originalGrammarAction = wrappedRule["originalGrammarAction"];
        const recordedRuleGast = this.topLevelRuleRecord(
          currRuleName,
          originalGrammarAction,
        );
        this.gastProductionsCache[currRuleName] = recordedRuleGast;
      });
    } finally {
      this.disableRecording();
    }
    const resolverErrors = resolveGrammar({
      rules: Object.values(this.gastProductionsCache),
    });
    this.definitionErrors = this.definitionErrors.concat(resolverErrors);
    if (resolverErrors.length === 0 && this.skipValidations === false) {
      const validationErrors = validateGrammar({
        rules: Object.values(this.gastProductionsCache),
        tokenTypes: Object.values(this.tokensMap),
        errMsgProvider: defaultGrammarValidatorErrorProvider,
        grammarName: this.className,
      });
      this.definitionErrors = this.definitionErrors.concat(validationErrors);
      const lookaheadValidationErrors = validateLookahead({
        lookaheadStrategy: this.lookaheadStrategy,
        rules: Object.values(this.gastProductionsCache),
        tokenTypes: Object.values(this.tokensMap),
        grammarName: this.className,
      });
      this.definitionErrors = this.definitionErrors.concat(
        lookaheadValidationErrors,
      );
    }
    if (
      !(this.constructor as typeof ParserBase)
        .DEFER_DEFINITION_ERRORS_HANDLING &&
      this.definitionErrors.length !== 0
    ) {
      const fatalErrors = this.definitionErrors.filter(
        (e) =>
          e.type !== ParserDefinitionErrorType.AMBIGUOUS_ALTS &&
          e.type !== ParserDefinitionErrorType.AMBIGUOUS_PREFIX_ALTS,
      );
      if (fatalErrors.length !== 0) {
        const defErrorsMsgs = fatalErrors.map((defError) => defError.message);
        throw new Error(
          `Parser Definition Errors detected:\n ${defErrorsMsgs.join(
            "\n-------------------------------\n",
          )}`,
        );
      }
    }
    if (this.definitionErrors.length === 0 && this.recoveryEnabled) {
      const allFollows = computeAllProdsFollows(
        Object.values(this.gastProductionsCache),
      );
      this.resyncFollows = allFollows;
    }
    if (this.definitionErrors.length === 0) {
      this.preComputeLookaheadCaches(false);
      if (this.lookaheadStrategy instanceof LLkLookaheadStrategy) {
        this.prePopulateOrFastMaps();
      } else {
        this.preComputeLookaheadCaches(true);
      }
    }
    this.captureLookaheadCacheBaseline();
    this.selfAnalysisDone = true;
  }

  override set input(newInput: IToken[]) {
    if (!this.selfAnalysisDone) {
      this.ensureGastProductionsCachePopulated();
    }
    this.reset();
    this.tokVector = newInput;
    this.tokVectorLength = newInput.length;
  }

  override ruleInvocationStateUpdate(
    shortName: number,
    fullName: string,
    idxInCallingRule: number,
  ): void {
    const depth = ++this.RULE_STACK_IDX;
    this.RULE_OCCURRENCE_STACK[depth] = idxInCallingRule;
    this.RULE_STACK[depth] = shortName;
    this.currRuleShortName = shortName;
    this._dslCounterStack[depth] = this._dslCounter;
    this._dslCounter = 0;
    this.cstInvocationStateUpdate(fullName);
  }

  override ruleFinallyStateUpdate(): void {
    this._dslCounter = this._dslCounterStack[this.RULE_STACK_IDX];
    this.RULE_STACK_IDX--;

    if (this.RULE_STACK_IDX >= 0) {
      this.currRuleShortName = this.RULE_STACK[this.RULE_STACK_IDX];
    }

    this.cstFinallyStateUpdate();
  }

  override consume(
    _idx: number,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    return this.consumeInternal(tokType, idx, options);
  }

  override subrule<ARGS extends unknown[], R>(
    _idx: number,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (options === undefined) {
      this.subruleIdx = idx;
      try {
        const ruleResult = ruleToCall.coreRule.call(this);
        this.cstPostNonTerminal(ruleResult, ruleToCall.ruleName);
        return ruleResult;
      } catch (e) {
        throw this.subruleInternalError(e, undefined, ruleToCall.ruleName);
      }
    }
    return this.subruleInternal(ruleToCall, idx, options);
  }

  override option<OUT>(
    _idx: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (!this.IS_SPECULATING) {
      const laFunc =
        this._prodLookahead[this.currRuleShortName | OPTION_IDX | idx];
      if (laFunc !== undefined) {
        let action: GrammarAction<OUT>;
        let gate: (() => boolean) | undefined;
        if (typeof actionORMethodDef === "function") {
          action = actionORMethodDef;
          gate = undefined;
        } else {
          action = actionORMethodDef.DEF;
          gate = actionORMethodDef.GATE;
        }
        if (gate !== undefined && !gate.call(this)) return undefined;
        if (!laFunc.call(this)) return undefined;
        const optPos = this.currIdx;
        const optErrors = this._errors.length;
        const optCst = this.saveCheckpoint();
        try {
          return action.call(this);
        } catch (e) {
          if (e === SPEC_FAIL || isRecognitionException(e)) {
            this.restoreCheckpoint(optCst);
            this.currIdx = optPos;
            this._errors.length = optErrors;
            return undefined;
          }
          throw e;
        }
      }
    }
    return this.optionInternal(actionORMethodDef, idx);
  }

  override optionInternal<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
    occurrence: number,
  ): OUT | undefined {
    return this.optionInternalLogic(actionORMethodDef, occurrence);
  }

  override optionInternalLogic<OUT>(
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
    occurrence?: number,
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

    const errors = this._errors;

    if (this.IS_SPECULATING) {
      if (this.exportLexerState() === this._orAltStartLexPos) {
        this._orAltHasAnyPrefix = true;
        if (gate !== undefined) {
          this._orAltHasGatedPrefix = true;
        }
      }
    }
    if (gate !== undefined && !gate.call(this)) {
      return undefined;
    }

    if (occurrence !== undefined && !this.IS_SPECULATING) {
      const optLaKey = this.currRuleShortName | OPTION_IDX | occurrence;
      const laFunc = this._prodLookahead[optLaKey];
      if (laFunc !== undefined) {
        if (!laFunc.call(this)) {
          return undefined;
        }
        const optPos = this.currIdx;
        const optErrors = errors.length;
        const optCst = this.saveCheckpoint();
        try {
          return action.call(this);
        } catch (e) {
          if (e === SPEC_FAIL || isRecognitionException(e)) {
            this.restoreCheckpoint(optCst);
            this.currIdx = optPos;
            errors.length = optErrors;
            return undefined;
          }
          throw e;
        }
      }
    }

    const startPos = this.currIdx;
    const startErrors = errors.length;
    const cstSave = this.saveCheckpoint();
    try {
      const result = action.call(this);
      if (this.currIdx === startPos || errors.length > startErrors) {
        this.restoreCheckpoint(cstSave);
        this.currIdx = startPos;
        errors.length = startErrors;
        return undefined;
      }
      if (occurrence !== undefined) {
        const optLaKey = this.currRuleShortName | OPTION_IDX | occurrence;
        if (this._prodLookahead[optLaKey] === undefined) {
          this.lazyBuildProdClosure(
            optLaKey,
            occurrence,
            OPTION_IDX,
            PROD_TYPE.OPTION,
          );
        }
      }
      return result;
    } catch (e) {
      if (e === SPEC_FAIL || isRecognitionException(e)) {
        this.restoreCheckpoint(cstSave);
        this.currIdx = startPos;
        errors.length = startErrors;
        return undefined;
      }
      throw e;
    }
  }

  override or<T = unknown>(
    _idx: number,
    altsOrOpts: IOrAlt<T>[] | OrMethodOpts<T>,
  ): T {
    const idx = this._dslCounter++;
    if (!this.IS_SPECULATING) {
      const mapKey = this.currRuleShortName | idx;
      const ll1Dispatch = this._orLookaheadLL1[mapKey];
      if (ll1Dispatch !== undefined) {
        const altIdx = ll1Dispatch.call(this);
        if (altIdx !== undefined) {
          const alts = isArray(altsOrOpts)
            ? (altsOrOpts as IOrAlt<T>[])
            : (altsOrOpts as OrMethodOpts<T>).DEF;
          return alts[altIdx].ALT.call(this) as T;
        }
        return this.orInternal(altsOrOpts, idx);
      }
      const orDispatch = this._orLookahead[mapKey];
      if (orDispatch !== undefined) {
        const alts = isArray(altsOrOpts)
          ? (altsOrOpts as IOrAlt<T>[])
          : (altsOrOpts as OrMethodOpts<T>).DEF;
        const result = orDispatch.call(this, alts);
        if (result !== OR_NO_MATCH) return result as T;
      }
    }
    return this.orInternal(altsOrOpts, idx);
  }

  override orInternal<T>(
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
    occurrence: number,
  ): T {
    return forgivingOrInternal.call(this, altsOrOpts, occurrence);
  }

  override many(
    _idx: number,
    actionORMethodDef: GrammarAction<any> | DSLMethodOpts<any>,
  ): void {
    const idx = this._dslCounter++;
    this.manyInternal(idx, actionORMethodDef);
  }

  override manyInternal<OUT>(
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    return this.manyInternalLogic(prodOccurrence, actionORMethodDef);
  }

  override manyInternalLogic<OUT>(
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
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

    const errors = this._errors;
    const wasSpeculating = this.IS_SPECULATING;
    const savedRepDslCounter = this._dslCounter;
    const laKey = getKeyForAutomaticLookahead(
      this.currRuleShortName,
      MANY_IDX,
      prodOccurrence,
    );
    const laSet = this._prodLookahead[laKey];

    let notStuck = true;
    let ranAtLeastOnce = false;
    let lookaheadFunc: (() => boolean) | undefined;

    if (!wasSpeculating && laSet !== undefined) {
      while (notStuck) {
        if (gate !== undefined && !gate.call(this)) break;
        if (!laSet.call(this)) break;

        this._dslCounter = savedRepDslCounter;
        const iterPos = this.currIdx;

        action.call(this);

        if (this.currIdx <= iterPos) {
          notStuck = false;
          break;
        }

        ranAtLeastOnce = true;
      }
    }
    if (wasSpeculating || laSet === undefined) {
      while (notStuck) {
        if (this.IS_SPECULATING && !ranAtLeastOnce) {
          if (this.currIdx === this._orAltStartLexPos) {
            this._orAltHasAnyPrefix = true;
            if (gate !== undefined) {
              this._orAltHasGatedPrefix = true;
            }
          }
        }

        if (gate !== undefined && !gate.call(this)) break;

        this._dslCounter = savedRepDslCounter;
        const iterPos = this.currIdx;
        const iterErrors = errors.length;
        const cstSave = this.saveCheckpoint();

        this.IS_SPECULATING = true;
        try {
          action.call(this);
          this.IS_SPECULATING = wasSpeculating;
        } catch (e) {
          this.IS_SPECULATING = wasSpeculating;

          if (e === SPEC_FAIL) {
            this.currIdx = iterPos;
            this.restoreCheckpoint(cstSave);
            errors.length = iterErrors;
            break;
          }

          if (isRecognitionException(e)) {
            if (this.currIdx > iterPos) {
              throw e;
            }
            this.currIdx = iterPos;
            this.restoreCheckpoint(cstSave);
            errors.length = iterErrors;
            break;
          }

          throw e;
        }

        if (this.currIdx <= iterPos) {
          this.currIdx = iterPos;
          notStuck = false;
          break;
        }

        ranAtLeastOnce = true;
      }
    }

    if (ranAtLeastOnce && laSet === undefined) {
      this.lazyBuildProdClosure(
        laKey,
        prodOccurrence,
        MANY_IDX,
        PROD_TYPE.REPETITION,
      );
    }

    if (ranAtLeastOnce) {
      lookaheadFunc ??= this.makeSpecLookahead(action);
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

  protected override manySep(
    _idx: number,
    options: ManySepMethodOpts<any>,
  ): void {
    const idx = this._dslCounter++;
    this.manySepFirstInternal(idx, options);
  }

  override manySepFirstInternal<OUT>(
    prodOccurrence: number,
    options: ManySepMethodOpts<OUT>,
  ): void {
    this.manySepFirstInternalLogic(prodOccurrence, options);
  }

  override manySepFirstInternalLogic<OUT>(
    prodOccurrence: number,
    options: ManySepMethodOpts<OUT>,
  ): void {
    const action = options.DEF;
    const separator = options.SEP;
    const errors = this._errors;
    const tokenMatcher = this.tokenMatcher;

    const savedRepDslCounter = this._dslCounter;

    const firstLexPos = this.exportLexerState();
    const firstErrors = errors.length;
    const firstCstSave = this.saveCheckpoint();
    try {
      action.call(this);
    } catch (e) {
      if (e === SPEC_FAIL || isRecognitionException(e)) {
        this.restoreCheckpoint(firstCstSave);
        this.importLexerState(firstLexPos);
        errors.length = firstErrors;
        return;
      }
      throw e;
    }
    if (this.exportLexerState() <= firstLexPos) {
      this.restoreCheckpoint(firstCstSave);
      this.importLexerState(firstLexPos);
      errors.length = firstErrors;
      return;
    }

    const separatorLookAheadFunc = () =>
      tokenMatcher(this.LA_FAST(1), separator);
    while (tokenMatcher(this.LA_FAST(1), separator) === true) {
      this.CONSUME(separator);
      this._dslCounter = savedRepDslCounter;
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

  override atLeastOne(
    _idx: number,
    actionORMethodDef: GrammarAction<any> | DSLMethodOptsWithErr<any>,
  ): void {
    const idx = this._dslCounter++;
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  override atLeastOneInternal<OUT>(
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    return this.atLeastOneInternalLogic(prodOccurrence, actionORMethodDef);
  }

  override atLeastOneInternalLogic<OUT>(
    prodOccurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    let action: GrammarAction<OUT>;
    let gate: (() => boolean) | undefined;
    let errMsg: string | undefined;
    if (typeof actionORMethodDef !== "function") {
      action = actionORMethodDef.DEF;
      gate = actionORMethodDef.GATE;
      errMsg = actionORMethodDef.ERR_MSG;
    } else {
      action = actionORMethodDef;
      gate = undefined;
      errMsg = undefined;
    }

    const errors = this._errors;

    if (this.IS_SPECULATING) {
      if (this.exportLexerState() === this._orAltStartLexPos) {
        this._orAltHasAnyPrefix = true;
        if (gate !== undefined) {
          this._orAltHasGatedPrefix = true;
        }
      }
    }
    if (gate !== undefined && !gate.call(this)) {
      throw this.raiseEarlyExitException(
        prodOccurrence,
        PROD_TYPE.REPETITION_MANDATORY,
        errMsg,
      );
    }

    const savedRepDslCounter = this._dslCounter;
    const lookaheadFunc = this.makeSpecLookahead(action);
    if (!lookaheadFunc()) {
      throw this.raiseEarlyExitException(
        prodOccurrence,
        PROD_TYPE.REPETITION_MANDATORY,
        errMsg,
      );
    }

    {
      this._dslCounter = savedRepDslCounter;
      const firstLexPos = this.exportLexerState();
      const firstErrors = errors.length;
      const firstCstSave = this.saveCheckpoint();
      try {
        action.call(this);
      } catch (e) {
        if (e === SPEC_FAIL || isRecognitionException(e)) {
          this.restoreCheckpoint(firstCstSave);
          this.importLexerState(firstLexPos);
          errors.length = firstErrors;
          throw this.raiseEarlyExitException(
            prodOccurrence,
            PROD_TYPE.REPETITION_MANDATORY,
            errMsg,
          );
        }
        throw e;
      }
    }

    while (lookaheadFunc()) {
      if (gate !== undefined && !gate.call(this)) break;
      this._dslCounter = savedRepDslCounter;
      const iterLexPos = this.exportLexerState();
      const iterErrors = errors.length;
      const cstSave = this.saveCheckpoint();
      try {
        action.call(this);
      } catch (e) {
        if (e === SPEC_FAIL || isRecognitionException(e)) {
          this.restoreCheckpoint(cstSave);
          this.importLexerState(iterLexPos);
          errors.length = iterErrors;
          break;
        }
        throw e;
      }
      if (this.exportLexerState() <= iterLexPos) {
        this.restoreCheckpoint(cstSave);
        this.importLexerState(iterLexPos);
        errors.length = iterErrors;
        break;
      }
    }
    this.attemptInRepetitionRecovery(
      this.atLeastOneInternal,
      [prodOccurrence, actionORMethodDef],
      lookaheadFunc,
      AT_LEAST_ONE_IDX,
      prodOccurrence,
      NextTerminalAfterAtLeastOneWalker,
    );
  }

  protected override atLeastOneSep(
    _idx: number,
    options: AtLeastOneSepMethodOpts<any>,
  ): void {
    const idx = this._dslCounter++;
    this.atLeastOneSepFirstInternal(idx, options);
  }

  override atLeastOneSepFirstInternal<OUT>(
    prodOccurrence: number,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    this.atLeastOneSepFirstInternalLogic(prodOccurrence, options);
  }

  override atLeastOneSepFirstInternalLogic<OUT>(
    prodOccurrence: number,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const action = options.DEF;
    const separator = options.SEP;
    const errors = this._errors;
    const tokenMatcher = this.tokenMatcher;

    const savedRepDslCounter = this._dslCounter;

    {
      this._dslCounter = savedRepDslCounter;
      const firstLexPos = this.exportLexerState();
      const firstErrors = errors.length;
      const firstCstSave = this.saveCheckpoint();
      try {
        action.call(this);
      } catch (e) {
        if (e === SPEC_FAIL || isRecognitionException(e)) {
          this.restoreCheckpoint(firstCstSave);
          this.importLexerState(firstLexPos);
          errors.length = firstErrors;
          throw this.raiseEarlyExitException(
            prodOccurrence,
            PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
            options.ERR_MSG,
          );
        }
        throw e;
      }
    }

    const separatorLookAheadFunc = () =>
      tokenMatcher(this.LA_FAST(1), separator);
    while (tokenMatcher(this.LA_FAST(1), separator) === true) {
      this.CONSUME(separator);
      this._dslCounter = savedRepDslCounter;
      action.call(this);
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
  }
}

export class SmartParser extends ForgivingParser {}
