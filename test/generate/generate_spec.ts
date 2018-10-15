import { Parser } from "../../src/parse/parser/traits/parser_traits"
import {
    generateParserModule,
    generateParserFactory
} from "../../src/generate/generate_public"
import { createToken } from "../../src/scan/tokens_public"
import { createRegularToken } from "../utils/matchers"
import {
    Alternation,
    Flat,
    Rule,
    Terminal,
    Option,
    NonTerminal,
    Repetition,
    RepetitionMandatory,
    RepetitionWithSeparator,
    RepetitionMandatoryWithSeparator
} from "../../src/parse/grammar/gast/gast_public"

let describeNodeOnly = describe
if (typeof window !== "undefined") {
    describeNodeOnly = <any>describe.skip
}

describe("The Code Generation capabilities", () => {
    it("can generate a Terminal", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new Rule({
                name: "topRule",
                definition: [new Terminal({ terminalType: Identifier })]
            })
        ]

        const parserFactory = generateParserFactory({
            name: "genTerminalParser",
            rules,
            tokenVocabulary
        })

        const myParser = <any>parserFactory({})
        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a NonTerminal", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new Rule({
                name: "topRule",
                definition: [
                    new NonTerminal({ nonTerminalName: "nestedRules" })
                ]
            }),
            new Rule({
                name: "nestedRules",
                definition: [new Terminal({ terminalType: Identifier })]
            })
        ]

        const parserFactory = generateParserFactory({
            name: "genNoneTerminalParser",
            rules,
            tokenVocabulary
        })

        const myParser = <any>parserFactory()
        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Option", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new Rule({
                name: "topRule",
                definition: [
                    new Option({
                        definition: [
                            new Flat({
                                definition: [
                                    new Terminal({ terminalType: Identifier })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]

        const parserFactory = generateParserFactory({
            name: "genOptionParser",
            rules,
            tokenVocabulary
        })

        const myParser = <any>parserFactory()

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
            new Rule({
                name: "topRule",
                definition: [
                    new Alternation({
                        definition: [
                            new Flat({
                                definition: [
                                    new Terminal({
                                        terminalType: Identifier
                                    })
                                ]
                            }),
                            new Flat({
                                definition: [
                                    new Terminal({ terminalType: Integer })
                                ],
                                name: "$inlinedRule"
                            })
                        ]
                    })
                ]
            })
        ]

        const parserFactory = generateParserFactory({
            name: "genOrParser",
            rules,
            tokenVocabulary
        })
        const myParser = <any>parserFactory()

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
            new Rule({
                name: "topRule",
                definition: [
                    new Repetition({
                        definition: [
                            new Terminal({ terminalType: Identifier })
                        ],
                        idx: 1,
                        name: "$inlinedRule"
                    })
                ]
            })
        ]

        const parserFactory = generateParserFactory({
            name: "genManyParser",
            rules,
            tokenVocabulary
        })
        const myParser = <any>parserFactory()

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
            new Rule({
                name: "topRule",
                definition: [
                    new RepetitionMandatory({
                        definition: [new Terminal({ terminalType: Identifier })]
                    })
                ]
            })
        ]

        const parserFactory = generateParserFactory({
            name: "genAtLeastOneParser",
            rules,
            tokenVocabulary
        })
        const myParser = <any>parserFactory()

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
            new Rule({
                name: "topRule",
                definition: [
                    new RepetitionWithSeparator({
                        definition: [
                            new Terminal({ terminalType: Identifier })
                        ],
                        separator: Comma
                    })
                ]
            })
        ]

        const parserFactory = generateParserFactory({
            name: "genManySepParser",
            rules,
            tokenVocabulary
        })
        const myParser = <any>parserFactory()

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
            new Rule({
                name: "topRule",
                definition: [
                    new RepetitionMandatoryWithSeparator({
                        definition: [
                            new Terminal({ terminalType: Identifier })
                        ],
                        separator: Comma
                    })
                ]
            })
        ]

        const parserFactory = generateParserFactory({
            name: "genAtLeastOneSepParser",
            rules,
            tokenVocabulary
        })
        const myParser = <any>parserFactory()

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
                new Rule({
                    name: "topRule",
                    definition: [
                        new Alternation({
                            definition: [
                                new Flat({
                                    definition: [
                                        new RepetitionMandatory({
                                            definition: [
                                                new Terminal({
                                                    terminalType: Identifier
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                new Flat({
                                    definition: [
                                        new Terminal({
                                            terminalType: Integer
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]

            const parserModuleText = generateParserModule({
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
