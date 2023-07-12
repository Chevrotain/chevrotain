import { GastRefResolverVisitor } from "../../../src/parse/grammar/resolver.js";
import { ParserDefinitionErrorType } from "../../../src/parse/parser/parser.js";
import { NonTerminal, Rule } from "@chevrotain/gast";
import { defaultGrammarResolverErrorProvider } from "../../../src/parse/errors_public.js";
import { expect } from "chai";

describe("The RefResolverVisitor", () => {
  it("will fail when trying to resolve a ref to a grammar rule that does not exist", () => {
    const ref = new NonTerminal({ nonTerminalName: "missingRule" });
    const topLevel = new Rule({ name: "TOP", definition: [ref] });
    const topLevelRules: { [ruleName: string]: Rule } = {};
    topLevelRules["TOP"] = topLevel;
    const resolver = new GastRefResolverVisitor(
      topLevelRules,
      defaultGrammarResolverErrorProvider,
    );
    resolver.resolveRefs();
    expect(resolver.errors).to.have.lengthOf(1);
    expect(resolver.errors[0].message).to.contain(
      "Invalid grammar, reference to a rule which is not defined: ->missingRule<-",
    );
    expect(resolver.errors[0].message).to.contain(
      "inside top level rule: ->TOP<-",
    );
    expect(resolver.errors[0].type).to.equal(
      ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF,
    );
    expect(resolver.errors[0].ruleName).to.equal("TOP");
  });
});
