import { createRegularToken } from "../../utils/matchers";
import { EmbeddedActionsParser } from "../../../src/parse/parser/traits/parser_traits";
import { createToken, EOF } from "../../../src/scan/tokens_public"
import { expect } from "chai";
import { EMPTY_ALT } from "../../../src/api";

describe('ATN Simulator', () => {
	describe("LL(*) lookahead", () => {

		const A = createToken({ name: "A", pattern: "a" })
		const B = createToken({ name: "B", pattern: "b" })
		const tokens = [A, B]
	
		class UnboundedLookaheadParser extends EmbeddedActionsParser {
			constructor() {
				super(tokens, {
          skipValidations: true
        })
				this.performSelfAnalysis()
			}
	
			LongRule = this.RULE("LongRule", () => {
				return this.OR([
          {
            ALT: () => {
              return 0
            }
          },
					{
						ALT: () => {
							this.AT_LEAST_ONE1(() => this.CONSUME1(A))
							return 1
						}
					},
					{
						ALT: () => {
							this.AT_LEAST_ONE2(() => this.CONSUME2(A))
							this.CONSUME(B)
							return 2
						}
					},
				])
			})

		}
	
		it("Should pick longest alternative instead of first #1", () => {
			const parser = new UnboundedLookaheadParser()
			parser.input = [createRegularToken(A), createRegularToken(A), createRegularToken(A)]
			const result = parser.LongRule()
			expect(result).to.be.equal(1)
		})
	
		it("Should pick longest alternative instead of first #2", () => {
			const parser = new UnboundedLookaheadParser()
			parser.input = [createRegularToken(A), createRegularToken(A), createRegularToken(B)]
			const result = parser.LongRule()
			expect(result).to.be.equal(2)
		})

    it("Should pick longest alternative instead of first #1", () => {
			const parser = new UnboundedLookaheadParser()
			parser.input = []
			const result = parser.LongRule()
			expect(result).to.be.equal(0)
		})
	
	})
	
	describe("ambiguity detection", () => {
	
		const A = createToken({ name: "A" })
		const B = createToken({ name: "B" })
		const tokens = [A, B]
	
		class AmbigiousParser extends EmbeddedActionsParser {
			constructor() {
				super(tokens)
				this.performSelfAnalysis()
			}
	
			AltRule = this.RULE("AltRule", () => {
				return this.OR([
					{
						ALT: () => {
							this.SUBRULE(this.RuleB)
							return 0
						}
					},
					{
						ALT: () => {
							this.SUBRULE(this.RuleC)
							return 1
						}
					},
				])
			})
	
			RuleB = this.RULE("RuleB", () => {
				this.MANY(() => this.CONSUME(A))
			})
	
			RuleC = this.RULE("RuleC", () => {
				this.MANY(() => this.CONSUME(A))
				this.OPTION(() => this.CONSUME(B))
			})
	
			AltRuleWithEOF = this.RULE("AltRuleWithEOF", () => {
				return this.OR([
					{
						ALT: () => {
							this.SUBRULE1(this.RuleEOF)
							return 0
						}
					},
					{
						ALT: () => {
							this.SUBRULE2(this.RuleEOF)
							return 1
						}
					},
				])
			})
	
			RuleEOF = this.RULE("RuleEOF", () => {
				this.MANY1(() => this.CONSUME(A))
				this.CONSUME(EOF)
			})
		}
	
		it("Should pick first alternative on ambiguity", () => {
			const parser = new AmbigiousParser();
			parser.input = [createRegularToken(A), createRegularToken(A), createRegularToken(A)]
			const result = parser.AltRule()
			expect(result).to.be.equal(0)
		})
	
		it("Should pick first alternative on EOF ambiguity", () => {
			const parser = new AmbigiousParser()
			parser.input = []
			const result = parser.AltRuleWithEOF()
			expect(result).to.be.equal(0)
		})
	
		it("Should pick correct alternative on long prefix", () => {
			const parser = new AmbigiousParser()
			parser.input = [createRegularToken(A), createRegularToken(A), createRegularToken(B)]
			const result = parser.AltRule()
			expect(result).to.be.equal(1)
		})
	
	})
})

