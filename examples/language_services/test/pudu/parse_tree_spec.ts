import {ParseTree} from "../../src/pudu/parse_tree"
import {Token, createTokenInstance} from "chevrotain"
import {expect} from "chai"

describe("The parseTree namespace", () => {

    it("exposes a constructor for a ParseTree", () => {
        let tree = new ParseTree(createTokenInstance(Token, "bamba", 1, 2, 3, 4, 5, 6), [])
        expect(tree.children).to.have.length(0)
        expect(tree.getImage()).to.equal("bamba")
    })
})
