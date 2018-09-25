import { Parser } from "../../../src/parse/parser_public"
import { createRegularToken } from "../../utils/matchers"
import { augmentTokenTypes } from "../../../src/scan/tokens"
import { IToken } from "../../../api"

describe("The Recognizer's capabilities for detecting infinite loops", () => {
    class PlusTok {
        static PATTERN = /\+/
    }
    augmentTokenTypes(<any>[PlusTok])

    it("Will detect an infinite loop with an early return", () => {
        class InifiniteLoopParser extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok])
                this.input = input
                this.performSelfAnalysis()
            }

            public loop = this.RULE("loop", () => {
                this.MANY(() => {
                    return
                    // noinspection UnreachableCodeJS
                    this.CONSUME(PlusTok)
                })
            })
        }

        const parser = new InifiniteLoopParser()
        parser.input = [createRegularToken(PlusTok)]

        expect(() => parser.loop()).to.throw("Infinite loop detected")
    })
})
