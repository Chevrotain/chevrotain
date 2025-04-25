import { expect } from "chai";
import { multiModeLexer } from "./multi_mode_lexer.js";

describe("The Chevrotain Lexer ability switch between Lexer modes", () => {
  it("Can Lex an input that requires multiple modes successfully", () => {
    const input = "1 LETTERS G A G SIGNS & EXIT_SIGNS B EXIT_LETTERS 3";
    const lexResult = multiModeLexer.tokenize(input);
    expect(lexResult.errors).to.be.empty;

    const images = lexResult.tokens.map((currTok) => currTok.image);
    expect(images).to.deep.equal([
      // By default, starting with the "first" mode "numbers_mode."
      // The ".tokenize" method can accept an optional initial mode argument as the second parameter.
      "1",
      "LETTERS", // entering "letters_mode"
      "G",
      "A",
      "G",
      "SIGNS", // entering "signs_mode".
      "&",
      "EXIT_SIGNS", // popping the last mode, we are now back in "letters_mode"
      "B",
      "EXIT_LETTERS", // popping the last mode, we are now back in "numbers_mode"
      "3",
    ]);
  });

  it("Will create a Lexing error when a Token which is not supported in the current mode is encountred", () => {
    const input = "1 LETTERS 2"; // 2 is not allowed in letters mode!
    const lexResult = multiModeLexer.tokenize(input);
    expect(lexResult.errors).to.have.lengthOf(1);
    expect(lexResult.errors[0].message).to.contain("unexpected character");
    expect(lexResult.errors[0].message).to.contain("2");
    expect(lexResult.errors[0].message).to.contain("at offset: 10");

    const images = lexResult.tokens.map((currTok) => currTok.image);
    expect(images).to.deep.equal(["1", "LETTERS"]);
  });
});
