import {
  AtLeastOneSepMethodOpts,
  ConsumeMethodOpts,
  CstNode,
  DSLMethodOpts,
  DSLMethodOptsWithErr,
  GrammarAction,
  IOrAlt,
  IParserConfig,
  IProduction,
  IToken,
  ManySepMethodOpts,
  OrMethodOpts,
  SubruleMethodOpts,
  TokenType,
} from "@chevrotain/types";

import { MixedInParser } from "./parser_traits.js";
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
  Terminal,
} from "@chevrotain/gast";
import { Lexer } from "../../../scan/lexer_public.js";
import {
  augmentTokenTypes,
  hasShortKeyProperty,
} from "../../../scan/tokens.js";
import {
  createToken,
  createTokenInstance,
} from "../../../scan/tokens_public.js";
import { END_OF_FILE } from "../parser.js";
import { BITS_FOR_OCCURRENCE_IDX } from "../../grammar/keys.js";
import { ParserMethodInternal } from "../types.js";

type ProdWithDef = IProduction & { definition?: IProduction[] };
const RECORDING_NULL_OBJECT = {
  description: "This Object indicates the Parser is during Recording Phase",
};
Object.freeze(RECORDING_NULL_OBJECT);

const HANDLE_SEPARATOR = true;
// Hardcoded ceiling so validation stays correct regardless of BITS_FOR_OCCURRENCE_IDX.
// _dslCounter can reach values well above 2^BITS_FOR_OCCURRENCE_IDX (it encodes
// the flat sequence of all DSL calls in a rule body), so we cap at 127 (7-bit).
const MAX_METHOD_IDX = 127;

