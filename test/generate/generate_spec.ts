import { Parser } from "../../src/parse/parser_public"
import { generation as gen } from "../../src/generate/generate_public"
import { gast } from "../../src/parse/grammar/gast_public"
import { createToken } from "../../src/scan/tokens_public"
import { createRegularToken } from "../utils/matchers"

let describeNodeOnly = describe
if (typeof window !== "undefined") {
    describeNodeOnly = <any>describe.skip
}

describe("The Code Generation capabilities", () => {
    it("can generate a Terminal", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new gast.Rule({
                name: "topRule",
                definition: [new gast.Terminal({ terminalType: Identifier })]
            })
        ]

        const parserFactory = gen.genParserFactory<any>({
            name: "genTerminalParser",
            rules,
            tokenVocabulary
        })

        const myParser = parserFactory({})
        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a NonTerminal", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new gast.Rule({
                name: "topRule",
                definition: [
                    new gast.NonTerminal({ nonTerminalName: "nestedRules" })
                ]
            }),
            new gast.Rule({
                name: "nestedRules",
                definition: [new gast.Terminal({ terminalType: Identifier })]
            })
        ]

        const parserFactory = gen.genParserFactory<any>({
            name: "genNoneTerminalParser",
            rules,
            tokenVocabulary
        })

        const myParser = parserFactory()
        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Option", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new gast.Rule({
                name: "topRule",
                definition: [
                    new gast.Option({
                        definition: [
                            new gast.Terminal({ terminalType: Identifier })
                        ]
                    })
                ]
            })
        ]

        const parserFactory = gen.genParserFactory<any>({
            name: "genOptionParser",
            rules,
            tokenVocabulary
        })

        const myParser = parserFactory()

        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty

        myParser.input = []
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Or", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const Integer = createToken({ name: "Integer", pattern: /\d+/ })
        const tokenVocabulary = [Identifier, Integer]

        const rules = [
            new gast.Rule({
                name: "topRule",
                definition: [
                    new gast.Alternation({
                        definition: [
                            new gast.Flat({
                                definition: [
                                    new gast.Terminal({
                                        terminalType: Identifier
                                    })
                                ]
                            }),
                            new gast.Flat({
                                definition: [
                                    new gast.Terminal({ terminalType: Integer })
                                ],
                                name: "$inlinedRule"
                            })
                        ]
                    })
                ]
            })
        ]

        const parserFactory = gen.genParserFactory<any>({
            name: "genOrParser",
            rules,
            tokenVocabulary
        })
        const myParser = parserFactory()

        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty

        myParser.input = [createRegularToken(Integer)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Repetition", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new gast.Rule({
                name: "topRule",
                definition: [
                    new gast.Repetition({
                        definition: [
                            new gast.Terminal({ terminalType: Identifier })
                        ],
                        occurrenceInParent: 1,
                        name: "$inlinedRule"
                    })
                ]
            })
        ]

        const parserFactory = gen.genParserFactory<any>({
            name: "genManyParser",
            rules,
            tokenVocabulary
        })
        const myParser = parserFactory()

        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty

        myParser.input = [
            createRegularToken(Identifier),
            createRegularToken(Identifier),
            createRegularToken(Identifier)
        ]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Mandatory Repetition", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new gast.Rule({
                name: "topRule",
                definition: [
                    new gast.RepetitionMandatory({
                        definition: [
                            new gast.Terminal({ terminalType: Identifier })
                        ]
                    })
                ]
            })
        ]

        const parserFactory = gen.genParserFactory<any>({
            name: "genAtLeastOneParser",
            rules,
            tokenVocabulary
        })
        const myParser = parserFactory()

        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty

        myParser.input = [
            createRegularToken(Identifier),
            createRegularToken(Identifier),
            createRegularToken(Identifier)
        ]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Repetition with separator", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const Comma = createToken({ name: "Comma", pattern: /,/ })
        const tokenVocabulary = [Identifier, Comma]

        const rules = [
            new gast.Rule({
                name: "topRule",
                definition: [
                    new gast.RepetitionWithSeparator({
                        definition: [
                            new gast.Terminal({ terminalType: Identifier })
                        ],
                        separator: Comma
                    })
                ]
            })
        ]

        const parserFactory = gen.genParserFactory<any>({
            name: "genManySepParser",
            rules,
            tokenVocabulary
        })
        const myParser = parserFactory()

        myParser.input = []
        myParser.topRule()
        expect(myParser.errors).to.be.empty

        myParser.input = [
            createRegularToken(Identifier),
            createRegularToken(Comma),
            createRegularToken(Identifier),
            createRegularToken(Comma),
            createRegularToken(Identifier)
        ]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Mandatory Repetition with separator", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const Comma = createToken({ name: "Comma", pattern: /,/ })
        const tokenVocabulary = [Identifier, Comma]

        const rules = [
            new gast.Rule({
                name: "topRule",
                definition: [
                    new gast.RepetitionMandatoryWithSeparator({
                        definition: [
                            new gast.Terminal({ terminalType: Identifier })
                        ],
                        separator: Comma
                    })
                ]
            })
        ]

        const parserFactory = gen.genParserFactory<any>({
            name: "genAtLeastOneSepParser",
            rules,
            tokenVocabulary
        })
        const myParser = parserFactory()

        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty

        myParser.input = [
            createRegularToken(Identifier),
            createRegularToken(Comma),
            createRegularToken(Identifier),
            createRegularToken(Comma),
            createRegularToken(Identifier)
        ]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    describeNodeOnly("moduleGeneration", () => {
        before(() => {
            const mock = require("mock-require")
            mock("chevrotain", { Parser: Parser })
        })

        it("Can generate a module", () => {
            const requireFromString = require("require-from-string")

            const Identifier = createToken({
                name: "Identifier",
                pattern: /\w+/
            })
            const Integer = createToken({ name: "Integer", pattern: /\d+/ })
            const tokenVocabulary = [Identifier, Integer]

            const rules = [
                new gast.Rule({
                    name: "topRule",
                    definition: [
                        new gast.Alternation({
                            definition: [
                                new gast.Flat({
                                    definition: [
                                        new gast.RepetitionMandatory({
                                            definition: [
                                                new gast.Terminal({
                                                    terminalType: Identifier
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                new gast.Flat({
                                    definition: [
                                        new gast.Terminal({
                                            terminalType: Integer
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]

            const parserModuleText = gen.generateParserModule({
                name: "genOrParserModule",
                rules
            })
            const parserModule = requireFromString(parserModuleText)
            const myParser = new parserModule.genOrParserModule(tokenVocabulary)

            myParser.input = [createRegularToken(Identifier)]
            myParser.topRule()
            expect(myParser.errors).to.be.empty

            myParser.input = [createRegularToken(Integer)]
            myParser.topRule()
            expect(myParser.errors).to.be.empty
        })

        after(() => {
            const mock = require("mock-require")
            mock.stop("chevrotain")
        })
    })
})
