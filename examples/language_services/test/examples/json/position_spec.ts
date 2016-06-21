import {analyzeText} from "../../../src/examples/json/api"
import {expect} from "chai"

describe("JES text positions information", () => {

    it("can extract textual position information from a JSON Ast", () => {
        let inputText = `{
            "key1" : 666,
            "key2" : "bamba",
            "key3" : true,
            "key4" : false,
            "key5" : null,
            "key6" : [1,2,3],
            "key7" : { "innerkey" : 444}
            }`

        let analysisResult = analyzeText(inputText)

        let rootNode = analysisResult.ast
        let actualRootPosition = rootNode.position()

        expect(actualRootPosition).to.deep.equal({
            startOffset: 0,
            startLine:   1,
            startColumn: 1,
            endOffset:   inputText.length,
            endLine:     9,
            endColumn:   13
        })

        let key3 = rootNode.children()[2]
        let key3Position = key3.position()

        expect(key3Position).to.deep.equal({
            startOffset: 70,
            startLine:   4,
            startColumn: 13,
            endOffset:   83,
            endLine:     4,
            endColumn:   25
        })

    })
})
