import assert from "assert";
import { parseCommand } from "./inheritance.js";

const ENGLISH = "english";
const GERMAN = "german";

describe("The Advanced Inheritance Parser Example", () => {
  it("can parse commands in english", () => {
    const inputText = "clean the room after cooking some sausages";
    const lexAndParseResult = parseCommand(inputText, ENGLISH);

    assert.equal(lexAndParseResult.lexErrors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 0);
  });

  it("can parse commands in german", () => {
    const inputText = "kochen wurstchen und raum den raum auf";
    const lexAndParseResult = parseCommand(inputText, GERMAN);

    assert.equal(lexAndParseResult.lexErrors.length, 0);
    assert.equal(lexAndParseResult.parseErrors.length, 0);
  });
});
