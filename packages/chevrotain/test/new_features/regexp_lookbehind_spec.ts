import { createToken } from "../../src/scan/tokens_public.js";
import { Lexer } from "../../src/scan/lexer_public.js";
import { expect } from "chai";

describe("Chevrotain Lexer support for Tokens with lookbehind assertions ", () => {
  it("Supports positive lookbehind assertions", () => {
    const DollarAmount = createToken({
      name: "DollarAmount",
      pattern: /(?<=\$)\d+/, // $25
    });

    const EuroAmount = createToken({
      name: "EuroAmount",
      pattern: /(?<=€)\d+/, // €30
    });

    const DollarSign = createToken({
      name: "DollarSign",
      pattern: /\$/,
    });

    const EuroSign = createToken({
      name: "EuroSign",
      pattern: /€/,
    });

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /[ \t\n\r]+/,
      group: Lexer.SKIPPED,
    });

    const currentAmountsLexer = new Lexer(
      [DollarSign, EuroSign, DollarAmount, EuroAmount, WhiteSpace],
      {
        ensureOptimizations: true,
      },
    );
    const lexResults = currentAmountsLexer.tokenize("€30 $25");
    expect(lexResults.errors).to.be.empty;
    expect(lexResults.tokens).to.have.lengthOf(4);
    expect(lexResults.tokens[0].image).to.equal("€");
    expect(lexResults.tokens[0].tokenType).to.equal(EuroSign);
    expect(lexResults.tokens[1].image).to.equal("30");
    expect(lexResults.tokens[1].tokenType).to.equal(EuroAmount);
    expect(lexResults.tokens[2].image).to.equal("$");
    expect(lexResults.tokens[2].tokenType).to.equal(DollarSign);
    expect(lexResults.tokens[3].image).to.equal("25");
    expect(lexResults.tokens[3].tokenType).to.equal(DollarAmount);
  });
});
