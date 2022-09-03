import { expect } from "chai"
import { ITokenConfig, TokenType } from "@chevrotain/types"
import {
  getProductionDslName,
  Alternation,
  NonTerminal,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  Terminal,
  Option,
  RepetitionWithSeparator,
  Repetition,
  serializeProduction,
  Alternative,
  Rule,
  serializeGrammar
} from "../src/api.js"

function createDummyToken(opts: ITokenConfig): TokenType {
  return {
    name: opts.name,
    PATTERN: opts.pattern
  }
}

describe("the gast model", () => {
  describe("the ProdRef class", () => {
    it("will always return a valid empty definition, even if it's ref is unresolved", () => {
      const prodRef = new NonTerminal({
        nonTerminalName: "SomeGrammarRuleName"
      })
      expect(prodRef.definition).to.be.an.instanceof(Array)
    })

    it("cannot be used to re-set the referenced Rule's definition", () => {
      const myRule = new Rule({ name: "myRule", definition: [] })
      const prodRef = new NonTerminal({
        nonTerminalName: "myRule",
        referencedRule: myRule
      })
      expect(prodRef.definition).to.be.be.empty
      prodRef.definition = [new Alternation({ definition: [] })]
      expect(prodRef.definition).to.be.be.empty
    })
  })

  describe("the mappings between a GAst instance and its matching DSL method name for: ", () => {
    class Comma {
      static PATTERN = /NA/
    }

    it("Terminal", () => {
      const gastInstance = new Terminal({ terminalType: Comma })
      expect(getProductionDslName(gastInstance)).to.equal("CONSUME")
    })

    it("NonTerminal", () => {
      const gastInstance = new NonTerminal({
        nonTerminalName: "bamba"
      })
      expect(getProductionDslName(gastInstance)).to.equal("SUBRULE")
    })

    it("Option", () => {
      const gastInstance = new Option({ definition: [] })
      expect(getProductionDslName(gastInstance)).to.equal("OPTION")
    })

    it("Alternation", () => {
      const gastInstance = new Alternation({ definition: [] })
      expect(getProductionDslName(gastInstance)).to.equal("OR")
    })

    it("RepetitionMandatory", () => {
      const gastInstance = new RepetitionMandatory({ definition: [] })
      expect(getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE")
    })

    it("RepetitionMandatoryWithSeparator", () => {
      const gastInstance = new RepetitionMandatoryWithSeparator({
        definition: [],
        separator: Comma
      })
      expect(getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE_SEP")
    })

    it("RepetitionWithSeparator", () => {
      const gastInstance = new RepetitionWithSeparator({
        definition: [],
        separator: Comma
      })
      expect(getProductionDslName(gastInstance)).to.equal("MANY_SEP")
    })

    it("Repetition", () => {
      const gastInstance = new Repetition({ definition: [] })
      expect(getProductionDslName(gastInstance)).to.equal("MANY")
    })
  })

  describe("the GAst serialization capabilities", () => {
    let A: TokenType
    let B: TokenType
    let C: TokenType
    let D: TokenType
    let Comma: TokenType
    let WithLiteral: TokenType

    before(() => {
      A = createDummyToken({ name: "A" })
      A.LABEL = "bamba"
      B = createDummyToken({ name: "B", pattern: /[a-zA-Z]\w*/ })
      C = createDummyToken({ name: "C" })
      D = createDummyToken({ name: "D" })
      Comma = createDummyToken({ name: "Comma" })
      WithLiteral = createDummyToken({
        name: "WithLiteral",
        pattern: "bamba"
      })
    })

    it("can serialize a NonTerminal", () => {
      const input = new NonTerminal({
        nonTerminalName: "qualifiedName"
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "NonTerminal",
        name: "qualifiedName",
        idx: 1
      })
    })

    it("can serialize a Alternative", () => {
      const input = new Alternative({
        definition: [
          new Terminal({ terminalType: WithLiteral }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Alternative",
        definition: [
          {
            type: "Terminal",
            name: "WithLiteral",
            pattern: "bamba",
            label: "WithLiteral",
            idx: 1
          },
          {
            type: "NonTerminal",
            name: "bamba",
            idx: 1
          }
        ]
      })
    })

    it("can serialize a Option", () => {
      const input = new Option({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Option",
        idx: 1,
        definition: [
          {
            type: "Terminal",
            name: "C",
            label: "C",
            idx: 1
          },
          {
            type: "NonTerminal",
            name: "bamba",
            idx: 1
          }
        ]
      })
    })

    it("can serialize a RepetitionMandatory", () => {
      const input = new RepetitionMandatory({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "RepetitionMandatory",
        idx: 1,
        definition: [
          {
            type: "Terminal",
            name: "C",
            label: "C",
            idx: 1
          },
          {
            type: "NonTerminal",
            name: "bamba",
            idx: 1
          }
        ]
      })
    })

    it("can serialize a RepetitionMandatoryWithSeparator", () => {
      const input = new RepetitionMandatoryWithSeparator({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ],
        separator: Comma
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "RepetitionMandatoryWithSeparator",
        idx: 1,
        separator: {
          type: "Terminal",
          name: "Comma",
          label: "Comma",
          idx: 1
        },
        definition: [
          {
            type: "Terminal",
            name: "C",
            label: "C",
            idx: 1
          },
          {
            type: "NonTerminal",
            name: "bamba",
            idx: 1
          }
        ]
      })
    })

    it("can serialize a Repetition", () => {
      const input = new Repetition({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Repetition",
        idx: 1,
        definition: [
          {
            type: "Terminal",
            name: "C",
            label: "C",
            idx: 1
          },
          {
            type: "NonTerminal",
            name: "bamba",
            idx: 1
          }
        ]
      })
    })

    it("can serialize a RepetitionWithSeparator", () => {
      const input = new RepetitionWithSeparator({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ],
        separator: Comma
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "RepetitionWithSeparator",
        idx: 1,
        separator: {
          type: "Terminal",
          name: "Comma",
          label: "Comma",
          idx: 1
        },
        definition: [
          {
            type: "Terminal",
            name: "C",
            label: "C",
            idx: 1
          },
          {
            type: "NonTerminal",
            name: "bamba",
            idx: 1
          }
        ]
      })
    })

    it("can serialize a Alternation", () => {
      const input = new Alternation({
        definition: [
          new Alternative({
            definition: [new Terminal({ terminalType: A })]
          }),
          new Alternative({
            definition: [new Terminal({ terminalType: B })]
          }),
          new Alternative({
            definition: [new Terminal({ terminalType: C })]
          })
        ]
      })

      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Alternation",
        idx: 1,
        definition: [
          {
            type: "Alternative",
            definition: [
              {
                type: "Terminal",
                name: "A",
                label: "bamba",
                idx: 1
              }
            ]
          },
          {
            type: "Alternative",
            definition: [
              {
                type: "Terminal",
                name: "B",
                label: "B",
                pattern: "[a-zA-Z]\\w*",
                idx: 1
              }
            ]
          },
          {
            type: "Alternative",
            definition: [
              {
                type: "Terminal",
                name: "C",
                label: "C",
                idx: 1
              }
            ]
          }
        ]
      })
    })

    it("can serialize a Terminal with a custom label", () => {
      const input = new Terminal({ terminalType: C, label: "someLabel" })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Terminal",
        name: "C",
        terminalLabel: "someLabel",
        label: "C",
        idx: 1
      })
    })

    it("can serialize a Terminal with a custom token label", () => {
      const input = new Terminal({ terminalType: A })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Terminal",
        name: "A",
        label: "bamba",
        idx: 1
      })
    })

    it("can serialize a Terminal with a pattern", () => {
      const input = new Terminal({ terminalType: B })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Terminal",
        name: "B",
        label: "B",
        pattern: "[a-zA-Z]\\w*",
        idx: 1
      })
    })

    it("can serialize a NonTerminal with a label", () => {
      const input = new NonTerminal({
        nonTerminalName: "qualifiedName",
        label: "someLabel"
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "NonTerminal",
        name: "qualifiedName",
        label: "someLabel",
        idx: 1
      })
    })

    it("can serialize a Rule", () => {
      const input = new Rule({
        name: "myRule",
        orgText: "",
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      const actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Rule",
        name: "myRule",
        orgText: "",
        definition: [
          {
            type: "Terminal",
            name: "C",
            label: "C",
            idx: 1
          },
          {
            type: "NonTerminal",
            name: "bamba",
            idx: 1
          }
        ]
      })
    })

    it("can serialize an array of Rules", () => {
      const input = [
        new Rule({
          name: "myRule",
          orgText: "",
          definition: [
            new Terminal({ terminalType: C }),
            new NonTerminal({ nonTerminalName: "bamba" })
          ]
        }),
        new Rule({
          name: "myRule2",
          orgText: "",
          definition: [
            new Terminal({ terminalType: D }),
            new NonTerminal({ nonTerminalName: "bisli" })
          ]
        })
      ]
      const actual = serializeGrammar(input)
      expect(actual).to.deep.equal([
        {
          type: "Rule",
          name: "myRule",
          orgText: "",
          definition: [
            {
              type: "Terminal",
              name: "C",
              label: "C",
              idx: 1
            },
            {
              type: "NonTerminal",
              name: "bamba",
              idx: 1
            }
          ]
        },
        {
          type: "Rule",
          orgText: "",
          name: "myRule2",
          definition: [
            {
              type: "Terminal",
              name: "D",
              label: "D",
              idx: 1
            },
            {
              type: "NonTerminal",
              name: "bisli",
              idx: 1
            }
          ]
        }
      ])
    })
  })
})
