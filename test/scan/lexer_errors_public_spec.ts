import { defaultLexerErrorProvider } from "../../src/scan/lexer_errors_public"
import { IToken } from "../../api"

describe("The Chevrotain default lexer error message provider", () => {
    it("Will build unexpected character message", () => {
        let input = "1 LETTERS EXIT_LETTERS +"
        const msg = defaultLexerErrorProvider.buildUnexpectedCharacterMessage(
            input,
            23,
            1,
            0,
            23
        )

        expect(msg).to.equal(
            "unexpected character: ->+<- at offset: 23, skipped 1 characters."
        )
    })

    it("Will build an unable to pop lexer mode error message ", () => {
        const popToken: IToken = {
            image: "EXIT_NUMBERS",
            startOffset: 3
        }

        const msg = defaultLexerErrorProvider.buildUnableToPopLexerModeMessage(
            popToken
        )

        expect(msg).to.equal(
            "Unable to pop Lexer Mode after encountering Token ->EXIT_NUMBERS<- The Mode Stack is empty"
        )
    })
})
