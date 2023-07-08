import { expect } from "chai";
import { parse } from "./step2_parsing.js";

describe("Chevrotain Tutorial", () => {
  context("Step 2 - Parsing", () => {
    it("Can Parse a simple input", () => {
      let inputText = "SELECT column1 FROM table2";
      expect(() => parse(inputText)).to.not.throw();
    });

    it("Will throw an error for an invalid input", () => {
      // missing table name
      let inputText = "SELECT FROM table2";
      expect(() => parse(inputText)).to.throw(
        "expecting at least one iteration which starts with one of these possible Token sequences",
      );
      expect(() => parse(inputText)).to.throw(
        "<[Identifier]>\nbut found: 'FROM'",
      );
    });
  });
});
