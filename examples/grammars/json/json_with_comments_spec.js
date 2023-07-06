import { expect } from "chai"
import { parse } from "./json_with_comments.js"

describe("The JSON Grammar with comments", () => {
  it("can parse a simple Json without errors", () => {
    const inputText = `
        // To Level Comment
        { 
           // nested inner comment
           "arr": [
                    1,
                    2,
                    3
                  ],
           "obj": { 
                    "num":666
                  }
        }`
    const parseResult = parse(inputText)

    expect(parseResult.lexErrors).to.be.empty
    expect(parseResult.parseErrors).to.be.empty

    const cst = parseResult.cst

    // The top level comment was added to the top level Object CST.
    const topLevelComment = cst.children.object[0].children.Comment[0]
    expect(topLevelComment.image).to.eql("// To Level Comment")

    // The nested comment was added to the CST of the matching objectItem (key:value pair)
    const nestedComment =
      cst.children.object[0].children.objectItem[0].children.Comment[0]
    expect(nestedComment.image).to.eql("// nested inner comment")
  })
})
