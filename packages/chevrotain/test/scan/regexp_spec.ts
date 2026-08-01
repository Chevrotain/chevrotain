import { createToken } from "../../src/scan/tokens_public.js";
import { Lexer } from "../../src/scan/lexer_public.js";
import {
  canMatchCharCode,
  getOptimizedStartCodesIndices,
} from "../../src/scan/reg_exp.js";
import { expect } from "chai";
import { analyzeTokenTypes } from "../../src/scan/lexer.js";

describe("The Chevrotain regexp analysis", () => {
  it("Will re-attempt none 'optimized' patterns if the optimization failed", () => {
    // won't be automatically optimized due to the '|' meta characters
    const Boolean = createToken({
      name: "Boolean",
      pattern: /true|false/,
      // But we provide the hints so it can be optimized
      start_chars_hint: ["t", "f"],
    });
    // simple string can perform optimization
    const Function = createToken({ name: "Function", pattern: "function" });
    // won't be optimized due to the '\w' and '+'
    const Name = createToken({ name: "False", pattern: /\w+/ });

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED,
      line_breaks: true,
    });

    const allTokens = [WhiteSpace, Boolean, Function, Name];
    const JsonLexer = new Lexer(allTokens);
    const lexResult = JsonLexer.tokenize("fool");
    expect(lexResult.tokens).to.have.lengthOf(1);
    expect(lexResult.tokens[0].tokenType).to.equal(Name);
  });
});

describe("ASCII character class scanning", () => {
  function getAsciiClass(pattern: RegExp) {
    const Skipped = createToken({
      name: `Skipped${pattern}`,
      pattern,
      group: Lexer.SKIPPED,
    });
    return analyzeTokenTypes([Skipped], {}).patternIdxToConfig[0].asciiClass;
  }

  it("recognizes JSON and CSS whitespace without conflating form feed", () => {
    const json = getAsciiClass(/[ \t\n\r]+/)!;
    const css = getAsciiClass(/(?:[ \t\r\n\f]){1,}/)!;

    expect(json[32]).to.equal(1);
    expect(json[12]).to.equal(0);
    expect(css[12]).to.equal(1);

    const X = createToken({ name: "AsciiX", pattern: /x/ });
    const makeLexer = (pattern: RegExp) =>
      new Lexer(
        [
          createToken({
            name: `FormFeed${pattern}`,
            pattern,
            group: Lexer.SKIPPED,
          }),
          X,
        ],
        { positionTracking: "onlyOffset" },
      );
    expect(makeLexer(/[ \t\n\r]+/).tokenize("\fx").errors).to.have.lengthOf(1);
    expect(makeLexer(/[ \t\n\r\f]+/).tokenize("\fx").errors).to.be.empty;
  });

  it("rejects patterns whose equivalence is not safely provable", () => {
    const patterns = [
      /[ \t]+?/,
      /[^a]+/,
      /[ a\u00a0]+/,
      /[ a]+/i,
      /([ a])+/,
      /(?=[ a])[ a]+/,
      /([ a])\1+/,
    ];

    for (const pattern of patterns) {
      expect(getAsciiClass(pattern), pattern.toString()).to.be.undefined;
    }
  });

  it("falls back to RegExp semantics for rejected patterns", () => {
    const cases: [RegExp, string, string][] = [
      [/[ a]+?/, "  x", "x"],
      [/[^a]+/, "bbba", "a"],
      [/[\u00a0]+/, "\u00a0x", "x"],
      [/[a]+/i, "AAx", "x"],
      [/([a])+/, "aax", "x"],
      [/(?=a)[a]+/, "aax", "x"],
      [/(a)\1+/, "aaax", "x"],
    ];

    for (const [pattern, input, remainder] of cases) {
      const Skipped = createToken({
        name: `Fallback${pattern}`,
        pattern,
        group: Lexer.SKIPPED,
      });
      const Any = createToken({ name: `Any${pattern}`, pattern: /./ });
      const result = new Lexer([Skipped, Any], {
        positionTracking: "onlyOffset",
      }).tokenize(input);

      expect(result.errors, pattern.toString()).to.be.empty;
      expect(
        result.tokens.map((token) => token.image).join(""),
        pattern.toString(),
      ).to.equal(remainder);
    }
  });

  it("preserves tokenization and sticky lastIndex behavior", () => {
    const Whitespace = createToken({
      name: "AsciiWhitespace",
      pattern: /[ \t]+/,
      group: Lexer.SKIPPED,
    });
    const A = createToken({ name: "AsciiA", pattern: /a+/ });
    class InspectableLexer extends Lexer {
      get whitespacePattern() {
        return this.patternIdxToConfig.defaultMode[0].pattern as RegExp;
      }
    }
    const lexer = new InspectableLexer([Whitespace, A], { safeMode: true });

    expect(lexer.tokenize(" \t").tokens).to.be.empty;
    expect(lexer.whitespacePattern.lastIndex).to.equal(2);
    expect(
      lexer.tokenize("a").tokens.map((token) => token.image),
    ).to.deep.equal(["a"]);
    expect(lexer.whitespacePattern.lastIndex).to.equal(0);
  });

  it("does not scan skipped patterns with longer alternatives", () => {
    const Longer = createToken({ name: "AsciiLonger", pattern: /[ a]+/ });
    const Skipped = createToken({
      name: "AsciiSkippedLongerAlt",
      pattern: /[ a]+/,
      group: Lexer.SKIPPED,
      longer_alt: Longer,
    });

    expect(
      analyzeTokenTypes([Skipped, Longer], {}).patternIdxToConfig[0].asciiClass,
    ).to.be.undefined;
  });
});

