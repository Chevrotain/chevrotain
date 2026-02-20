import { createToken } from "../../src/scan/tokens_public.js";
import { Lexer } from "../../src/scan/lexer_public.js";
import { expect } from "chai";

// These tests are expected to fail because the `u` (unicode) flag is dropped
// during pattern transformation in `addStickyFlag` and `addStartOfInput`
// (packages/chevrotain/src/scan/lexer.ts). Both functions reconstruct the
// RegExp preserving only the `i` flag, so unicode property escapes (\p{...})
// — which require the `u` flag — become invalid syntax at runtime.
describe("Chevrotain Lexer support for Tokens with regexp unicode flag", () => {
  it("Supports the unicode (u) flag on token patterns", () => {
    const Identifier = createToken({
      name: "Identifier",
      pattern: /\p{Letter}[\p{Letter}\p{Number}]*/u,
    });

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED,
    });

    const unicodeLexer = new Lexer([Identifier, WhiteSpace]);
    const lexResults = unicodeLexer.tokenize("hello world");
    expect(lexResults.errors).to.be.empty;
    expect(lexResults.tokens).to.have.lengthOf(2);
    expect(lexResults.tokens[0].image).to.equal("hello");
    expect(lexResults.tokens[0].tokenType).to.equal(Identifier);
    expect(lexResults.tokens[1].image).to.equal("world");
    expect(lexResults.tokens[1].tokenType).to.equal(Identifier);
  });

  it("Supports unicode property escapes for matching non-ASCII identifiers", () => {
    const Identifier = createToken({
      name: "Identifier",
      pattern: /\p{Letter}[\p{Letter}\p{Number}]*/u,
    });

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED,
    });

    const unicodeLexer = new Lexer([Identifier, WhiteSpace]);
    const lexResults = unicodeLexer.tokenize("café résumé naïve");
    expect(lexResults.errors).to.be.empty;
    expect(lexResults.tokens).to.have.lengthOf(3);
    expect(lexResults.tokens[0].image).to.equal("café");
    expect(lexResults.tokens[1].image).to.equal("résumé");
    expect(lexResults.tokens[2].image).to.equal("naïve");
  });

  it("Supports unicode property escapes for CJK characters", () => {
    const CJKWord = createToken({
      name: "CJKWord",
      pattern: /\p{Script=Han}+/u,
    });

    const LatinWord = createToken({
      name: "LatinWord",
      pattern: /\p{Script=Latin}+/u,
    });

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED,
    });

    const unicodeLexer = new Lexer([CJKWord, LatinWord, WhiteSpace]);
    const lexResults = unicodeLexer.tokenize("hello 世界");
    expect(lexResults.errors).to.be.empty;
    expect(lexResults.tokens).to.have.lengthOf(2);
    expect(lexResults.tokens[0].image).to.equal("hello");
    expect(lexResults.tokens[0].tokenType).to.equal(LatinWord);
    expect(lexResults.tokens[1].image).to.equal("世界");
    expect(lexResults.tokens[1].tokenType).to.equal(CJKWord);
  });

  it("Supports unicode property escapes for emoji matching", () => {
    const Emoji = createToken({
      name: "Emoji",
      pattern: /\p{Emoji_Presentation}/u,
    });

    const Word = createToken({
      name: "Word",
      pattern: /\w+/,
    });

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED,
    });

    const unicodeLexer = new Lexer([Emoji, Word, WhiteSpace]);
    const lexResults = unicodeLexer.tokenize("hello 😀 world");
    expect(lexResults.errors).to.be.empty;
    expect(lexResults.tokens).to.have.lengthOf(3);
    expect(lexResults.tokens[0].image).to.equal("hello");
    expect(lexResults.tokens[0].tokenType).to.equal(Word);
    expect(lexResults.tokens[1].image).to.equal("😀");
    expect(lexResults.tokens[1].tokenType).to.equal(Emoji);
    expect(lexResults.tokens[2].image).to.equal("world");
    expect(lexResults.tokens[2].tokenType).to.equal(Word);
  });

  it("Throws when ensureOptimizations is enabled with unicode flag patterns", () => {
    const Identifier = createToken({
      name: "Identifier",
      pattern: /\p{Letter}[\p{Letter}\p{Number}]*/u,
    });

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED,
    });

    // The regexp-to-ast library cannot analyze unicode patterns, so
    // first-char optimizations are unavailable. With ensureOptimizations
    // enabled the Lexer constructor should throw.
    expect(() => {
      new Lexer([Identifier, WhiteSpace], {
        ensureOptimizations: true,
      });
    }).to.throw(/cannot be optimized/);
  });
});
