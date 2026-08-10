import { expect } from "chai";
import type { LookaheadSequence, TokenType } from "@chevrotain/types";
import {
  buildDenseDfaAlternativesLookAheadFunc,
  buildDenseDfaSingleAlternativeLookaheadFunction,
  buildDfaLookaheadMachine,
  denseDfaCellCount,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
  MAX_DENSE_DFA_CELLS,
} from "../src/api.js";

describe("DFA lookahead", () => {
  let nextTokenTypeIdx = 1;

  function tokenType(
    name: string,
    categories: TokenType[] = [],
    tokenTypeIdx = nextTokenTypeIdx++,
  ): TokenType {
    const token = {
      name,
      tokenTypeIdx,
      categoryMatches: [],
      categoryMatchesMap: Object.create(null),
      isParent: false,
    } as unknown as TokenType;
    for (const category of categories) {
      category.categoryMatches!.push(tokenTypeIdx);
      category.categoryMatchesMap![tokenTypeIdx] = true;
      category.isParent = true;
    }
    return token;
  }

  const EOF = tokenType("EOF", [], 0);
  const A = tokenType("DfaA");
  const B = tokenType("DfaB");
  const C = tokenType("DfaC");
  const D = tokenType("DfaD");
  const E = tokenType("DfaE");
  const F = tokenType("DfaF");
  const CategoryAB = tokenType("DfaCategoryAB");
  const CategoryBC = tokenType("DfaCategoryBC");
  const ChildA = tokenType("DfaChildA", [CategoryAB]);
  const ChildB = tokenType("DfaChildB", [CategoryAB, CategoryBC]);
  const ChildC = tokenType("DfaChildC", [CategoryBC]);
  const endings = Array.from({ length: 32 }, (_, idx) =>
    tokenType(`DfaEnding${idx}`),
  );

  class MockParser {
    constructor(private readonly input: TokenType[]) {}

    LA_FAST(howMuch: number): TokenType {
      return this.input[howMuch - 1] ?? EOF;
    }
  }

  function fanout(count: number, prefix: TokenType[] = [A]) {
    return endings
      .slice(0, count)
      .map((ending): TokenType[][] => [[...prefix, ending]]);
  }

  function nonSharedFanout(count: number) {
    return Array.from({ length: count }, (_, idx): TokenType[][] => [
      [endings[idx * 2], endings[idx * 2 + 1]],
    ]);
  }

  function buildDenseOr(alternatives: LookaheadSequence[]) {
    return buildDenseDfaAlternativesLookAheadFunc(
      buildDfaLookaheadMachine(alternatives),
    )!;
  }

  function buildDenseSingle(alternative: LookaheadSequence) {
    return buildDenseDfaSingleAlternativeLookaheadFunction(
      buildDfaLookaheadMachine([alternative]),
    )!;
  }

  function callOr(lookahead: () => number | undefined, input: TokenType[]) {
    return lookahead.call(new MockParser(input));
  }

  function callSingle(lookahead: () => boolean, input: TokenType[]) {
    return lookahead.call(new MockParser(input));
  }

  describe("profitability", () => {
    it("keeps narrow shared paths on the original implementation", () => {
      expect(isDfaLookaheadProfitable(fanout(2))).to.be.false;
      expect(isDfaLookaheadProfitable(fanout(2, [A, B]))).to.be.false;
    });

    it("selects wide and deep shared paths", () => {
      expect(isDfaLookaheadProfitable(fanout(3))).to.be.true;
      expect(isDfaLookaheadProfitable(fanout(8))).to.be.true;
      expect(isDfaLookaheadProfitable(fanout(8, [A, B]))).to.be.true;
      expect(
        isDfaLookaheadProfitable([
          [[A]],
          [[B, C]],
          [[B, D, E]],
          [[B, D, F]],
          [[C]],
        ]),
      ).to.be.true;
    });

    it("selects two paths when shared-prefix savings reach the score", () => {
      expect(isDfaLookaheadProfitable([[[A, B, C, D]], [[A, E, F]]])).to.be
        .true;
    });

    it("keeps single-token paths on the original implementation", () => {
      const alternatives = [[[A]], [[B]], [[C]], [[D]]];
      expect(isDfaLookaheadProfitable(alternatives)).to.be.false;
      expect(isDfaSingleLookaheadProfitable(alternatives.flat())).to.be.false;
    });

    it("uses a conservative threshold for single-production lookahead", () => {
      expect(isDfaSingleLookaheadProfitable(fanout(3).flat())).to.be.false;
      expect(isDfaSingleLookaheadProfitable(fanout(4).flat())).to.be.true;
      expect(isDfaSingleLookaheadProfitable(fanout(5).flat())).to.be.true;
      expect(isDfaSingleLookaheadProfitable(fanout(3, [A, B]).flat())).to.be
        .false;
      expect(isDfaSingleLookaheadProfitable(fanout(4, [A, B]).flat())).to.be
        .true;
    });

    it("selects non-shared fanout above the dense boundaries", () => {
      expect(isDfaLookaheadProfitable(nonSharedFanout(2))).to.be.false;
      expect(isDfaLookaheadProfitable(nonSharedFanout(3))).to.be.true;
      expect(isDfaSingleLookaheadProfitable(nonSharedFanout(3).flat())).to.be
        .false;
      expect(isDfaSingleLookaheadProfitable(nonSharedFanout(4).flat())).to.be
        .true;
    });

    it("keeps unusually long paths on the original implementation", () => {
      const longPath = Array.from({ length: 33 }, () => A);
      expect(isDfaLookaheadProfitable([...fanout(8), [longPath]])).to.be.false;
      expect(isDfaSingleLookaheadProfitable([...fanout(8).flat(), longPath])).to
        .be.false;
    });
  });

  describe("runtime", () => {
    it("selects alternatives through a wide shared prefix", () => {
      const lookahead = buildDenseOr(fanout(8));

      expect(callOr(lookahead, [A, endings[0]])).to.equal(0);
      expect(callOr(lookahead, [A, endings[4]])).to.equal(4);
      expect(callOr(lookahead, [A, endings[7]])).to.equal(7);
      expect(callOr(lookahead, [A, B])).to.be.undefined;
    });

    it("matches a wide single alternative", () => {
      const lookahead = buildDenseSingle(fanout(8).flat());

      expect(callSingle(lookahead, [A, endings[0]])).to.be.true;
      expect(callSingle(lookahead, [A, endings[7]])).to.be.true;
      expect(callSingle(lookahead, [A, B])).to.be.false;
    });

    it("handles overlapping categories at multiple states", () => {
      const lookahead = buildDenseOr([
        [[CategoryAB, D]],
        [[ChildB, E]],
        [[CategoryBC, F]],
      ]);

      expect(callOr(lookahead, [ChildA, D])).to.equal(0);
      expect(callOr(lookahead, [ChildB, E])).to.equal(1);
      expect(callOr(lookahead, [ChildC, F])).to.equal(2);
      expect(callOr(lookahead, [ChildB, F])).to.equal(2);
    });

    it("preserves short and empty alternative priority", () => {
      const emptyLookahead = buildDenseOr([[[A, B]], [[]], [[A, C]]]);
      expect(callOr(emptyLookahead, [A, B])).to.equal(0);
      expect(callOr(emptyLookahead, [A, C])).to.equal(1);
      expect(callOr(emptyLookahead, [D])).to.equal(1);

      const shortLookahead = buildDenseOr([[[A, B]], [[A]]]);
      expect(callOr(shortLookahead, [A, B])).to.equal(0);
      expect(callOr(shortLookahead, [A, C])).to.equal(1);
    });

    it("handles constant and missing single alternatives", () => {
      expect(callSingle(buildDenseSingle([[]]), [])).to.be.true;
      expect(callSingle(buildDenseSingle([]), [])).to.be.false;
    });

    it("handles constant and missing OR alternatives", () => {
      expect(callOr(buildDenseOr([[[]]]), [])).to.equal(0);
      expect(callOr(buildDenseOr([]), [])).to.be.undefined;
    });

    it("handles 32 alternatives in the dense representation", () => {
      const lookahead = buildDenseOr(fanout(32));

      expect(callOr(lookahead, [A, endings[31]])).to.equal(31);
      expect(callOr(lookahead, [A, B])).to.be.undefined;
    });

    it("rejects dense machines above the cell cap", () => {
      const machine = buildDfaLookaheadMachine([
        [[tokenType("Low", [], 1)]],
        [[tokenType("High", [], MAX_DENSE_DFA_CELLS + 1)]],
      ]);

      expect(denseDfaCellCount(machine)).to.equal(MAX_DENSE_DFA_CELLS + 1);
      expect(buildDenseDfaAlternativesLookAheadFunc(machine)).to.be.undefined;
    });
  });
});
