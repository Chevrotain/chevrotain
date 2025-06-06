import { defaultLexerErrorProvider } from "../../src/scan/lexer_errors_public.js";
import { IToken } from "@chevrotain/types";
import { expect } from "chai";

describe("The Chevrotain default lexer error message provider", () => {
  it("Will build unexpected character message", () => {
    const input = "1 LETTERS EXIT_LETTERS +";
    const msg = defaultLexerErrorProvider.buildUnexpectedCharactersMessage(
      input,
      23,
      1,
      0,
      23,
      "example_mode",
    );

    expect(msg).to.equal(
      "unexpected character: ->+<- at offset: 23, skipped 1 characters.",
    );
  });

  it("Will build an unable to pop lexer mode error message ", () => {
    const popToken: IToken = {
      image: "EXIT_NUMBERS",
      startOffset: 3,
    } as IToken; // the token type is not relevant for this test

    const msg =
      defaultLexerErrorProvider.buildUnableToPopLexerModeMessage(popToken);

    expect(msg).to.equal(
      "Unable to pop Lexer Mode after encountering Token ->EXIT_NUMBERS<- The Mode Stack is empty",
    );
  });
});
