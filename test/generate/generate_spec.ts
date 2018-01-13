import {
    generateParserModule,
    genParserFactory
} from "../../src/generate/generate_public"
import { gast } from "../../src/parse/grammar/gast_public"
import { createToken } from "../../src/scan/tokens_public"
import { createRegularToken } from "../utils/matchers"

let itNodeOnly = it
if (typeof window !== "undefined") {
    itNodeOnly = <any>it.skip
}

describe("The Code Generation capabilities", () => {
    it("can generate a Terminal", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const tokenVocabulary = [Identifier]

        const rules = [
            new gast.Rule("topRule", [new gast.Terminal(Identifier)])
        ]

        const parserFactory = genParserFactory<any>({
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
            new gast.Rule("topRule", [new gast.NonTerminal("nestedRules")]),
            new gast.Rule("nestedRules", [new gast.Terminal(Identifier)])
        ]

        const parserFactory = genParserFactory<any>({
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
            new gast.Rule("topRule", [
                new gast.Option([new gast.Terminal(Identifier)])
            ])
        ]

        const parserFactory = genParserFactory<any>({
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
            new gast.Rule("topRule", [
                new gast.Alternation([
                    new gast.Flat([new gast.Terminal(Identifier)]),
                    new gast.Flat([new gast.Terminal(Integer)], "$inlinedRule")
                ])
            ])
        ]

        const parserFactory = genParserFactory<any>({
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
            new gast.Rule("topRule", [
                new gast.Repetition(
                    [new gast.Terminal(Identifier)],
                    1,
                    "$inlinedRule"
                )
            ])
        ]

        const parserFactory = genParserFactory<any>({
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
            new gast.Rule("topRule", [
                new gast.RepetitionMandatory([new gast.Terminal(Identifier)])
            ])
        ]

        const parserFactory = genParserFactory<any>({
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
            new gast.Rule("topRule", [
                new gast.RepetitionWithSeparator(
                    [new gast.Terminal(Identifier)],
                    Comma
                )
            ])
        ]

        const parserFactory = genParserFactory<any>({
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
            new gast.Rule("topRule", [
                new gast.RepetitionMandatoryWithSeparator(
                    [new gast.Terminal(Identifier)],
                    Comma
                )
            ])
        ]

        const parserFactory = genParserFactory<any>({
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

    itNodeOnly("Can generate a module", () => {
        const requireFromString = require("require-from-string")

        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const Integer = createToken({ name: "Integer", pattern: /\d+/ })
        const tokenVocabulary = [Identifier, Integer]

        const rules = [
            new gast.Rule("topRule", [
                new gast.Alternation([
                    new gast.Flat([
                        new gast.RepetitionMandatory([
                            new gast.Terminal(Identifier)
                        ])
                    ]),
                    new gast.Flat([new gast.Terminal(Integer)])
                ])
            ])
        ]

        const parserModuleText = generateParserModule({
            name: "genOrParserModule",
            rules,
            tokenVocabulary
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
})
