import assert from "assert";
import { parseJson as parseJsonPureJs } from "./modern_ecmascript/modern_ecmascript_json.mjs";
import { parseJson as parseJsonGenTs } from "./typescript/typescript_json.js";

describe("The ability to use Chevrotain using modern ECMAScript", () => {
  it("works with ESM", () => {
    const inputText = '{ "arr": [1,2,3], "obj": {"num":666}}';
    const lexAndParseResult = parseJsonPureJs(inputText);

    assert.equal(lexAndParseResult.lexErrors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 0);
  });

  it("works with TypeScript generated output ", () => {
    const inputText = '{ "arr": [1,2,3], "obj": {"num":666}}';
    const lexAndParseResult = parseJsonGenTs(inputText);

    assert.equal(lexAndParseResult.lexErrors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 0);
  });
});