const RFT = createToken({ name: "RECORDING_PHASE_TOKEN", pattern: Lexer.NA });
augmentTokenTypes([RFT]);
const RECORDING_PHASE_TOKEN = createTokenInstance(
  RFT,
  "This IToken indicates the Parser is in Recording Phase\n\t" +
    "" +
    "See: https://chevrotain.io/docs/guide/internals.html#grammar-recording for details",
  // Using "-1" instead of NaN (as in EOF) because an actual number is less likely to
  // cause errors if the output of LA or CONSUME would be (incorrectly) used during the recording phase.
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

/**
 * This trait handles the creation of the GAST structure for Chevrotain Grammars
 */
export class GastRecorder {
  recordingProdStack: ProdWithDef[];
  RECORDING_PHASE: boolean;

  initGastRecorder(this: MixedInParser, config: IParserConfig): void {
    this.recordingProdStack = [];
    this.RECORDING_PHASE = false;
  }

  enableRecording(this: MixedInParser): void {
    this.RECORDING_PHASE = true;
  }

  disableRecording(this: MixedInParser) {
    this.RECORDING_PHASE = false;
  }

  //   Parser methods are called inside an ACTION?
  //   Maybe try/catch/finally on ACTIONS while disabling the recorders state changes?
  // @ts-expect-error -- noop place holder
  ACTION_RECORD<T>(this: MixedInParser, impl: () => T): T {
    // NO-OP during recording
  }

  // Executing backtracking logic will break our recording logic assumptions
  BACKTRACK_RECORD<T>(
    grammarRule: (...args: any[]) => T,
    args?: any[],
  ): () => boolean {
    return () => true;
  }

  // LA is part of the official API and may be used for custom lookahead logic
  // by end users who may forget to wrap it in ACTION or inside a GATE
  LA_RECORD(howMuch: number): IToken {
    // We cannot use the RECORD_PHASE_TOKEN here because someone may depend
    // On LA return EOF at the end of the input so an infinite loop may occur.
    return END_OF_FILE;
  }

  topLevelRuleRecord(this: MixedInParser, name: string, def: Function): Rule {
    try {
      const newTopLevelRule = new Rule({ definition: [], name: name });
      newTopLevelRule.name = name;
      this.recordingProdStack.push(newTopLevelRule);
      // Set up rule state so auto-occurrence counters work during recording.
      // We manage RULE_STACK_IDX directly instead of calling
      // ruleInvocationStateUpdate (which has CST side effects).
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
          // We may not be able to modify the original error object
          throw originalError;
        }
      }
      throw originalError;
    }
  }

  // Implementation of parsing DSL
  optionInternalRecord<OUT>(
    this: MixedInParser,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
    occurrence: number,
  ): OUT {
    return recordProd.call(this, Option, actionORMethodDef, occurrence);
  }

  atLeastOneInternalRecord<OUT>(
    this: MixedInParser,
    occurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
  ): void {
    recordProd.call(this, RepetitionMandatory, actionORMethodDef, occurrence);
  }

  atLeastOneSepFirstInternalRecord<OUT>(
    this: MixedInParser,
    occurrence: number,
    options: AtLeastOneSepMethodOpts<OUT>,
  ): void {
    recordProd.call(
      this,
      RepetitionMandatoryWithSeparator,
      options,
      occurrence,
      HANDLE_SEPARATOR,
    );
  }

  manyInternalRecord<OUT>(
    this: MixedInParser,
    occurrence: number,
    actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
  ): void {
    recordProd.call(this, Repetition, actionORMethodDef, occurrence);
  }

  manySepFirstInternalRecord<OUT>(
    this: MixedInParser,
    occurrence: number,
    options: ManySepMethodOpts<OUT>,
  ): void {
    recordProd.call(
      this,
      RepetitionWithSeparator,
      options,
      occurrence,
      HANDLE_SEPARATOR,
    );
  }

  orInternalRecord<T>(
    this: MixedInParser,
    altsOrOpts: IOrAlt<any>[] | OrMethodOpts<unknown>,
    occurrence: number,
  ): T {
    return recordOrProd.call(this, altsOrOpts, occurrence);
  }

  subruleInternalRecord<ARGS extends unknown[], R>(
    this: MixedInParser,
    ruleToCall: ParserMethodInternal<ARGS, R>,
    occurrence: number,
    options?: SubruleMethodOpts<ARGS>,
  ): R | CstNode {
    assertMethodIdxIsValid(occurrence);
    if (!ruleToCall || !Object.hasOwn(ruleToCall, "ruleName")) {
      const error: any = new Error(
        `<SUBRULE${getIdxSuffix(occurrence)}> argument is invalid` +
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
      // The resolving of the `referencedRule` property will be done once all the Rule's GASTs have been created
      referencedRule: undefined,
    });
    prevProd.definition.push(newNoneTerminal);

    return this.outputCst
      ? RECORDING_PHASE_CSTNODE
      : <any>RECORDING_NULL_OBJECT;
  }

  consumeInternalRecord(
    this: MixedInParser,
    tokType: TokenType,
    occurrence: number,
    options?: ConsumeMethodOpts,
  ): IToken {
    assertMethodIdxIsValid(occurrence);
    if (!hasShortKeyProperty(tokType)) {
      const error: any = new Error(
        `<CONSUME${getIdxSuffix(occurrence)}> argument is invalid` +
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
}

function recordProd(
  prodConstructor: any,
  mainProdArg: any,
  occurrence: number,
  handleSep: boolean = false,
): any {
  assertMethodIdxIsValid(occurrence);
  const prevProd: any = this.recordingProdStack.at(-1);
  const grammarAction =
    typeof mainProdArg === "function" ? mainProdArg : mainProdArg.DEF;

  const newProd = new prodConstructor({ definition: [], idx: occurrence });
  if (handleSep) {
    newProd.separator = mainProdArg.SEP;
  }
  if (Object.hasOwn(mainProdArg, "MAX_LOOKAHEAD")) {
    newProd.maxLookahead = mainProdArg.MAX_LOOKAHEAD;
  }

  this.recordingProdStack.push(newProd);
  grammarAction.call(this);
  prevProd.definition.push(newProd);
  this.recordingProdStack.pop();

  return RECORDING_NULL_OBJECT;
}

function recordOrProd(mainProdArg: any, occurrence: number): any {
  assertMethodIdxIsValid(occurrence);
  const prevProd: any = this.recordingProdStack.at(-1);
  // Only an array of alternatives
  const hasOptions = Array.isArray(mainProdArg) === false;
  const alts: IOrAlt<unknown>[] =
    hasOptions === false ? mainProdArg : mainProdArg.DEF;

  const newOrProd = new Alternation({
    definition: [],
    idx: occurrence,
    ignoreAmbiguities: hasOptions && mainProdArg.IGNORE_AMBIGUITIES === true,
  });
  if (Object.hasOwn(mainProdArg, "MAX_LOOKAHEAD")) {
    newOrProd.maxLookahead = mainProdArg.MAX_LOOKAHEAD;
  }

  const hasPredicates = alts.some(
    (currAlt: any) => typeof currAlt.GATE === "function",
  );
  newOrProd.hasPredicates = hasPredicates;

  prevProd.definition.push(newOrProd);

  // Save _dslCounter before iterating alternatives. During recording ALL
  // alts are walked sequentially, each getting unique counter ranges.
  // At runtime only ONE alt is chosen, so we record each alt's starting
  // offset and the total delta. At runtime, _dslCounter is set to the
  // chosen alt's starting offset before execution, and advanced to the
  // total delta afterwards.
  const savedDslCounter = this._dslCounter;
  const altStarts: number[] = [];

  alts.forEach((currAlt) => {
    // Record this alt's starting offset relative to savedDslCounter.
    altStarts.push(this._dslCounter - savedDslCounter);

    const currAltFlat = new Alternative({ definition: [] });
    newOrProd.definition.push(currAltFlat);
    if (Object.hasOwn(currAlt, "IGNORE_AMBIGUITIES")) {
      currAltFlat.ignoreAmbiguities = currAlt.IGNORE_AMBIGUITIES as boolean; // assumes end user provides the correct config value/type
    }
    // **implicit** ignoreAmbiguities due to usage of gate
    else if (Object.hasOwn(currAlt, "GATE")) {
      currAltFlat.ignoreAmbiguities = true;
    }
    this.recordingProdStack.push(currAltFlat);
    currAlt.ALT.call(this);
    this.recordingProdStack.pop();
  });

  // Total delta across all alternatives.
  const totalDelta = this._dslCounter - savedDslCounter;

  // Store per-alt starting offsets and total delta so orInternal can set
  // the counter to the correct offset before executing the chosen alt,
  // and advance past the OR afterwards.
  const mapKey = this.currRuleShortName | occurrence;
  this._orCounterDeltas[mapKey] = totalDelta;
  this._orAltCounterStarts[mapKey] = altStarts;

  return RECORDING_NULL_OBJECT;
}

function getIdxSuffix(_idx: number): string {
  // With auto-occurrence counting, the idx is an internal auto-assigned
  // value, not the user's explicit method suffix. Always return empty
  // so error messages show the base method name (CONSUME, SUBRULE, etc.).
  return "";
}

function assertMethodIdxIsValid(idx: number): void {
  if (idx < 0 || idx > MAX_METHOD_IDX) {
    const error: any = new Error(
      // The stack trace will contain all the needed details
      `Invalid DSL Method idx value: <${idx}>\n\t` +
        `Idx value must be a none negative value smaller than ${
          MAX_METHOD_IDX + 1
        }`,
    );
    error.KNOWN_RECORDER_ERROR = true;
    throw error;
  }
}
