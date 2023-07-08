import assert from "assert";
import { parseSelect } from "./versioning.js";

const VERSION_1 = 1;
const VERSION_2 = 2;

describe("The Grammar Versioning example", () => {
  it("can parse a simple Select statement with Version >1< grammar", () => {
    const inputText = "SELECT name FROM employees";
    const lexAndParseResult = parseSelect(inputText, VERSION_1);

    assert.equal(lexAndParseResult.lexErrors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 0);
  });

  it("can parse a simple Select statement with Version >2< grammar", () => {
    const inputText = "SELECT name FROM employees , managers";
    const lexAndParseResult = parseSelect(inputText, VERSION_2);

    assert.equal(lexAndParseResult.lexErrors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 0);
  });

  it("can NOT parse Version2 input using Version1 grammar", () => {
    // this input is invalid for V1 because there are multipile table names in the 'FROM' clause.
    const inputText = "SELECT name FROM employees , managers";
    const lexAndParseResult = parseSelect(inputText, VERSION_1);

    assert.equal(lexAndParseResult.lexErrors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 1); // has errors
  });
});
