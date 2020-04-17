import {
  IParserConfig,
  IParserErrorMessageProvider,
  IRecognitionException
} from "../../../../api"
import {
  EarlyExitException,
  isRecognitionException,
  NoViableAltException
} from "../../exceptions_public"
import { cloneArr, has } from "../../../utils/utils"
import {
  getLookaheadPathsForOptionalProd,
  getLookaheadPathsForOr,
  PROD_TYPE
} from "../../grammar/lookahead"
import { MixedInParser } from "./parser_traits"
import { DEFAULT_PARSER_CONFIG } from "../parser"

/**
 * Trait responsible for runtime parsing errors.
 */
export class ErrorHandler {
  _errors: IRecognitionException[]
  errorMessageProvider: IParserErrorMessageProvider

  initErrorHandler(config: IParserConfig) {
    this._errors = []
    this.errorMessageProvider = has(config, "errorMessageProvider")
      ? config.errorMessageProvider
      : DEFAULT_PARSER_CONFIG.errorMessageProvider
  }

  SAVE_ERROR(
    this: MixedInParser,
    error: IRecognitionException
  ): IRecognitionException {
    if (isRecognitionException(error)) {
      error.context = {
        ruleStack: this.getHumanReadableRuleStack(),
        ruleOccurrenceStack: cloneArr(this.RULE_OCCURRENCE_STACK)
      }
      this._errors.push(error)
      return error
    } else {
      throw Error("Trying to save an Error which is not a RecognitionException")
    }
  }

  get errors(): IRecognitionException[] {
    return cloneArr(this._errors)
  }

  set errors(newErrors: IRecognitionException[]) {
    this._errors = newErrors
  }

  // TODO: consider caching the error message computed information
  raiseEarlyExitException(
    this: MixedInParser,
    occurrence: number,
    prodType: PROD_TYPE,
    userDefinedErrMsg: string
  ): void {
    let ruleName = this.getCurrRuleFullName()
    let ruleGrammar = this.getGAstProductions()[ruleName]
    let lookAheadPathsPerAlternative = getLookaheadPathsForOptionalProd(
      occurrence,
      ruleGrammar,
      prodType,
      this.maxLookahead
    )
    let insideProdPaths = lookAheadPathsPerAlternative[0]
    let actualTokens = []
    for (let i = 1; i <= this.maxLookahead; i++) {
      actualTokens.push(this.LA(i))
    }
    let msg = this.errorMessageProvider.buildEarlyExitMessage({
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
    occurrence: number,
    errMsgTypes: string
  ): void {
    let ruleName = this.getCurrRuleFullName()
    let ruleGrammar = this.getGAstProductions()[ruleName]
    // TODO: getLookaheadPathsForOr can be slow for large enough maxLookahead and certain grammars, consider caching ?
    let lookAheadPathsPerAlternative = getLookaheadPathsForOr(
      occurrence,
      ruleGrammar,
      this.maxLookahead
    )

    let actualTokens = []
    for (let i = 1; i <= this.maxLookahead; i++) {
      actualTokens.push(this.LA(i))
    }
    let previousToken = this.LA(0)

    let errMsg = this.errorMessageProvider.buildNoViableAltMessage({
      expectedPathsPerAlt: lookAheadPathsPerAlternative,
      actual: actualTokens,
      previous: previousToken,
      customUserDescription: errMsgTypes,
      ruleName: this.getCurrRuleFullName()
    })

    throw this.SAVE_ERROR(
      new NoViableAltException(errMsg, this.LA(1), previousToken)
    )
  }
}
