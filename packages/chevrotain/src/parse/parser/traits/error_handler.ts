import {
  IParserConfig,
  IParserErrorMessageProvider,
  IRecognitionException
} from "@chevrotain/types"
import {
  EarlyExitException,
  isRecognitionException,
  NoViableAltException
} from "../../exceptions_public"
import has from "lodash/has"
import clone from "lodash/clone"
import {
  getLookaheadPathsForOptionalProd,
  getLookaheadPathsForOr,
  PROD_TYPE
} from "../../grammar/lookahead"
import { MixedInParser } from "./parser_traits"
import { DEFAULT_PARSER_CONFIG } from "../parser"
import { AdaptivePredictError } from "./atn_simulator"

/**
 * Trait responsible for runtime parsing errors.
 */
export class ErrorHandler {
  _errors: IRecognitionException[]
  errorMessageProvider: IParserErrorMessageProvider

  initErrorHandler(config: IParserConfig) {
    this._errors = []
    this.errorMessageProvider = has(config, "errorMessageProvider")
      ? (config.errorMessageProvider as IParserErrorMessageProvider) // assumes end user provides the correct config value/type
      : DEFAULT_PARSER_CONFIG.errorMessageProvider
  }

  SAVE_ERROR(
    this: MixedInParser,
    error: IRecognitionException
  ): IRecognitionException {
    if (isRecognitionException(error)) {
      error.context = {
        ruleStack: this.getHumanReadableRuleStack(),
        ruleOccurrenceStack: clone(this.RULE_OCCURRENCE_STACK)
      }
      this._errors.push(error)
      return error
    } else {
      throw Error("Trying to save an Error which is not a RecognitionException")
    }
  }

  get errors(): IRecognitionException[] {
    return clone(this._errors)
  }

  set errors(newErrors: IRecognitionException[]) {
    this._errors = newErrors
  }

  // TODO: consider caching the error message computed information
  raiseEarlyExitException(
    this: MixedInParser,
    occurrence: number,
    prodType: PROD_TYPE,
    userDefinedErrMsg: string | undefined
  ): never {
    const ruleName = this.getCurrRuleFullName()
    const ruleGrammar = this.getGAstProductions()[ruleName]
    const lookAheadPathsPerAlternative = getLookaheadPathsForOptionalProd(
      occurrence,
      ruleGrammar,
      prodType,
      this.maxLookahead
    )
    const insideProdPaths = lookAheadPathsPerAlternative[0]
    const actualTokens = []
    for (let i = 1; i <= this.maxLookahead; i++) {
      actualTokens.push(this.LA(i))
    }
    const msg = this.errorMessageProvider.buildEarlyExitMessage({
      expectedIterationPaths: insideProdPaths,
      actual: actualTokens,
      previous: this.LA(0),
      customUserDescription: userDefinedErrMsg,
      ruleName: ruleName
    })

    throw this.SAVE_ERROR(new EarlyExitException(msg, this.LA(1), this.LA(0)))
  }

  // TODO: consider caching the error message computed information
  raiseNoAltException(
    this: MixedInParser,
    adaptivePredictError: AdaptivePredictError,
    errMsgTypes: string | undefined
  ): never {
    const previousToken = this.LA(adaptivePredictError.tokenPath.length)

    const errMsg = this.errorMessageProvider.buildNoViableAltMessage({
      expectedNextTokens: adaptivePredictError.possibleTokenTypes,
      actual: adaptivePredictError.actualToken,
      previous: previousToken,
      customUserDescription: errMsgTypes,
      ruleName: this.getCurrRuleFullName()
    })

    throw this.SAVE_ERROR(
      new NoViableAltException(errMsg, this.LA(1), previousToken)
    )
  }
}
