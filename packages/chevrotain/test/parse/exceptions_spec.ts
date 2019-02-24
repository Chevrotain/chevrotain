import { createTokenInstance, EOF } from "../../src/scan/tokens_public"
import {
    EarlyExitException,
    NoViableAltException,
    NotAllInputParsedException,
    MismatchedTokenException
} from "../../src/parse/exceptions_public"
import { functionName } from "../../src/lang/lang_extensions"

describe("Chevrotain's Parsing Exceptions", () => {
    describe("the mappings between a an exception instance and its matching an exception's name for: ", () => {
        let isRunningInNodeJS = module && module.exports
        let it_node = isRunningInNodeJS ? it : it.skip

        let dummyToken = createTokenInstance(EOF, "", -1, -1, -1, -1, -1, -1)

        it_node("EarlyExitException", () => {
            let exceptionInstance = new EarlyExitException(
                "",
                dummyToken,
                dummyToken
            )
            expect(exceptionInstance.name).to.equal(
                functionName(exceptionInstance)
            )
        })

        it_node("NoViableAltException", () => {
            let exceptionInstance = new NoViableAltException(
                "",
                dummyToken,
                dummyToken
            )
            expect(exceptionInstance.name).to.equal(
                functionName(exceptionInstance)
            )
        })

        it_node("NotAllInputParsedException", () => {
            let exceptionInstance = new NotAllInputParsedException(
                "",
                dummyToken
            )
            expect(exceptionInstance.name).to.equal(
                functionName(exceptionInstance)
            )
        })

        it_node("MismatchedTokenException", () => {
            let exceptionInstance = new MismatchedTokenException(
                "",
                dummyToken,
                dummyToken
            )
            expect(exceptionInstance.name).to.equal(
                functionName(exceptionInstance)
            )
        })
    })
})
