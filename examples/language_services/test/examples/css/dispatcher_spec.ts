import {BaseCssDispatcher} from "../../../src/examples/css/dispatcher"
import {AstNode} from "../../../src/pudu/ast"
import {StringLiteral, CharsetHeader} from "../../../src/examples/css/ast"
import {expect} from "chai"

describe("The css dispatcher implementation", () => {

    it("can dispatch for an AstNode - sanity test", () => {
        class SanityDispatcher extends BaseCssDispatcher<void, string> {

            //noinspection JSUnusedLocalSymbols
            handleAstNode(node:AstNode):string {
                throw Error("should not have gotten to this handler when all sample nodes have handlers")
            }

            handleStringLiteral(node:StringLiteral):string {
                return node.value + "!!!"
            }

            handleCharsetHeader(node:CharsetHeader):string {
                return "charset: "
            }
        }

        let dispatcher = new SanityDispatcher()

        let charsetName = new StringLiteral("UTF8")
        let charsetHeader = new CharsetHeader(charsetName)

        let expectedResult = ["charset: ", "UTF8!!!"]
        let actualResult = charsetHeader.visit(dispatcher)

        expect(actualResult).to.contain.members(expectedResult)
        expect(expectedResult).to.contain.members(actualResult)
        expect(actualResult.length).to.equal(expectedResult.length)
    })
})
