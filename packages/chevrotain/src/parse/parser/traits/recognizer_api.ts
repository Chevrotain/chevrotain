import {
  AtLeastOneSepMethodOpts,
  ConsumeMethodOpts,
  DSLMethodOpts,
  DSLMethodOptsWithErr,
  GrammarAction,
  IOrAlt,
  IRuleConfig,
  ISerializedGast,
  IToken,
  ManySepMethodOpts,
  OrMethodOpts,
  SubruleMethodOpts,
  TokenType,
} from "@chevrotain/types";
import { isRecognitionException } from "../../exceptions_public.js";
import {
  DEFAULT_RULE_CONFIG,
  ParserDefinitionErrorType,
  SPEC_FAIL,
} from "../parser.js";
import { defaultGrammarValidatorErrorProvider } from "../../errors_public.js";
import { validateRuleIsOverridden } from "../../grammar/checks.js";
import { MixedInParser } from "./parser_traits.js";
import { Rule, serializeGrammar } from "@chevrotain/gast";
import { IParserDefinitionError } from "../../grammar/types.js";
import { ParserMethodInternal } from "../types.js";

/**
 * This trait is responsible for implementing the public API
 * for defining Chevrotain parsers, i.e:
 * - CONSUME
 * - RULE
 * - OPTION
 * - ...
 */
export class RecognizerApi {
  ACTION<T>(this: MixedInParser, impl: () => T): T {
    if (this.RECORDING_PHASE) return this.ACTION_RECORD(impl);
    return impl.call(this);
  }

  // ──── lowercase consume ────
  consume(
    this: MixedInParser,
    _idx: number,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  // ──── lowercase subrule ────
  subrule<ARGS extends unknown[], R>(
    this: MixedInParser,
    _idx: number,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  // ──── lowercase option ────
  option<OUT>(
    this: MixedInParser,
    _idx: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  // ──── lowercase or ────
  or(
    this: MixedInParser,
    _idx: number,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<any>,
  ): any {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) return this.orInternalRecord(altsOrOpts, idx);
    return this.orInternal(altsOrOpts, idx);
  }

  // ──── lowercase many ────
  many(
    this: MixedInParser,
    _idx: number,
    actionORMethodDef: GrammarAction<any> | DSLMethodOpts<any>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    return this.manyInternal(idx, actionORMethodDef);
  }

  // ──── lowercase atLeastOne ────
  atLeastOne(
    this: MixedInParser,
    _idx: number,
    actionORMethodDef: GrammarAction<any> | DSLMethodOptsWithErr<any>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    return this.atLeastOneInternal(idx, actionORMethodDef);
  }

  // ──── CONSUME family ────
  CONSUME(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME1(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME2(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME3(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME4(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME5(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME6(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME7(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME8(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  CONSUME9(
    this: MixedInParser,
    tokType: TokenType,
    options?: ConsumeMethodOpts,
  ): IToken {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.consumeInternalRecord(tokType, idx, options);
    return this.consumeInternal(tokType, idx, options);
  }

  // ──── SUBRULE family ────
  SUBRULE<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE1<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE2<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE3<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE4<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE5<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE6<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE7<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE8<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  SUBRULE9<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    options?: SubruleMethodOpts<ARGS>,
  ): R {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.subruleInternalRecord(ruleToCall, idx, options) as R;
    return this.subruleInternal(ruleToCall, idx, options);
  }

  // ──── OPTION family ────
  OPTION<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION1<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION2<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION3<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION4<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION5<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION6<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION7<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION8<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  OPTION9<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): OUT | undefined {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE)
      return this.optionInternalRecord(actionORMethodDef, idx) as OUT;
    return this.optionInternal(actionORMethodDef, idx);
  }

  /**
   * Committed LL(1) fast dispatch — shared by OR, OR1-OR9, and lowercase or.
   *
   * For gate-free, non-speculating, unambiguous LL(1) grammars (JSON, CSS),
   * the fast-dispatch map gives us the exact alt for this LA(1) token.
   * Call it directly — no try/catch, no save/restore. V8 can inline this.
   *
   * Returns undefined when the fast path doesn't apply, signalling the
   * caller to fall through to orInternal (with try/catch + speculation).
   */

  // ──── OR family ────
  OR<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      return this.orInternalRecord(altsOrOpts, idx) as T;
    }
    return this.orInternal(altsOrOpts, idx);
  }

  OR1<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  OR2<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  OR3<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  OR4<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  OR5<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  OR6<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  OR7<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  OR8<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  OR9<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
  ): T {
    return this.OR(altsOrOpts);
  }

  // ──── MANY family ────
  MANY<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY1<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY2<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY3<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY4<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY5<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY6<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY7<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY8<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  MANY9<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manyInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.manyInternal(idx, actionORMethodDef);
  }

  // ──── MANY_SEP family ────
  MANY_SEP<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP1<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP2<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP3<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP4<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP5<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP6<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP7<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP8<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  MANY_SEP9<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.manySepFirstInternalRecord(idx, options);
      return;
    }
    this.manySepFirstInternal(idx, options);
  }

  // ──── AT_LEAST_ONE family ────
  AT_LEAST_ONE<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE1<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE2<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE3<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE4<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE5<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE6<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE7<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE8<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  AT_LEAST_ONE9<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneInternalRecord(idx, actionORMethodDef);
      return;
    }
    this.atLeastOneInternal(idx, actionORMethodDef);
  }

  // ──── AT_LEAST_ONE_SEP family ────
  AT_LEAST_ONE_SEP<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP1<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP2<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP3<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP4<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP5<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP6<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP7<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP8<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  AT_LEAST_ONE_SEP9<OUT>(
    this: MixedInParser,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    const idx = this._dslCounter++;
    if (this.RECORDING_PHASE) {
      this.atLeastOneSepFirstInternalRecord(idx, options);
      return;
    }
    this.atLeastOneSepFirstInternal(idx, options);
  }

  RULE<T>(
    this: MixedInParser,
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
    this: MixedInParser,
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
    this: MixedInParser,
    grammarRule: (...args: any[]) => T,
    args?: any[],
  ): () => boolean {
    if (this.RECORDING_PHASE) return this.BACKTRACK_RECORD(grammarRule, args);
    // Use coreRule to bypass root-level hooks (onBeforeParse/onAfterParse).
    // Backtracking is speculative and should not trigger parse lifecycle hooks.
    const ruleToCall = (grammarRule as any).coreRule ?? grammarRule;
    return function (this: MixedInParser) {
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
  public getGAstProductions(this: MixedInParser): Record<string, Rule> {
    this.ensureGastProductionsCachePopulated();
    return this.gastProductionsCache;
  }

  public getSerializedGastProductions(this: MixedInParser): ISerializedGast[] {
    this.ensureGastProductionsCachePopulated();
    return serializeGrammar(Object.values(this.gastProductionsCache));
  }
}
