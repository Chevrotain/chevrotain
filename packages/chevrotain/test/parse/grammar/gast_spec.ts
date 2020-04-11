import { getProductionDslName } from "../../../src/parse/grammar/gast/gast"
import { createToken } from "../../../src/scan/tokens_public"
import {
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
} from "../../../src/parse/grammar/gast/gast_public"

describe("GAst namespace", () => {
  describe("the ProdRef class", () => {
    it("will always return a valid empty definition, even if it's ref is unresolved", () => {
      let prodRef = new NonTerminal({
        nonTerminalName: "SomeGrammarRuleName"
      })
      expect(prodRef.definition).to.be.an.instanceof(Array)
    })
  })

  describe("the mappings between a GAst instance and its matching DSL method name for: ", () => {
    class Comma {
      static PATTERN = /NA/
    }

    it("Terminal", () => {
      let gastInstance = new Terminal({ terminalType: Comma })
      expect(getProductionDslName(gastInstance)).to.equal("CONSUME")
    })

    it("NonTerminal", () => {
      let gastInstance = new NonTerminal({
        nonTerminalName: "bamba"
      })
      expect(getProductionDslName(gastInstance)).to.equal("SUBRULE")
    })

    it("Option", () => {
      let gastInstance = new Option({ definition: [] })
      expect(getProductionDslName(gastInstance)).to.equal("OPTION")
    })

    it("Alternation", () => {
      let gastInstance = new Alternation({ definition: [] })
      expect(getProductionDslName(gastInstance)).to.equal("OR")
    })

    it("RepetitionMandatory", () => {
      let gastInstance = new RepetitionMandatory({ definition: [] })
      expect(getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE")
    })

    it("RepetitionMandatoryWithSeparator", () => {
      let gastInstance = new RepetitionMandatoryWithSeparator({
        definition: [],
        separator: Comma
      })
      expect(getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE_SEP")
    })

    it("RepetitionWithSeparator", () => {
      let gastInstance = new RepetitionWithSeparator({
        definition: [],
        separator: Comma
      })
      expect(getProductionDslName(gastInstance)).to.equal("MANY_SEP")
    })

    it("Repetition", () => {
      let gastInstance = new Repetition({ definition: [] })
      expect(getProductionDslName(gastInstance)).to.equal("MANY")
    })
  })

  describe("the GAst serialization capabilities", () => {
    let A = createToken({ name: "A" })
    A.LABEL = "bamba"
    let B = createToken({ name: "B", pattern: /[a-zA-Z]\w*/ })
    let C = createToken({ name: "C" })
    let D = createToken({ name: "D" })
    let Comma = createToken({ name: "Comma" })
    let WithLiteral = createToken({
      name: "WithLiteral",
      pattern: "bamba"
    })

    it("can serialize a NonTerminal", () => {
      let input = new NonTerminal({
        nonTerminalName: "qualifiedName"
      })
      let actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "NonTerminal",
        name: "qualifiedName",
        idx: 1
      })
    })

    it("can serialize a Alternative", () => {
      let input = new Alternative({
        definition: [
          new Terminal({ terminalType: WithLiteral }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      let actual = serializeProduction(input)
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
      let input = new Option({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      let actual = serializeProduction(input)
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
      let input = new RepetitionMandatory({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      let actual = serializeProduction(input)
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
      let input = new RepetitionMandatoryWithSeparator({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ],
        separator: Comma
      })
      let actual = serializeProduction(input)
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
      let input = new Repetition({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      let actual = serializeProduction(input)
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
      let input = new RepetitionWithSeparator({
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ],
        separator: Comma
      })
      let actual = serializeProduction(input)
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
      let input = new Alternation({
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

      let actual = serializeProduction(input)
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
      let input = new Terminal({ terminalType: A })
      let actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Terminal",
        name: "A",
        label: "bamba",
        idx: 1
      })
    })

    it("can serialize a Terminal with a pattern", () => {
      let input = new Terminal({ terminalType: B })
      let actual = serializeProduction(input)
      expect(actual).to.deep.equal({
        type: "Terminal",
        name: "B",
        label: "B",
        pattern: "[a-zA-Z]\\w*",
        idx: 1
      })
    })

    it("can serialize a Rule", () => {
      let input = new Rule({
        name: "myRule",
        orgText: "",
        definition: [
          new Terminal({ terminalType: C }),
          new NonTerminal({ nonTerminalName: "bamba" })
        ]
      })
      let actual = serializeProduction(input)
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
      let input = [
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
      let actual = serializeGrammar(input)
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
