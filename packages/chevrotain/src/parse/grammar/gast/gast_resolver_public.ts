import { Rule } from "@chevrotain/gast"
import { forEach } from "remeda/dist/commonjs/forEach"
import { merge } from "remeda/dist/commonjs/merge"
import { resolveGrammar as orgResolveGrammar } from "../resolver"
import { validateGrammar as orgValidateGrammar } from "../checks"
import {
  defaultGrammarResolverErrorProvider,
  defaultGrammarValidatorErrorProvider
} from "../../errors_public"
import { TokenType } from "@chevrotain/types"
import {
  IGrammarResolverErrorMessageProvider,
  IGrammarValidatorErrorMessageProvider,
  IParserDefinitionError
} from "../types"

type ResolveGrammarOpts = {
  rules: Rule[]
  errMsgProvider?: IGrammarResolverErrorMessageProvider
}
export function resolveGrammar(
  options: ResolveGrammarOpts
): IParserDefinitionError[] {
  const actualOptions: Required<ResolveGrammarOpts> = merge(
    {
      errMsgProvider: defaultGrammarResolverErrorProvider
    },
    options
  )

  const topRulesTable: { [ruleName: string]: Rule } = {}
  forEach(options.rules, (rule) => {
    topRulesTable[rule.name] = rule
  })
  return orgResolveGrammar(topRulesTable, actualOptions.errMsgProvider)
}

export function validateGrammar(options: {
  rules: Rule[]
  tokenTypes: TokenType[]
  grammarName: string
  errMsgProvider: IGrammarValidatorErrorMessageProvider
}): IParserDefinitionError[] {
  const actualOptions = merge(
    {
      errMsgProvider: defaultGrammarValidatorErrorProvider
    },
    options
  )

  return orgValidateGrammar(
    actualOptions.rules,
    actualOptions.tokenTypes,
    actualOptions.errMsgProvider,
    actualOptions.grammarName
  )
}
