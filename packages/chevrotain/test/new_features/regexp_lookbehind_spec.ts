import { createToken } from "../../src/scan/tokens_public.js";
import { Lexer } from "../../src/scan/lexer_public.js";
import { expect } from "chai";

describe("Chevrotain Lexer support for Tokens with lookbehind assertions ", () => {
  it.only("Support payloads with custom Token Patterns", () => {
    const DollarAmount = createToken({
      name: "DollarAmount",
      pattern: /(?<=\$)\d+/, // $25
    });

    const EuroAmount = createToken({
      name: "EuroAmount",
      pattern: /(?<=€)\d+/, // €30
    });

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /[ \t\n\r]+/,
      group: Lexer.SKIPPED,
    });

    // TODO: this fails on lexer first char token optimization...
    const currentAmountsLexer = new Lexer([
      DollarAmount,
      EuroAmount,
      WhiteSpace,
    ]);
    const lexResults = currentAmountsLexer.tokenize("30€ 25$");
    expect(lexResults.errors).to.be.empty;
    expect(lexResults.tokens).to.have.lengthOf(2);
  });
});
