import { gast } from "../../../src/parse/grammar/gast_public"
import { getProductionDslName } from "../../../src/parse/grammar/gast"
import { createToken } from "../../../src/scan/tokens_public"
import Terminal = gast.Terminal
import NonTerminal = gast.NonTerminal
import Flat = gast.Flat
import serializeGrammar = gast.serializeGrammar
import serializeProduction = gast.serializeProduction

describe("GAst namespace", () => {
    describe("the ProdRef class", () => {
        it("will always return a valid empty definition, even if it's ref is unresolved", () => {
            let prodRef = new gast.NonTerminal({
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
            let gastInstance = new gast.Terminal({ terminalType: Comma })
            expect(getProductionDslName(gastInstance)).to.equal("CONSUME")
        })

        it("NonTerminal", () => {
            let gastInstance = new gast.NonTerminal({
                nonTerminalName: "bamba"
            })
            expect(getProductionDslName(gastInstance)).to.equal("SUBRULE")
        })

        it("Option", () => {
            let gastInstance = new gast.Option({ definition: [] })
            expect(getProductionDslName(gastInstance)).to.equal("OPTION")
        })

        it("Alternation", () => {
            let gastInstance = new gast.Alternation({ definition: [] })
            expect(getProductionDslName(gastInstance)).to.equal("OR")
        })

        it("RepetitionMandatory", () => {
            let gastInstance = new gast.RepetitionMandatory({ definition: [] })
            expect(getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE")
        })

        it("RepetitionMandatoryWithSeparator", () => {
            let gastInstance = new gast.RepetitionMandatoryWithSeparator({
                definition: [],
                separator: Comma
            })
            expect(getProductionDslName(gastInstance)).to.equal(
                "AT_LEAST_ONE_SEP"
            )
        })

        it("RepetitionWithSeparator", () => {
            let gastInstance = new gast.RepetitionWithSeparator({
                definition: [],
                separator: Comma
            })
            expect(getProductionDslName(gastInstance)).to.equal("MANY_SEP")
        })

        it("Repetition", () => {
            let gastInstance = new gast.Repetition({ definition: [] })
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
            let input = new gast.NonTerminal({
                nonTerminalName: "qualifiedName"
            })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "NonTerminal",
                name: "qualifiedName",
                occurrenceInParent: 1
            })
        })

        it("can serialize a Flat", () => {
            let input = new gast.Flat({
                definition: [
                    new Terminal({ terminalType: WithLiteral }),
                    new NonTerminal({ nonTerminalName: "bamba" })
                ]
            })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "Flat",
                definition: [
                    {
                        type: "Terminal",
                        name: "WithLiteral",
                        pattern: "bamba",
                        label: "WithLiteral",
                        occurrenceInParent: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        occurrenceInParent: 1
                    }
                ]
            })
        })

        it("can serialize a Option", () => {
            let input = new gast.Option({
                definition: [
                    new Terminal({ terminalType: C }),
                    new NonTerminal({ nonTerminalName: "bamba" })
                ]
            })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "Option",
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        occurrenceInParent: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        occurrenceInParent: 1
                    }
                ]
            })
        })

        it("can serialize a RepetitionMandatory", () => {
            let input = new gast.RepetitionMandatory({
                definition: [
                    new Terminal({ terminalType: C }),
                    new NonTerminal({ nonTerminalName: "bamba" })
                ]
            })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "RepetitionMandatory",
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        occurrenceInParent: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        occurrenceInParent: 1
                    }
                ]
            })
        })

        it("can serialize a RepetitionMandatoryWithSeparator", () => {
            let input = new gast.RepetitionMandatoryWithSeparator({
                definition: [
                    new Terminal({ terminalType: C }),
                    new NonTerminal({ nonTerminalName: "bamba" })
                ],
                separator: Comma
            })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "RepetitionMandatoryWithSeparator",
                separator: {
                    type: "Terminal",
                    name: "Comma",
                    label: "Comma",
                    occurrenceInParent: 1
                },
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        occurrenceInParent: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        occurrenceInParent: 1
                    }
                ]
            })
        })

        it("can serialize a Repetition", () => {
            let input = new gast.Repetition({
                definition: [
                    new Terminal({ terminalType: C }),
                    new NonTerminal({ nonTerminalName: "bamba" })
                ]
            })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "Repetition",
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        occurrenceInParent: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        occurrenceInParent: 1
                    }
                ]
            })
        })

        it("can serialize a RepetitionWithSeparator", () => {
            let input = new gast.RepetitionWithSeparator({
                definition: [
                    new Terminal({ terminalType: C }),
                    new NonTerminal({ nonTerminalName: "bamba" })
                ],
                separator: Comma
            })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "RepetitionWithSeparator",
                separator: {
                    type: "Terminal",
                    name: "Comma",
                    label: "Comma",
                    occurrenceInParent: 1
                },
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        occurrenceInParent: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        occurrenceInParent: 1
                    }
                ]
            })
        })

        it("can serialize a Alternation", () => {
            let input = new gast.Alternation({
                definition: [
                    new Flat({
                        definition: [new Terminal({ terminalType: A })]
                    }),
                    new Flat({
                        definition: [new Terminal({ terminalType: B })]
                    }),
                    new Flat({
                        definition: [new Terminal({ terminalType: C })]
                    })
                ]
            })

            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "Alternation",
                definition: [
                    {
                        type: "Flat",
                        definition: [
                            {
                                type: "Terminal",
                                name: "A",
                                label: "bamba",
                                occurrenceInParent: 1
                            }
                        ]
                    },
                    {
                        type: "Flat",
                        definition: [
                            {
                                type: "Terminal",
                                name: "B",
                                label: "B",
                                pattern: "[a-zA-Z]\\w*",
                                occurrenceInParent: 1
                            }
                        ]
                    },
                    {
                        type: "Flat",
                        definition: [
                            {
                                type: "Terminal",
                                name: "C",
                                label: "C",
                                occurrenceInParent: 1
                            }
                        ]
                    }
                ]
            })
        })

        it("can serialize a Terminal with a custom label", () => {
            let input = new gast.Terminal({ terminalType: A })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "Terminal",
                name: "A",
                label: "bamba",
                occurrenceInParent: 1
            })
        })

        it("can serialize a Terminal with a pattern", () => {
            let input = new gast.Terminal({ terminalType: B })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "Terminal",
                name: "B",
                label: "B",
                pattern: "[a-zA-Z]\\w*",
                occurrenceInParent: 1
            })
        })

        it("can serialize a Rule", () => {
            let input = new gast.Rule({
                name: "myRule",
                definition: [
                    new Terminal({ terminalType: C }),
                    new NonTerminal({ nonTerminalName: "bamba" })
                ]
            })
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "Rule",
                name: "myRule",
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        occurrenceInParent: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        occurrenceInParent: 1
                    }
                ]
            })
        })

        it("can serialize an array of Rules", () => {
            let input = [
                new gast.Rule({
                    name: "myRule",
                    definition: [
                        new Terminal({ terminalType: C }),
                        new NonTerminal({ nonTerminalName: "bamba" })
                    ]
                }),
                new gast.Rule({
                    name: "myRule2",
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
                    definition: [
                        {
                            type: "Terminal",
                            name: "C",
                            label: "C",
                            occurrenceInParent: 1
                        },
                        {
                            type: "NonTerminal",
                            name: "bamba",
                            occurrenceInParent: 1
                        }
                    ]
                },
                {
                    type: "Rule",
                    name: "myRule2",
                    definition: [
                        {
                            type: "Terminal",
                            name: "D",
                            label: "D",
                            occurrenceInParent: 1
                        },
                        {
                            type: "NonTerminal",
                            name: "bisli",
                            occurrenceInParent: 1
                        }
                    ]
                }
            ])
        })
    })
})
