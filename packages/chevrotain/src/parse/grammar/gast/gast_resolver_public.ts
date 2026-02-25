import { Rule } from "@chevrotain/gast";
import { resolveGrammar as orgResolveGrammar } from "../resolver.js";
import { validateGrammar as orgValidateGrammar } from "../checks.js";
import {
  defaultGrammarResolverErrorProvider,
  defaultGrammarValidatorErrorProvider,
} from "../../errors_public.js";
import { TokenType } from "@chevrotain/types";
import {
  IGrammarResolverErrorMessageProvider,
  IGrammarValidatorErrorMessageProvider,
  IParserDefinitionError,
} from "../types.js";

type ResolveGrammarOpts = {
  rules: Rule[];
  errMsgProvider?: IGrammarResolverErrorMessageProvider;
};
export function resolveGrammar(
  options: ResolveGrammarOpts,
): IParserDefinitionError[] {
  const actualOptions: Required<ResolveGrammarOpts> = {
    errMsgProvider: defaultGrammarResolverErrorProvider,
    ...options,
  };

  const topRulesTable: { [ruleName: string]: Rule } = {};
  options.rules.forEach((rule) => {
    topRulesTable[rule.name] = rule;
  });
  return orgResolveGrammar(topRulesTable, actualOptions.errMsgProvider);
}

export function validateGrammar(options: {
  rules: Rule[];
  tokenTypes: TokenType[];
  grammarName: string;
  errMsgProvider?: IGrammarValidatorErrorMessageProvider;
}): IParserDefinitionError[] {
  const errMsgProvider =
    options.errMsgProvider ?? defaultGrammarValidatorErrorProvider;

  return orgValidateGrammar(
    options.rules,
    options.tokenTypes,
    errMsgProvider,
    options.grammarName,
  );
}
