import {
    analyzeText,
    ITextAnalysisResult
} from "../../../src/examples/json/api"
import {
    checkDuplicateKeys,
    checkReservedJavascriptKeyword
} from "../../../src/examples/json/semantics"
import * as _ from "lodash"
import {expect} from "chai"

function hasIssues(analysisResult:ITextAnalysisResult):boolean {
    return !_.isEmpty(analysisResult.lexErrors) || !_.isEmpty(analysisResult.parseErrors)
}

describe("The jes semantic checks", () => {


    describe("can find duplicate JSON keys", () => {

        it("positive", () => {
            let analysisResult = analyzeText(`{
            "key1" : 666,
            "key2" : 333,
            "key3" : 444,
            "key1" : 111,
            "key2" : 222
            }`)

            let node = analysisResult.ast
            expect(hasIssues(analysisResult)).to.be.false
            let semanticResult = checkDuplicateKeys(node)
            expect(semanticResult).to.have.lengthOf(4)

            expect(semanticResult[0].message).to.include("key1")
            expect(semanticResult[0].astNode).to.equal(node.items[0].key)

            expect(semanticResult[1].message).to.include("key2")
            expect(semanticResult[1].astNode).to.equal(node.items[1].key)

            expect(semanticResult[2].message).to.include("key1")
            expect(semanticResult[2].astNode).to.equal(node.items[3].key)

            expect(semanticResult[3].message).to.include("key2")
            expect(semanticResult[3].astNode).to.equal(node.items[4].key)

            it("negative", () => {

                let analysisResult = analyzeText(`{
                    "key1" : 666,
                    "key2" : 333,
                    "key3" : 444,
                    "key4" : 111,
                    "key5" : 222,
                    }`)

                let node = analysisResult.ast
                expect(hasIssues(analysisResult)).to.be.false
                let semanticResult = checkDuplicateKeys(node)
                expect(semanticResult).to.be.empty
            })
        })

        describe("can find javascript keywords used as json keys", () => {

            let analysisResult = analyzeText(`{
                    "if" : 666,
                    "key2" : 333,
                    "key3" : 444,
                    "for" : 111,
                    "key2" : 222
                }`)

            let node = analysisResult.ast
            expect(hasIssues(analysisResult)).to.be.false


            it("positive", () => {

                let checkResult = checkReservedJavascriptKeyword(node.items[0])
                expect(checkResult).to.have.lengthOf(1)
                expect(checkResult[0].message).to.include("if")
                expect(checkResult[0].message).to.include("Reserved Keyword")
                expect(checkResult[0].astNode).to.equal(node.items[0].key)

                let checkResult2 = checkReservedJavascriptKeyword(node.items[3])
                expect(checkResult2).to.have.lengthOf(1)
                expect(checkResult2[0].message).to.include("for")
                expect(checkResult2[0].message).to.include("Reserved Keyword")
                expect(checkResult2[0].astNode).to.equal(node.items[3].key)
            })

            it("negative", () => {
                let checkResult = checkReservedJavascriptKeyword(node.items[2])
                expect(checkResult).to.be.empty
            })
        })

    })
})
