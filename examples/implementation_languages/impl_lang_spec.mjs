import { parseJson }  from "./modern_ecmascript/modern_ecmascript_json.mjs"
import assert from "assert"

describe("The ability to use Chevrotain using modern ECMAScript", () => {
  it("works with ESM", () => {
    const inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
    const lexAndParseResult = parseJson(inputText)

    assert.equal(lexAndParseResult.lexErrors.length, 0)
    assert.equal(lexAndParseResult.parseErrors.length, 0)
  })
})
