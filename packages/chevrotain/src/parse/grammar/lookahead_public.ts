import {
  ILookaheadStrategy,
  ILookaheadValidationError,
  IOrAlt,
  LookaheadSequence,
  LookaheadProductionType,
  Rule,
  TokenType,
  OptionalProductionType
} from "@chevrotain/types"
import flatMap from "lodash/flatMap"
import isEmpty from "lodash/isEmpty"
import { defaultGrammarValidatorErrorProvider } from "../errors_public"
import {
  validateAmbiguousAlternationAlternatives,
  validateEmptyOrAlternative,
  validateNoLeftRecursion,
  validateSomeNonEmptyLookaheadPath
} from "./checks"
import {
  buildAlternativesLookAheadFunc,
  buildLookaheadFuncForOptionalProd,
  buildLookaheadFuncForOr,
  buildSingleAlternativeLookaheadFunction,
  getLookaheadPathsForOptionalProd,
  getLookaheadPathsForOr,
  getProdType,
  PROD_TYPE
} from "./lookahead"
import { IParserDefinitionError } from "./types"

export function getLookaheadPaths(options: {
  occurrence: number
  rule: Rule
  prodType: LookaheadProductionType
  maxLookahead: number
}): LookaheadSequence[] {
  const { occurrence, rule, prodType, maxLookahead } = options
  const type = getProdType(prodType)
  if (type === PROD_TYPE.ALTERNATION) {
    return getLookaheadPathsForOr(occurrence, rule, maxLookahead)
  } else {
    return getLookaheadPathsForOptionalProd(
      occurrence,
      rule,
      type,
      maxLookahead
    )
  }
}

export class LLkLookaheadStrategy implements ILookaheadStrategy {
  validate(options: {
    rules: Rule[]
    maxLookahead: number
    tokenTypes: TokenType[]
    grammarName: string
  }): ILookaheadValidationError[] {
    const leftRecursionErrors = this.validateNoLeftRecursion(options.rules)

    let emptyAltErrors: IParserDefinitionError[] = []
    let ambiguousAltsErrors: IParserDefinitionError[] = []
    let emptyRepetitionErrors: IParserDefinitionError[] = []

    if (isEmpty(leftRecursionErrors)) {
      emptyAltErrors = this.validateEmptyOrAlternatives(options.rules)
      ambiguousAltsErrors = this.validateAmbiguousAlternationAlternatives(
        options.rules,
        options.maxLookahead
      )
      emptyRepetitionErrors = this.validateSomeNonEmptyLookaheadPath(
        options.rules,
        options.maxLookahead
      )
    }

    return leftRecursionErrors.concat(
      emptyAltErrors,
      ambiguousAltsErrors,
      emptyRepetitionErrors
    )
  }

  validateNoLeftRecursion(rules: Rule[]): IParserDefinitionError[] {
    return flatMap(rules, (currTopRule) =>
      validateNoLeftRecursion(
        currTopRule,
        currTopRule,
        defaultGrammarValidatorErrorProvider
      )
    )
  }

  validateEmptyOrAlternatives(rules: Rule[]): IParserDefinitionError[] {
    return flatMap(rules, (currTopRule) =>
      validateEmptyOrAlternative(
        currTopRule,
        defaultGrammarValidatorErrorProvider
      )
    )
  }

  validateAmbiguousAlternationAlternatives(
    rules: Rule[],
    maxLookahead: number
  ): IParserDefinitionError[] {
    return flatMap(rules, (currTopRule) =>
      validateAmbiguousAlternationAlternatives(
        currTopRule,
        maxLookahead,
        defaultGrammarValidatorErrorProvider
      )
    )
  }

  validateSomeNonEmptyLookaheadPath(
    rules: Rule[],
    maxLookahead: number
  ): IParserDefinitionError[] {
    return validateSomeNonEmptyLookaheadPath(
      rules,
      maxLookahead,
      defaultGrammarValidatorErrorProvider
    )
  }

  buildLookaheadForAlternation(options: {
    prodOccurrence: number
    rule: Rule
    maxLookahead: number
    hasPredicates: boolean
    dynamicTokensEnabled: boolean
  }): (orAlts?: IOrAlt<any>[] | undefined) => number | undefined {
    return buildLookaheadFuncForOr(
      options.prodOccurrence,
      options.rule,
      options.maxLookahead,
      options.hasPredicates,
      options.dynamicTokensEnabled,
      buildAlternativesLookAheadFunc
    )
  }

  buildLookaheadForOptional(options: {
    prodOccurrence: number
    prodType: OptionalProductionType
    rule: Rule
    maxLookahead: number
    dynamicTokensEnabled: boolean
  }): () => boolean {
    return buildLookaheadFuncForOptionalProd(
      options.prodOccurrence,
      options.rule,
      options.maxLookahead,
      options.dynamicTokensEnabled,
      getProdType(options.prodType),
      buildSingleAlternativeLookaheadFunction
    )
  }
}
