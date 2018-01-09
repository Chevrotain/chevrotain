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

    it("can generate a Or", () => {})

    it("can generate a Repetition", () => {})

    it("can generate a Mandatory Repetition", () => {})

    it("can generate a Repetition with separator", () => {})

    it("can generate a Mandatory Repetition with separator", () => {})
})
