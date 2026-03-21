/**
 * Test: Multiple $.OR() calls in the same RULE without numbered variants.
 * This exercises the scenario where two OR calls share the same method name
 * and must receive unique occurrence IDs via the auto-counter.
 */
import { expect } from "chai";
import { SmartParser } from "../../src/parse/parser/parser.js";
import { createToken } from "../../src/scan/tokens_public.js";
import { Lexer } from "../../src/scan/lexer_public.js";

const A = createToken({ name: "A", pattern: /a/ });
const B = createToken({ name: "B", pattern: /b/ });
const C = createToken({ name: "C", pattern: /c/ });
const D = createToken({ name: "D", pattern: /d/ });
const E = createToken({ name: "E", pattern: /e/ });

const allTokens = [A, B, C, D, E];
const lexer = new Lexer(allTokens);

class MultipleOrParser extends SmartParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  /**
   * A rule with TWO $.OR() calls (both plain OR, no OR1/OR2).
   * Grammar: (A | B) (C | D)
   * First OR picks A or B, second OR picks C or D.
   */
  public twoOrs = this.RULE("twoOrs", () => {
    this.OR([{ ALT: () => this.CONSUME(A) }, { ALT: () => this.CONSUME(B) }]);
    this.OR([{ ALT: () => this.CONSUME(C) }, { ALT: () => this.CONSUME(D) }]);
  });

  /**
   * A rule with THREE $.OR() calls, where the first two have
   * overlapping token types with different alt counts. This tests
   * that each OR's fast-dispatch cache is truly independent.
   *
   * Grammar: (A | B | C) (A | B) (D | E)
   */
  public threeOrs = this.RULE("threeOrs", () => {
    this.OR([
      { ALT: () => this.CONSUME(A) },
      { ALT: () => this.CONSUME(B) },
      { ALT: () => this.CONSUME(C) },
    ]);
    this.OR([{ ALT: () => this.CONSUME1(A) }, { ALT: () => this.CONSUME1(B) }]);
    this.OR([{ ALT: () => this.CONSUME(D) }, { ALT: () => this.CONSUME(E) }]);
  });

  /**
   * A rule with an OR inside a MANY followed by another OR.
   * Grammar: (A | B)* (C | D)
   */
  public orInManyThenOr = this.RULE("orInManyThenOr", () => {
    this.MANY(() => {
      this.OR([{ ALT: () => this.CONSUME(A) }, { ALT: () => this.CONSUME(B) }]);
    });
    this.OR([{ ALT: () => this.CONSUME(C) }, { ALT: () => this.CONSUME(D) }]);
  });
}

describe("SmartParser multiple OR calls in the same rule", () => {
  let parser: MultipleOrParser;

  before(() => {
    parser = new MultipleOrParser();
  });

  describe("twoOrs rule", () => {
    it("can parse 'ac'", () => {
      parser.input = lexer.tokenize("ac").tokens;
      parser.twoOrs();
      expect(parser.errors).to.have.lengthOf(0);
    });

    it("can parse 'bd'", () => {
      parser.input = lexer.tokenize("bd").tokens;
      parser.twoOrs();
      expect(parser.errors).to.have.lengthOf(0);
    });

    it("can parse 'ad'", () => {
      parser.input = lexer.tokenize("ad").tokens;
      parser.twoOrs();
      expect(parser.errors).to.have.lengthOf(0);
    });

    it("can parse 'bc'", () => {
      parser.input = lexer.tokenize("bc").tokens;
      parser.twoOrs();
      expect(parser.errors).to.have.lengthOf(0);
    });
  });

  describe("threeOrs rule", () => {
    it("can parse 'aad'", () => {
      parser.input = lexer.tokenize("aad").tokens;
      parser.threeOrs();
      expect(parser.errors).to.have.lengthOf(0);
    });

    it("can parse 'cbe'", () => {
      parser.input = lexer.tokenize("cbe").tokens;
      parser.threeOrs();
      expect(parser.errors).to.have.lengthOf(0);
    });

    it("can parse 'bad'", () => {
      parser.input = lexer.tokenize("bad").tokens;
      parser.threeOrs();
      expect(parser.errors).to.have.lengthOf(0);
    });
  });

  describe("orInManyThenOr rule", () => {
    it("can parse 'c' (empty MANY, second OR)", () => {
      parser.input = lexer.tokenize("c").tokens;
      parser.orInManyThenOr();
      expect(parser.errors).to.have.lengthOf(0);
    });

    it("can parse 'abd' (MANY with two iterations, then second OR)", () => {
      parser.input = lexer.tokenize("abd").tokens;
      parser.orInManyThenOr();
      expect(parser.errors).to.have.lengthOf(0);
    });

    it("can parse 'aabbc' (MANY with four iterations, then second OR)", () => {
      parser.input = lexer.tokenize("aabbc").tokens;
      parser.orInManyThenOr();
      expect(parser.errors).to.have.lengthOf(0);
    });
  });
});
