import { gast } from "../../../src/parse/grammar/gast_public"
import { getProductionDslName } from "../../../src/parse/grammar/gast"
import {
    createToken,
    extendToken,
    Token
} from "../../../src/scan/tokens_public"
import Terminal = gast.Terminal
import NonTerminal = gast.NonTerminal
import Flat = gast.Flat
import serializeGrammar = gast.serializeGrammar
import serializeProduction = gast.serializeProduction

describe("GAst namespace", () => {
    describe("the ProdRef class", () => {
        it("will always return a valid empty definition, even if it's ref is unresolved", () => {
            let prodRef = new gast.NonTerminal("SomeGrammarRuleName")
            expect(prodRef.definition).to.be.an.instanceof(Array)
        })
    })

    describe("the mappings between a GAst instance and its matching DSL method name for: ", () => {
        class Comma extends Token {}

        it("Terminal", () => {
            let gastInstance = new gast.Terminal(Comma)
            expect(getProductionDslName(gastInstance)).to.equal("CONSUME")
        })

        it("NonTerminal", () => {
            let gastInstance = new gast.NonTerminal("bamba")
            expect(getProductionDslName(gastInstance)).to.equal("SUBRULE")
        })

        it("Option", () => {
            let gastInstance = new gast.Option([])
            expect(getProductionDslName(gastInstance)).to.equal("OPTION")
        })

        it("Alternation", () => {
            let gastInstance = new gast.Alternation([])
            expect(getProductionDslName(gastInstance)).to.equal("OR")
        })

        it("RepetitionMandatory", () => {
            let gastInstance = new gast.RepetitionMandatory([])
            expect(getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE")
        })

        it("RepetitionMandatoryWithSeparator", () => {
            let gastInstance = new gast.RepetitionMandatoryWithSeparator(
                [],
                Comma
            )
            expect(getProductionDslName(gastInstance)).to.equal(
                "AT_LEAST_ONE_SEP"
            )
        })

        it("RepetitionWithSeparator", () => {
            let gastInstance = new gast.RepetitionWithSeparator([], Comma)
            expect(getProductionDslName(gastInstance)).to.equal("MANY_SEP")
        })

        it("Repetition", () => {
            let gastInstance = new gast.Repetition([])
            expect(getProductionDslName(gastInstance)).to.equal("MANY")
        })
    })

    describe("the GAst serialization capabilities", () => {
        let A = extendToken("A")
        A.LABEL = "bamba"
        let B = extendToken("B", /[a-zA-Z]\w*/)
        let C = extendToken("C")
        let D = extendToken("D")
        let Comma = extendToken("Comma")
        let WithLiteral = createToken({ name: "WithLiteral", pattern: "bamba" })

        it("can serialize a NonTerminal", () => {
            let input = new gast.NonTerminal("qualifiedName")
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "NonTerminal",
                name: "qualifiedName",
                occurrenceInParent: 1
            })
        })

        it("can serialize a Flat", () => {
            let input = new gast.Flat([
                new Terminal(WithLiteral),
                new NonTerminal("bamba")
            ])
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
            let input = new gast.Option([
                new Terminal(C),
                new NonTerminal("bamba")
            ])
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
            let input = new gast.RepetitionMandatory([
                new Terminal(C),
                new NonTerminal("bamba")
            ])
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
            let input = new gast.RepetitionMandatoryWithSeparator(
                [new Terminal(C), new NonTerminal("bamba")],
                Comma
            )
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
            let input = new gast.Repetition([
                new Terminal(C),
                new NonTerminal("bamba")
            ])
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
            let input = new gast.RepetitionWithSeparator(
                [new Terminal(C), new NonTerminal("bamba")],
                Comma
            )
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
            let input = new gast.Alternation([
                new Flat([new Terminal(A)]),
                new Flat([new Terminal(B)]),
                new Flat([new Terminal(C)])
            ])

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
            let input = new gast.Terminal(A)
            let actual = serializeProduction(input)
            expect(actual).to.deep.equal({
                type: "Terminal",
                name: "A",
                label: "bamba",
                occurrenceInParent: 1
            })
        })

        it("can serialize a Terminal with a pattern", () => {
            let input = new gast.Terminal(B)
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
            let input = new gast.Rule("myRule", [
                new Terminal(C),
                new NonTerminal("bamba")
            ])
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
                new gast.Rule("myRule", [
                    new Terminal(C),
                    new NonTerminal("bamba")
                ]),
                new gast.Rule("myRule2", [
                    new Terminal(D),
                    new NonTerminal("bisli")
                ])
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
