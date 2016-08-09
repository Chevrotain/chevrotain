import {analyzeText, ITextAnalysisResult, performCssSemanticChecks} from "../../../src/examples/css/api"
import * as _ from "lodash"
import {expect} from "chai"
import {Term, UnaryMinusOperator, StringLiteral} from "../../../src/examples/css/ast"

function hasIssues(analysisResult:ITextAnalysisResult):boolean {
    return !_.isEmpty(analysisResult.lexErrors) || !_.isEmpty(analysisResult.parseErrors)
}

describe("The CSS semantic checks", () => {


    describe("can find negative values in properties which does not support such values", () => {

        it("positive", () => {
            let analysisResult = analyzeText(`
                svg {
                   width: 100%;
                   width: -100%;
                   cursor: pointer;
                }`
            )

            let node = analysisResult.ast
            expect(hasIssues(analysisResult)).to.be.false
            let semanticResult = performCssSemanticChecks(node)
            expect(semanticResult).to.have.lengthOf(1)

            expect(semanticResult[0].message).to.include("CSS property 'width' does not support negative values")
            expect(semanticResult[0].astNode).to.be.an.instanceof(Term)
            expect((<Term>semanticResult[0].astNode).unaryOperator).to.be.an.instanceof(UnaryMinusOperator)
        })

        it("negative", () => {

            let analysisResult = analyzeText(`
                svg {
                   width: 100%;
                   width: +100%;
                   cursor: pointer;
                }`
            )

            let node = analysisResult.ast
            expect(hasIssues(analysisResult)).to.be.false
            let semanticResult = performCssSemanticChecks(node)
            expect(semanticResult).to.be.empty
        })
    })


    describe("can detect invalid charset codes", () => {

        it("positive", () => {
            let analysisResult = analyzeText(`
                @charset "UTF-8-BAMBA";

                svg {
                   width: 100%;
                   width: 100%;
                   cursor: pointer;
                }`
            )

            let node = analysisResult.ast
            expect(hasIssues(analysisResult)).to.be.false
            let semanticResult = performCssSemanticChecks(node)
            expect(semanticResult).to.have.lengthOf(1)

            expect(semanticResult[0].message).to.include("Invalid Charset Header 'UTF-8-BAMBA'")
            expect(semanticResult[0].astNode).to.be.an.instanceof(StringLiteral)
            expect((<StringLiteral>semanticResult[0].astNode).value).to.equal("UTF-8-BAMBA")
        })

        it("negative", () => {

            let analysisResult = analyzeText(`
                @charset "UTF-8";

                svg {
                   width: 100%;
                   width: +100%;
                   cursor: pointer;
                }`
            )

            let node = analysisResult.ast
            expect(hasIssues(analysisResult)).to.be.false
            let semanticResult = performCssSemanticChecks(node)
            expect(semanticResult).to.be.empty
        })

    })

})
