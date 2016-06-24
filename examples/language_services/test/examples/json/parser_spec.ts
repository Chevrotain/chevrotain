import {JsonLexer} from "../../../src/examples/json/lexer"
import {JsonParser} from "../../../src/examples/json/parser"
import {expect} from "chai"

describe("The Json Parser", () => {

    it("can lex & parse a simple Json - sanity test", () => {

        let inputText = `{
            "key1" : 666,
            "key2" : "bamba",
            "key3" : true,
            "key4" : false,
            "key5" : null,
            "key6" : [1,2,3],
            "key7" : { "innerkey" : 444}
            }`

        let lexResult = JsonLexer.tokenize(inputText)
        expect(lexResult.errors).to.be.empty

        let parser = new JsonParser(lexResult.tokens)
        parser.object()
        expect(parser.errors).to.be.empty
    })

})

