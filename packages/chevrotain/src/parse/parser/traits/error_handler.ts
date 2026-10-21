import {
  IParserConfig,
  IParserErrorMessageProvider,
  IRecognitionException,
  LookaheadSequence,
} from "@chevrotain/types";
import {
  EarlyExitException,
  isRecognitionException,
  NoViableAltException,
} from "../../exceptions_public.js";
import {
  getLookaheadPathsForOptionalProd,
  getLookaheadPathsForOr,
  PROD_TYPE,
} from "../../grammar/lookahead.js";
import { MixedInParser } from "./parser_traits.js";
import { DEFAULT_PARSER_CONFIG } from "../parser.js";

/**
 * Trait responsible for runtime parsing errors.
 */
export class ErrorHandler {
  _errors: IRecognitionException[];
  errorMessageProvider: IParserErrorMessageProvider;
  // The expected lookahead paths depend only on the (immutable after self-analysis) grammar,
  // yet computing them can be very expensive for large alternations, so they are computed
  // at most once per production. Keyed by production type, occurrence and rule name.
  lookaheadPathsForErrorsCache: Map<string, LookaheadSequence[]>;

  initErrorHandler(config: IParserConfig) {
    this._errors = [];
    this.lookaheadPathsForErrorsCache = new Map();
    this.errorMessageProvider = Object.hasOwn(config, "errorMessageProvider")
      ? (config.errorMessageProvider as IParserErrorMessageProvider) // assumes end user provides the correct config value/type
      : DEFAULT_PARSER_CONFIG.errorMessageProvider;
  }

  SAVE_ERROR(
    this: MixedInParser,
    error: IRecognitionException,
  ): IRecognitionException {
    if (isRecognitionException(error)) {
      error.context = {
        ruleStack: this.getHumanReadableRuleStack(),
        ruleOccurrenceStack: this.RULE_OCCURRENCE_STACK.slice(
          0,
          this.RULE_OCCURRENCE_STACK_IDX + 1,
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

  getLookaheadPathsForError(
    this: MixedInParser,
    ruleName: string,
    occurrence: number,
    prodType: PROD_TYPE,
  ): LookaheadSequence[] {
    const cacheKey = `${prodType}_${occurrence}_${ruleName}`;
    let paths = this.lookaheadPathsForErrorsCache.get(cacheKey);
    if (paths === undefined) {
      const ruleGrammar = this.getGAstProductions()[ruleName];
      paths =
        prodType === PROD_TYPE.ALTERNATION
          ? getLookaheadPathsForOr(occurrence, ruleGrammar, this.maxLookahead)
          : getLookaheadPathsForOptionalProd(
              occurrence,
              ruleGrammar,
              prodType,
              this.maxLookahead,
            );
      this.lookaheadPathsForErrorsCache.set(cacheKey, paths);
    }
    return paths;
  }

  raiseEarlyExitException(
    this: MixedInParser,
    occurrence: number,
    prodType: PROD_TYPE,
    userDefinedErrMsg: string | undefined,
  ): never {
    const ruleName = this.getCurrRuleFullName();
    const lookAheadPathsPerAlternative = this.getLookaheadPathsForError(
      ruleName,
      occurrence,
      prodType,
    );
    const insideProdPaths = lookAheadPathsPerAlternative[0];
    const actualTokens = [];
    for (let i = 1; i <= this.maxLookahead; i++) {
      actualTokens.push(this.LA(i));
    }
    const msg = this.errorMessageProvider.buildEarlyExitMessage({
      expectedIterationPaths: insideProdPaths,
      actual: actualTokens,
      previous: this.LA(0),
      customUserDescription: userDefinedErrMsg,
      ruleName: ruleName,
    });

    throw this.SAVE_ERROR(new EarlyExitException(msg, this.LA(1), this.LA(0)));
  }

  raiseNoAltException(
    this: MixedInParser,
    occurrence: number,
    errMsgTypes: string | undefined,
  ): never {
    const ruleName = this.getCurrRuleFullName();
    const lookAheadPathsPerAlternative = this.getLookaheadPathsForError(
      ruleName,
      occurrence,
      PROD_TYPE.ALTERNATION,
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
      ruleName: ruleName,
    });

    throw this.SAVE_ERROR(
      new NoViableAltException(errMsg, this.LA(1), previousToken),
    );
  }
}
