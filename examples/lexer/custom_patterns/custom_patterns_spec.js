import { expect } from "chai";
import { tokenMatcher } from "chevrotain";
import { tokenize, Comma, IntegerLiteral } from "./custom_patterns.js";

describe("The Chevrotain Lexer ability to use custom pattern implementations.", () => {
  it("Can Lex a simple input using a Custom Integer Literal RegExp", () => {
    const text = `1 , 2 , 3`;
    const lexResult = tokenize(text);

    expect(lexResult.errors).to.be.empty;
    expect(lexResult.tokens).to.have.lengthOf(5);
    expect(tokenMatcher(lexResult.tokens[0], IntegerLiteral)).to.be.true;
    expect(lexResult.tokens[0].image).to.equal("1");
    expect(tokenMatcher(lexResult.tokens[1], Comma)).to.be.true;
    expect(tokenMatcher(lexResult.tokens[2], IntegerLiteral)).to.be.true;
    expect(lexResult.tokens[2].image).to.equal("2");
    expect(tokenMatcher(lexResult.tokens[3], Comma)).to.be.true;
    expect(tokenMatcher(lexResult.tokens[4], IntegerLiteral)).to.be.true;
    expect(lexResult.tokens[4].image).to.equal("3");
  });
});
