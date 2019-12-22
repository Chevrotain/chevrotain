import { GastRefResolverVisitor } from "../../../src/parse/grammar/resolver"
import { ParserDefinitionErrorType } from "../../../src/parse/parser/parser"
import {
  Alternation,
  Flat,
  NonTerminal,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule,
  Terminal
} from "../../../src/parse/grammar/gast/gast_public"
import { defaultGrammarResolverErrorProvider } from "../../../src/parse/errors_public"
import { assignOccurrenceIndices } from "../../../src/parse/grammar/gast/gast_resolver_public"
import { createToken } from "../../../src/scan/tokens_public"
import { DslMethodsCollectorVisitor } from "../../../src/parse/grammar/gast/gast"
import { forEach, map, uniq } from "../../../src/utils/utils"

describe("The RefResolverVisitor", () => {
  it("will fail when trying to resolve a ref to a grammar rule that does not exist", () => {
    let ref = new NonTerminal({ nonTerminalName: "missingRule" })
    let topLevel = new Rule({ name: "TOP", definition: [ref] })
    let topLevelRules = {}
    topLevelRules["TOP"] = topLevel
    let resolver = new GastRefResolverVisitor(
      topLevelRules,
      defaultGrammarResolverErrorProvider
    )
    resolver.resolveRefs()
    expect(resolver.errors).to.have.lengthOf(1)
    expect(resolver.errors[0].message).to.contain(
      "Invalid grammar, reference to a rule which is not defined: ->missingRule<-"
    )
    expect(resolver.errors[0].message).to.contain(
      "inside top level rule: ->TOP<-"
    )
    expect(resolver.errors[0].type).to.equal(
      ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF
    )
    expect(resolver.errors[0].ruleName).to.equal("TOP")
  })
})

describe("The assignOccurrenceIndices utility", () => {
  it("will correctly add indices for DSL methods", () => {
    const A = createToken({ name: "A" })
    const B = createToken({ name: "B" })

    const rule = new Rule({
      name: "rule",
      definition: [
        new Terminal({ terminalType: A }),
        new NonTerminal({
          nonTerminalName: "otherRule"
        }),
        new Option({
          definition: [new Terminal({ terminalType: B })]
        }),
        new Alternation({
          definition: [
            new Flat({
              definition: [new Terminal({ terminalType: B })]
            })
          ]
        }),
        new Repetition({
          definition: [new Terminal({ terminalType: B })]
        }),
        new RepetitionMandatory({
          definition: [new Terminal({ terminalType: B })]
        }),
        new RepetitionWithSeparator({
          definition: [new Terminal({ terminalType: B })],
          separator: A
        }),
        new RepetitionMandatoryWithSeparator({
          definition: [
            new NonTerminal({
              nonTerminalName: "otherRule"
            })
          ],
          separator: A
        }),
        new Option({
          definition: [new Terminal({ terminalType: B })]
        }),
        new Alternation({
          definition: [
            new Flat({
              definition: [new Terminal({ terminalType: B })]
            })
          ]
        }),
        new Repetition({
          definition: [new Terminal({ terminalType: B })]
        }),
        new RepetitionMandatory({
          definition: [new Terminal({ terminalType: B })]
        }),
        new RepetitionWithSeparator({
          definition: [new Terminal({ terminalType: B })],
          separator: A
        }),
        new RepetitionMandatoryWithSeparator({
          definition: [
            new NonTerminal({
              nonTerminalName: "otherRule"
            })
          ],
          separator: A
        })
      ]
    })

    assignOccurrenceIndices({ rules: [rule] })
    const methodsCollector = new DslMethodsCollectorVisitor()
    rule.accept(methodsCollector)

    forEach(methodsCollector.dslMethods, currMethodArr => {
      const indices = map(currMethodArr, currMethod => currMethod.idx)
      expect(indices.length).to.equal(uniq(indices).length)
    })
  })
})
