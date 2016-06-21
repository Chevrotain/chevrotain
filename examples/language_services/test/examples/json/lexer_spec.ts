import {JsonLexer} from "../../../src/examples/json/lexer"
import {expect} from "chai"

describe("The Json lexer", () => {

    it("can lex a simple Json - sanity test", () => {
        let inputText = "{ \"arr\": [1,2,3], \"obj\": {\"num\":666}}"
        let lexResult = JsonLexer.tokenize(inputText)

        expect(lexResult.errors).to.be.empty
    })

})
