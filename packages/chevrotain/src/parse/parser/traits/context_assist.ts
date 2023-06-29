import {
  ISyntacticContentAssistPath,
  IToken,
  ITokenGrammarPath,
  TokenType
} from "@chevrotain/types"
import {
  NextAfterTokenWalker,
  nextPossibleTokensAfter
} from "../../grammar/interpreter"
import { MixedInParser } from "./parser_traits"

export class ContentAssist {
  initContentAssist() {}

  public computeContentAssist(
    this: MixedInParser,
    startRuleName: string,
    precedingInput: IToken[]
  ): ISyntacticContentAssistPath[] {
    const startRuleGast = this.gastProductionsCache[startRuleName]

    if (startRuleGast === undefined) {
      throw Error(`Rule ->${startRuleName}<- does not exist in this grammar.`)
    }

    return nextPossibleTokensAfter(
      [startRuleGast],
      precedingInput,
      this.tokenMatcher,
      this.maxLookahead
    )
  }

  // TODO: should this be a member method or a utility? it does not have any state or usage of 'this'...
  // TODO: should this be more explicitly part of the public API?
  public getNextPossibleTokenTypes(
    this: MixedInParser,
    grammarPath: ITokenGrammarPath
  ): TokenType[] {
    const topRuleName = grammarPath.ruleStack[0]
    const gastProductions = this.getGAstProductions()
    const topProduction = gastProductions[topRuleName]
    const nextPossibleTokenTypes = new NextAfterTokenWalker(
      topProduction,
      grammarPath
    ).startWalking()
    return nextPossibleTokenTypes
  }
}
