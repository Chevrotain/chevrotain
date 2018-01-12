import { genWrapperFunction } from "../../src/generate/generate"
import { gast } from "../../src/parse/grammar/gast_public"
import { createToken } from "../../src/scan/tokens_public"
import { Parser } from "../../src/parse/parser_public"
import { createRegularToken } from "../utils/matchers"

describe.only("The Code Generation capabilities", () => {
    it("can generate a Terminal", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const rules = [
            new gast.Rule("topRule", [new gast.Terminal(Identifier)])
        ]
        const wrapperText = genWrapperFunction({
            name: "genTerminalParser",
            rules
        })

        const testWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        const myParser = testWrapper.call(null, [Identifier], {}, { Parser })
        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a NonTerminal", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const rules = [
            new gast.Rule("topRule", [new gast.Terminal(Identifier)])
        ]
        const wrapperText = genWrapperFunction({
            name: "genTerminalParser",
            rules
        })

        const testWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        const myParser = testWrapper.call(null, [Identifier], {}, { Parser })
        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Option", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const rules = [
            new gast.Rule("topRule", [
                new gast.Option([new gast.Terminal(Identifier)])
            ])
        ]

        const wrapperText = genWrapperFunction({
            name: "genOptionParser",
            rules
        })

        const testWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        const myParser = testWrapper.call(null, [Identifier], {}, { Parser })
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

        const rules = [
            new gast.Rule("topRule", [
                new gast.Alternation([
                    new gast.Flat([new gast.Terminal(Identifier)]),
                    new gast.Flat([new gast.Terminal(Integer)])
                ])
            ])
        ]

        const wrapperText = genWrapperFunction({
            name: "genOrParser",
            rules
        })

        const testWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        const myParser = testWrapper.call(
            null,
            [Identifier, Integer],
            {},
            { Parser }
        )
        myParser.input = [createRegularToken(Identifier)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty

        myParser.input = [createRegularToken(Integer)]
        myParser.topRule()
        expect(myParser.errors).to.be.empty
    })

    it("can generate a Repetition", () => {
        const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
        const rules = [
            new gast.Rule("topRule", [
                new gast.Repetition([new gast.Terminal(Identifier)])
            ])
        ]

        const wrapperText = genWrapperFunction({
            name: "genRepetitionParser",
            rules
        })

        const testWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        const myParser = testWrapper.call(null, [Identifier], {}, { Parser })
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
        const rules = [
            new gast.Rule("topRule", [
                new gast.RepetitionMandatory([new gast.Terminal(Identifier)])
            ])
        ]

        const wrapperText = genWrapperFunction({
            name: "genRepetitionMandatoryParser",
            rules
        })

        const testWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        const myParser = testWrapper.call(null, [Identifier], {}, { Parser })
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

        const rules = [
            new gast.Rule("topRule", [
                new gast.RepetitionWithSeparator(
                    [new gast.Terminal(Identifier)],
                    Comma
                )
            ])
        ]

        const wrapperText = genWrapperFunction({
            name: "genRepetitionSeparatorParser",
            rules
        })

        const testWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        const myParser = testWrapper.call(
            null,
            [Identifier, Comma],
            {},
            { Parser }
        )
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

        const rules = [
            new gast.Rule("topRule", [
                new gast.RepetitionWithSeparator(
                    [new gast.Terminal(Identifier)],
                    Comma
                )
            ])
        ]

        const wrapperText = genWrapperFunction({
            name: "genRepetitionMandatorySeparatorParser",
            rules
        })

        const testWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        const myParser = testWrapper.call(
            null,
            [Identifier, Comma],
            {},
            { Parser }
        )
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
})
