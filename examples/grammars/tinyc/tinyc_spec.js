import assert from "assert";
import { parseTinyC } from "./tinyc.js";

describe("The TinyC Grammar", () => {
  it("can parse a simple TinyC sample without errors", () => {
    const inputText =
      "{ " +
      "i=125;" +
      " j=100;" +
      " while (i-j)" +
      "   if (i<j) " +
      "       j=j-i; " +
      "   else i=i-j;" +
      "}";
    const lexAndParseResult = parseTinyC(inputText);

    assert.equal(lexAndParseResult.lexErrors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 0);
  });
});