describe("the regExp analysis", () => {
  context("first codes", () => {
    it("can compute for string literal", () => {
      expect(
        getOptimizedStartCodesIndices(
          /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
        ),
      ).to.deep.equal([34]);
    });

    it("can compute with assertions", () => {
      expect(getOptimizedStartCodesIndices(/^$\b\Ba/)).to.deep.equal([97]);
    });

    it("can compute ranges", () => {
      expect(getOptimizedStartCodesIndices(/[\n-\r]/)).to.deep.equal([
        10, 11, 12, 13,
      ]);
    });

    it("can compute with optional quantifiers", () => {
      expect(getOptimizedStartCodesIndices(/b*a/)).to.deep.equal([97, 98]);
    });

    it("will not compute when using complements", () => {
      expect(getOptimizedStartCodesIndices(/\D/)).to.be.empty;
    });

    it("Can compute for ignore case", () => {
      expect(getOptimizedStartCodesIndices(/w|A/i)).to.deep.equal([
        65, 87, 97, 119,
      ]);
    });

    it("will not compute when using complements #2", () => {
      expect(getOptimizedStartCodesIndices(/[^a-z]/, true)).to.be.empty;
    });

    it("correctly handles nested groups with and without quantifiers", () => {
      expect(getOptimizedStartCodesIndices(/(?:)c/)).to.deep.equal([99]);
      expect(getOptimizedStartCodesIndices(/((ab)?)c/)).to.deep.equal([97, 99]);
      expect(getOptimizedStartCodesIndices(/((ab))(c)/)).to.deep.equal([97]);
      expect(getOptimizedStartCodesIndices(/((ab))?c/)).to.deep.equal([97, 99]);
      expect(getOptimizedStartCodesIndices(/((a?((b?))))?c/)).to.deep.equal([
        97, 98, 99,
      ]);
      expect(getOptimizedStartCodesIndices(/((a?((b))))c/)).to.deep.equal([
        97, 98,
      ]);
      expect(getOptimizedStartCodesIndices(/((a+((b))))c/)).to.deep.equal([97]);
    });
  });

  context("can match charCode", () => {
    it("with simple character valid", () => {
      expect(canMatchCharCode([10, 13], /\n/)).to.be.true;
    });

    it("with simple character invalid", () => {
      expect(canMatchCharCode([10, 13], /a/)).to.be.false;
    });

    it("with range valid", () => {
      expect(canMatchCharCode([13], /[\n-a]/)).to.be.true;
    });

    it("with range invalid", () => {
      expect(canMatchCharCode([10, 13], /a-z/)).to.be.false;
    });

    it("with range complement valid", () => {
      expect(canMatchCharCode([13], /[^a]/)).to.be.true;
    });

    it("with range complement invalid", () => {
      expect(canMatchCharCode([13], /[^\r]/)).to.be.false;
    });
  });
});
